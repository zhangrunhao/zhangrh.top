import { useEffect, useRef, useState } from 'react'
import './App.css'
import { BattlePage } from './pages/BattlePage'
import { CreateRoomPage } from './pages/CreateRoomPage'
import { EntryPage } from './pages/EntryPage'
import { MatchPage } from './pages/MatchPage'

type Route =
  | { name: 'entry' }
  | { name: 'create' }
  | { name: 'match'; roomId: string }
  | { name: 'battle' }

type RoomState = {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  round: number
  players: Array<{
    playerId: string
    name: string
    hp: number
    submitted: boolean
  }>
}

const resolveRoute = (): Route => {
  const path = window.location.pathname
  if (path === '/battle') {
    return { name: 'battle' }
  }

  if (path === '/create') {
    return { name: 'create' }
  }

  const match = path.match(/^\/match\/(\d+)$/)
  if (match) {
    return { name: 'match', roomId: match[1] }
  }

  return { name: 'entry' }
}

function App() {
  const [route, setRoute] = useState<Route>(resolveRoute)
  const [playerInfo, setPlayerInfo] = useState({
    roomId: '',
    playerName: '',
    playerId: '',
    opponentId: '',
  })
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessageRef = useRef<string | null>(null)

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = resolveRoute()
      setRoute(nextRoute)
      if (nextRoute.name === 'entry') {
        setPlayerInfo({ roomId: '', playerName: '', playerId: '', opponentId: '' })
        setRoomState(null)
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (route.name === 'match' && route.roomId !== playerInfo.roomId) {
      setPlayerInfo((prev) => ({ ...prev, roomId: route.roomId }))
    }
  }, [route, playerInfo.roomId])

  const resetSession = () => {
    setPlayerInfo({ roomId: '', playerName: '', playerId: '', opponentId: '' })
    setRoomState(null)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    pendingMessageRef.current = null
  }

  const navigateToEntry = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/')
    }
    setRoute({ name: 'entry' })
    resetSession()
  }

  const navigateToCreate = () => {
    if (window.location.pathname !== '/create') {
      window.history.pushState({}, '', '/create')
    }
    setRoute({ name: 'create' })
  }

  const navigateToMatch = (roomId: string) => {
    const path = `/match/${roomId}`
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
    setRoute({ name: 'match', roomId })
  }

  const navigateToBattle = () => {
    if (window.location.pathname !== '/battle') {
      window.history.pushState({}, '', '/battle')
    }
    setRoute({ name: 'battle' })
  }

  const handleSocketMessage = (rawMessage: string) => {
    let message
    try {
      message = JSON.parse(rawMessage)
    } catch (error) {
      return
    }

    if (!message?.type) {
      return
    }

    if (message.type === 'room_created') {
      const roomId = message.payload?.roomId || ''
      const playerId = message.payload?.playerId || ''
      setPlayerInfo((prev) => ({ ...prev, roomId, playerId }))
      if (roomId) {
        navigateToMatch(roomId)
      }
      return
    }

    if (message.type === 'room_joined') {
      const roomId = message.payload?.roomId || ''
      const playerId = message.payload?.playerId || ''
      setPlayerInfo((prev) => ({ ...prev, roomId, playerId }))
      if (roomId) {
        navigateToMatch(roomId)
      }
      return
    }

    if (message.type === 'room_state') {
      const payload = message.payload as RoomState
      if (!payload?.roomId) {
        return
      }
      setRoomState(payload)
      setPlayerInfo((prev) => {
        if (!prev.playerId) {
          return prev
        }
        const opponent = payload.players.find((entry) => entry.playerId !== prev.playerId)
        if (!opponent || opponent.playerId === prev.opponentId) {
          return prev
        }
        return { ...prev, opponentId: opponent.playerId }
      })

      if (payload.status === 'playing' && payload.players.length === 2) {
        navigateToBattle()
      }
      return
    }
  }

  const connectSocket = () => {
    const existing = wsRef.current
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return existing
    }

    const wsUrl = import.meta.env.DEV
      ? `ws://${window.location.host}/ws`
      : window.location.origin.replace(/^http/, 'ws')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      if (pendingMessageRef.current) {
        ws.send(pendingMessageRef.current)
        pendingMessageRef.current = null
      }
    })

    ws.addEventListener('message', (event) => {
      handleSocketMessage(event.data.toString())
    })

    ws.addEventListener('close', () => {
      if (wsRef.current === ws) {
        wsRef.current = null
      }
    })

    return ws
  }

  const sendMessage = (message: object) => {
    const ws = connectSocket()
    const payload = JSON.stringify(message)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
      return
    }
    pendingMessageRef.current = payload
  }

  return (
    <div className="app">
      {route.name === 'entry' ? (
        <EntryPage
          onCreate={navigateToCreate}
          onJoin={({ roomId, playerName }) => {
            setPlayerInfo({
              roomId,
              playerName,
              playerId: '',
              opponentId: '',
            })
            sendMessage({ type: 'join_room', payload: { roomId, playerName } })
            navigateToMatch(roomId)
          }}
        />
      ) : null}
      {route.name === 'create' ? (
        <CreateRoomPage
          onBack={navigateToEntry}
          onCreate={({ playerName }) => {
            setPlayerInfo({
              roomId: '',
              playerName,
              playerId: '',
              opponentId: '',
            })
            sendMessage({ type: 'create_room', payload: { playerName } })
          }}
        />
      ) : null}
      {route.name === 'match' ? (
        <MatchPage
          roomId={route.roomId}
          playerName={playerInfo.playerName}
          playerId={playerInfo.playerId}
          status={roomState?.status}
          playersCount={roomState?.players.length}
          onBack={navigateToEntry}
        />
      ) : null}
      {route.name === 'battle' ? (
        <BattlePage
          playerId={playerInfo.playerId}
          opponentId={playerInfo.opponentId}
          onBack={navigateToEntry}
        />
      ) : null}
    </div>
  )
}

export default App
