import http from 'http'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const rooms = new Map()
const ACTIONS = new Set(['attack', 'defend', 'rest'])

const clampHp = (value) => Math.max(0, Math.min(10, value))

const generateRoomId = () => {
  let roomId = ''
  do {
    roomId = String(Math.floor(1000 + Math.random() * 9000))
  } while (rooms.has(roomId))
  return roomId
}

const generatePlayerId = () => `user_${Math.random().toString(36).slice(2, 8)}`

const send = (ws, message) => {
  if (!ws || ws.readyState !== 1) {
    return
  }
  ws.send(JSON.stringify(message))
}

const sendError = (ws, message) => {
  send(ws, { type: 'error', payload: { message } })
}

const buildRoomState = (room) => ({
  roomId: room.roomId,
  status: room.status,
  round: room.round,
  players: room.players.map((player) => ({
    playerId: player.playerId,
    name: player.name,
    hp: player.hp,
    submitted: Boolean(room.actions[player.playerId]),
  })),
})

const broadcastRoomState = (room) => {
  const payload = buildRoomState(room)
  room.players.forEach((player) => {
    send(player.ws, { type: 'room_state', payload })
  })
}

const broadcastToRoom = (room, message) => {
  room.players.forEach((player) => {
    send(player.ws, message)
  })
}

const resolveDeltas = (action1, action2) => {
  if (action1 === 'attack' && action2 === 'attack') {
    return [-2, -2]
  }
  if (action1 === 'attack' && action2 === 'defend') {
    return [0, 0]
  }
  if (action1 === 'attack' && action2 === 'rest') {
    return [0, -2]
  }
  if (action1 === 'defend' && action2 === 'attack') {
    return [0, 0]
  }
  if (action1 === 'defend' && action2 === 'defend') {
    return [0, 0]
  }
  if (action1 === 'defend' && action2 === 'rest') {
    return [0, 1]
  }
  if (action1 === 'rest' && action2 === 'attack') {
    return [-2, 0]
  }
  if (action1 === 'rest' && action2 === 'defend') {
    return [1, 0]
  }
  return [1, 1]
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', payload: { message: 'ws ready' } }))

  ws.on('message', (data) => {
    let message
    try {
      message = JSON.parse(data.toString())
    } catch (error) {
      sendError(ws, 'Invalid JSON payload.')
      return
    }

    const { type, payload } = message || {}
    if (!type) {
      sendError(ws, 'Missing message type.')
      return
    }

    if (type === 'create_room') {
      const playerName = payload?.playerName?.trim()
      if (!playerName) {
        sendError(ws, 'Player name is required.')
        return
      }

      const requestedRoomId = payload?.roomId
      const roomId =
        typeof requestedRoomId === 'string' && /^\d{4}$/.test(requestedRoomId) && !rooms.has(requestedRoomId)
          ? requestedRoomId
          : generateRoomId()
      const playerId = payload?.playerId?.trim() || generatePlayerId()

      const room = {
        roomId,
        round: 1,
        status: 'waiting',
        players: [{ playerId, name: playerName, hp: 10, ws }],
        actions: {},
        rematchReady: new Set(),
      }

      rooms.set(roomId, room)
      ws.roomId = roomId
      ws.playerId = playerId

      send(ws, { type: 'room_created', payload: { roomId, playerId } })
      broadcastRoomState(room)
      return
    }

    if (type === 'join_room') {
      const roomId = payload?.roomId
      const playerName = payload?.playerName?.trim()
      if (!roomId || typeof roomId !== 'string') {
        sendError(ws, 'Room ID is required.')
        return
      }
      if (!playerName) {
        sendError(ws, 'Player name is required.')
        return
      }

      const room = rooms.get(roomId)
      if (!room) {
        sendError(ws, 'Room not found.')
        return
      }
      if (room.status === 'finished') {
        sendError(ws, 'Room already finished.')
        return
      }
      if (room.players.length >= 2) {
        sendError(ws, 'Room is full.')
        return
      }

      const playerId = payload?.playerId?.trim() || generatePlayerId()
      room.players.push({ playerId, name: playerName, hp: 10, ws })
      room.status = room.players.length === 2 ? 'playing' : 'waiting'

      ws.roomId = roomId
      ws.playerId = playerId

      send(ws, { type: 'room_joined', payload: { roomId, playerId } })
      broadcastRoomState(room)
      return
    }

    if (type === 'play_action') {
      const roomId = payload?.roomId
      const playerId = payload?.playerId
      const action = payload?.action
      const round = payload?.round

      if (!roomId || !playerId) {
        sendError(ws, 'Room ID and player ID are required.')
        return
      }

      const room = rooms.get(roomId)
      if (!room) {
        sendError(ws, 'Room not found.')
        return
      }
      if (room.status === 'finished') {
        sendError(ws, 'Game is already finished.')
        return
      }
      if (round && round !== room.round) {
        sendError(ws, 'Round mismatch.')
        return
      }
      if (!ACTIONS.has(action)) {
        sendError(ws, 'Invalid action.')
        return
      }

      const player = room.players.find((entry) => entry.playerId === playerId)
      if (!player) {
        sendError(ws, 'Player not in room.')
        return
      }

      if (room.actions[playerId]) {
        sendError(ws, 'Action already submitted.')
        return
      }

      room.actions[playerId] = action
      broadcastRoomState(room)

      if (room.players.length < 2) {
        return
      }

      const actions = room.players.map((entry) => room.actions[entry.playerId])
      if (actions.some((value) => !value)) {
        return
      }

      const [p1, p2] = room.players
      const [delta1, delta2] = resolveDeltas(actions[0], actions[1])
      p1.hp = clampHp(p1.hp + delta1)
      p2.hp = clampHp(p2.hp + delta2)

      broadcastToRoom(room, {
        type: 'round_result',
        payload: {
          roomId: room.roomId,
          round: room.round,
          p1: { action: actions[0], delta: delta1, hp: p1.hp },
          p2: { action: actions[1], delta: delta2, hp: p2.hp },
        },
      })

      const shouldFinish = p1.hp === 0 || p2.hp === 0 || room.round >= 10
      room.actions = {}

      if (shouldFinish) {
        room.status = 'finished'
        broadcastRoomState(room)

        let result = 'draw'
        if (p1.hp > p2.hp) {
          result = 'p1_win'
        } else if (p2.hp > p1.hp) {
          result = 'p2_win'
        }

        broadcastToRoom(room, {
          type: 'game_over',
          payload: {
            roomId: room.roomId,
            round: room.round,
            result,
            final: {
              p1: { hp: p1.hp },
              p2: { hp: p2.hp },
            },
          },
        })
        return
      }

      room.round += 1
      broadcastRoomState(room)
      return
    }

    if (type === 'rematch') {
      const roomId = payload?.roomId
      const playerId = payload?.playerId
      if (!roomId || !playerId) {
        sendError(ws, 'Room ID and player ID are required.')
        return
      }

      const room = rooms.get(roomId)
      if (!room) {
        sendError(ws, 'Room not found.')
        return
      }
      if (room.status === 'playing') {
        sendError(ws, 'Rematch is only available after game over.')
        return
      }

      room.rematchReady.add(playerId)
      room.status = 'waiting'
      broadcastRoomState(room)

      if (room.rematchReady.size < 2) {
        return
      }

      room.round = 1
      room.status = 'playing'
      room.actions = {}
      room.players.forEach((player) => {
        player.hp = 10
      })
      room.rematchReady.clear()
      broadcastRoomState(room)
      return
    }

    sendError(ws, `Unknown message type: ${type}`)
  })

  ws.on('close', () => {
    const roomId = ws.roomId
    if (!roomId) {
      return
    }

    const room = rooms.get(roomId)
    if (!room) {
      return
    }

    room.players = room.players.filter((player) => player.ws !== ws)
    room.actions = {}
    room.status = room.players.length === 2 ? 'playing' : 'waiting'
    if (room.rematchReady) {
      room.rematchReady.delete(ws.playerId)
    }

    if (room.players.length === 0) {
      rooms.delete(roomId)
      return
    }

    broadcastRoomState(room)
  })
})

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
