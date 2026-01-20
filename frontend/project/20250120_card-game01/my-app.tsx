import { useEffect, useMemo, useRef, useState } from 'react'
import './my-app.css'
import { BattlePage } from './pages/battle-page'
import { CreateRoomPage } from './pages/create-room-page'
import { EntryPage } from './pages/entry-page'
import { MatchPage } from './pages/match-page'
import { ResultPage } from './pages/result-page'
import { createTranslator, getPreferredLanguage, languageStorageKey, type Language } from './i18n'
import type { GameOver, RoomState, RoundResult } from './src/types'

type Theme = 'light' | 'dark'

type Route =
  | { name: 'entry' }
  | { name: 'create' }
  | { name: 'match'; roomId: string }
  | { name: 'battle' }
  | { name: 'result' }

type MyAppProps = {
  basePath?: string
}

const normalizeBasePath = (rawBasePath: string): string => {
  const trimmed = rawBasePath.trim()
  if (!trimmed || trimmed === '/' || trimmed === './' || trimmed === '.') {
    return ''
  }

  let basePath = trimmed
  if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1)
  }
  if (!basePath.startsWith('/')) {
    basePath = `/${basePath}`
  }
  return basePath
}

const stripBasePath = (pathname: string, basePath: string): string => {
  if (!basePath) {
    return pathname
  }
  if (pathname === basePath) {
    return '/'
  }
  if (pathname.startsWith(`${basePath}/`)) {
    const rest = pathname.slice(basePath.length)
    return rest.length ? rest : '/'
  }
  return pathname
}

const buildPath = (path: string, basePath: string): string => {
  if (!basePath) {
    return path
  }
  if (path === '/') {
    return `${basePath}/`
  }
  return `${basePath}${path}`
}

const resolveRoute = (pathname: string, basePath: string): Route => {
  const path = stripBasePath(pathname, basePath)
  if (path === '/battle') {
    return { name: 'battle' }
  }

  if (path === '/result') {
    return { name: 'result' }
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

const themeStorageKey = 'card_duel_theme'

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(themeStorageKey)
  } catch (error) {
    stored = null
  }

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function MyApp({ basePath: basePathProp = '' }: MyAppProps) {
  const basePath = normalizeBasePath(basePathProp)
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())
  const [language, setLanguage] = useState<Language>(() => getPreferredLanguage())
  const [route, setRoute] = useState<Route>(() => resolveRoute(window.location.pathname, basePath))
  const [playerInfo, setPlayerInfo] = useState({
    roomId: '',
    playerName: '',
    playerId: '',
    opponentId: '',
  })
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [gameOver, setGameOver] = useState<GameOver | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingMessageRef = useRef<string | null>(null)
  const t = useMemo(() => createTranslator(language), [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(themeStorageKey, theme)
    } catch (error) {
      // Ignore write failures (private mode, restricted storage).
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(languageStorageKey, language)
    } catch (error) {
      // Ignore write failures (private mode, restricted storage).
    }
  }, [language])

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = resolveRoute(window.location.pathname, basePath)
      setRoute(nextRoute)
      if (nextRoute.name === 'entry') {
        setPlayerInfo({ roomId: '', playerName: '', playerId: '', opponentId: '' })
        setRoomState(null)
        setRoundResult(null)
        setGameOver(null)
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [basePath])

  useEffect(() => {
    if (route.name === 'match' && route.roomId !== playerInfo.roomId) {
      setPlayerInfo((prev) => ({ ...prev, roomId: route.roomId }))
    }
  }, [route, playerInfo.roomId])

  useEffect(() => {
    if (route.name !== 'battle') {
      return
    }
    if (!playerInfo.playerId || !playerInfo.roomId) {
      navigateToEntry()
    }
  }, [route.name, playerInfo.playerId, playerInfo.roomId])

  useEffect(() => {
    if (route.name !== 'result') {
      return
    }
    if (!gameOver) {
      navigateToEntry()
    }
  }, [route.name, gameOver])

  useEffect(() => {
    if (playerInfo.playerName) {
      document.title = `${playerInfo.playerName} - ${t('app.title')}`
    } else {
      document.title = t('app.title')
    }
  }, [playerInfo.playerName, t])

  const resetSession = () => {
    setPlayerInfo({ roomId: '', playerName: '', playerId: '', opponentId: '' })
    setRoomState(null)
    setRoundResult(null)
    setGameOver(null)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    pendingMessageRef.current = null
  }

  const pushPath = (path: string) => {
    const nextPath = buildPath(path, basePath)
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  const navigateToEntry = () => {
    pushPath('/')
    setRoute({ name: 'entry' })
    resetSession()
  }

  const navigateToCreate = () => {
    pushPath('/create')
    setRoute({ name: 'create' })
  }

  const navigateToMatch = (roomId: string) => {
    const path = `/match/${roomId}`
    pushPath(path)
    setRoute({ name: 'match', roomId })
  }

  const navigateToBattle = () => {
    pushPath('/battle')
    setRoute({ name: 'battle' })
  }

  const navigateToResult = () => {
    pushPath('/result')
    setRoute({ name: 'result' })
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
      if (payload.status === 'playing' && gameOver) {
        setGameOver(null)
      }
      if (roundResult && payload.round === 1 && roundResult.round > 1) {
        setRoundResult(null)
      }
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

    if (message.type === 'round_result') {
      const payload = message.payload as RoundResult
      if (!payload?.roomId) {
        return
      }
      setRoundResult(payload)
      return
    }

    if (message.type === 'game_over') {
      const payload = message.payload as GameOver
      if (!payload?.roomId) {
        return
      }
      setGameOver(payload)
      navigateToResult()
      return
    }
  }

  const connectSocket = () => {
    const existing = wsRef.current
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return existing
    }

    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = import.meta.env.DEV
      ? `ws://${window.location.host}/ws`
      : `${wsProto}://${window.location.host}/ws`
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

  const handlePlayAction = (action: 'attack' | 'defend' | 'rest') => {
    if (!playerInfo.roomId || !playerInfo.playerId || !roomState) {
      return
    }
    if (roomState.status !== 'playing') {
      return
    }

    sendMessage({
      type: 'play_action',
      payload: {
        roomId: playerInfo.roomId,
        round: roomState.round,
        playerId: playerInfo.playerId,
        action,
      },
    })
  }

  const handleRematch = () => {
    if (!playerInfo.roomId || !playerInfo.playerId) {
      return
    }
    setRoundResult(null)
    setGameOver(null)
    sendMessage({
      type: 'rematch',
      payload: {
        roomId: playerInfo.roomId,
        playerId: playerInfo.playerId,
      },
    })
    navigateToMatch(playerInfo.roomId)
  }

  const playerIndex = roomState?.players.findIndex((player) => player.playerId === playerInfo.playerId)
  const playerSide = playerIndex === 0 ? 'p1' : playerIndex === 1 ? 'p2' : null

  return (
    <div className="app">
      <div className="app__topbar">
        <button
          className="app__toggle"
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'light' ? t('toggle.theme.dark') : t('toggle.theme.light')}
        </button>
        <button
          className="app__toggle"
          type="button"
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          aria-pressed={language === 'zh'}
        >
          {language === 'zh' ? t('toggle.lang.en') : t('toggle.lang.zh')}
        </button>
      </div>
      {route.name === 'entry' ? (
        <EntryPage
          t={t}
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
          t={t}
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
          t={t}
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
          t={t}
          playerId={playerInfo.playerId}
          opponentId={playerInfo.opponentId}
          roomState={roomState}
          roundResult={roundResult}
          playerSide={playerSide}
          onPlayAction={handlePlayAction}
          onBack={navigateToEntry}
        />
      ) : null}
      {route.name === 'result' ? (
        <ResultPage
          t={t}
          playerId={playerInfo.playerId}
          playerSide={playerSide}
          gameOver={gameOver}
          onRematch={handleRematch}
          onBack={navigateToEntry}
        />
      ) : null}
    </div>
  )
}

export default MyApp
