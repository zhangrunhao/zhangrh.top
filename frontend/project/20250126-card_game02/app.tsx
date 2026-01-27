import { useEffect, useMemo, useRef, useState } from 'react'

type CardType = 'A' | 'D' | 'R'

type PlayerSummary = {
  playerId: string
  name: string
  hp: number
  submitted: boolean
}

type RoomState = {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  round: number
  players: PlayerSummary[]
}

type RoundHand = {
  roomId: string
  round: number
  hand: CardType[]
  requiredPickCount: number
  deck: CardType[]
  discard: CardType[]
  opponentDeck: CardType[]
  opponentDiscard: CardType[]
}

type RoundStep = {
  index: number
  p1Card: CardType
  p2Card: CardType
  p1Delta: number
  p2Delta: number
  p1Hp: number
  p2Hp: number
}

type RoundResult = {
  roomId: string
  round: number
  p1Id: string
  p2Id: string
  steps: RoundStep[]
  p1Hp: number
  p2Hp: number
}

type GameOver = {
  roomId: string
  round: number
  result: 'p1_win' | 'p2_win' | 'draw'
  final: {
    p1: { hp: number }
    p2: { hp: number }
  }
}

type PairLog = {
  index: number
  myCard: CardType
  oppCard: CardType
  myDelta: number
  oppDelta: number
}

type RoundLog = {
  round: number
  pairs: PairLog[]
}

type Route = 'entry' | 'battle' | 'result'

type CardMeta = {
  label: string
  icon: string
  tone: 'sun' | 'wave' | 'moss'
}

const CARD_META: Record<CardType, CardMeta> = {
  A: { label: '进攻', icon: '⚔️', tone: 'sun' },
  D: { label: '防守', icon: '🛡️', tone: 'wave' },
  R: { label: '休养', icon: '🌿', tone: 'moss' },
}

const App = () => {
  const [route, setRoute] = useState<Route>('entry')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [roundHand, setRoundHand] = useState<RoundHand | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Array<number | null>>([null, null, null])
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showDelta, setShowDelta] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [roundBaseHp, setRoundBaseHp] = useState({ my: 10, opponent: 10 })
  const [roundLogs, setRoundLogs] = useState<RoundLog[]>([])
  const [gameOver, setGameOver] = useState<GameOver | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [roomId, setRoomId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const pendingMessageRef = useRef<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const dragIndexRef = useRef<{ source: 'hand' | 'selected'; index: number } | null>(null)
  const startedRef = useRef(false)
  const sessionActiveRef = useRef(false)

  const me = useMemo(() => roomState?.players.find((player) => player.playerId === playerId) ?? null, [
    roomState,
    playerId,
  ])
  const opponent = useMemo(
    () => roomState?.players.find((player) => player.playerId !== playerId) ?? null,
    [roomState, playerId],
  )

  useEffect(() => {
    if (!roundResult) {
      return
    }
    setModalOpen(true)
    setStepIndex(0)
    setShowDelta(false)
  }, [roundResult])

  useEffect(() => {
    if (!roundResult) {
      return
    }
    setRoundLogs((prev) => {
      if (prev.some((entry) => entry.round === roundResult.round)) {
        return prev
      }
      return [...prev, { round: roundResult.round, pairs: [] }]
    })
  }, [roundResult?.round])

  useEffect(() => {
    if (!modalOpen || !roundResult || !showDelta) {
      return
    }
    const step = roundResult.steps[stepIndex]
    if (!step) {
      return
    }
    const isP1 = roundResult.p1Id === playerId
    const entry: PairLog = {
      index: step.index,
      myCard: isP1 ? step.p1Card : step.p2Card,
      oppCard: isP1 ? step.p2Card : step.p1Card,
      myDelta: isP1 ? step.p1Delta : step.p2Delta,
      oppDelta: isP1 ? step.p2Delta : step.p1Delta,
    }
    setRoundLogs((prev) =>
      prev.map((roundEntry) => {
        if (roundEntry.round !== roundResult.round) {
          return roundEntry
        }
        if (roundEntry.pairs.some((pair) => pair.index === entry.index)) {
          return roundEntry
        }
        return { ...roundEntry, pairs: [...roundEntry.pairs, entry] }
      }),
    )
  }, [modalOpen, roundResult, showDelta, stepIndex, playerId])

  useEffect(() => {
    if (!modalOpen || !roundResult) {
      return
    }
    if (stepIndex >= roundResult.steps.length) {
      return
    }

    if (!showDelta) {
      const timer = window.setTimeout(() => {
        setShowDelta(true)
      }, 500)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setShowDelta(false)
      setStepIndex((prev) => prev + 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [modalOpen, roundResult, stepIndex, showDelta])

  useEffect(() => {
    if (roundHand && roomState) {
      setSelectedSlots([null, null, null])
      setRoundResult(null)
      setStepIndex(0)
      setShowDelta(false)
      const meEntry = roomState.players.find((player) => player.playerId === playerId)
      const oppEntry = roomState.players.find((player) => player.playerId !== playerId)
      if (meEntry && oppEntry) {
        setRoundBaseHp({ my: meEntry.hp, opponent: oppEntry.hp })
      }
    }
  }, [roundHand?.round, roomState?.round, playerId])

  useEffect(() => {
    if (gameOver && !modalOpen) {
      setRoute('result')
    }
  }, [gameOver, modalOpen])

  useEffect(() => {
    sessionActiveRef.current = Boolean(roomId && playerId)
  }, [roomId, playerId])

  const buildWsUrls = () => {
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsPath = '/api/20250126-card_game02/ws'
    if (import.meta.env.DEV) {
      const proxyUrl = `${wsProto}://${window.location.host}${wsPath}`
      const directUrl = `${wsProto}://${window.location.hostname}:3001${wsPath}`
      return Array.from(new Set([proxyUrl, directUrl]))
    }
    return [`${wsProto}://${window.location.host}${wsPath}`]
  }

  const connectSocket = () => {
    const existing = wsRef.current
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return existing
    }

    const urls = buildWsUrls()
    let attempt = 0
    let opened = false

    const openWithUrl = (url: string) => {
      setConnectionState('connecting')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        opened = true
        setConnectionState('connected')
        setErrorMessage(null)
        if (pendingMessageRef.current) {
          ws.send(pendingMessageRef.current)
          pendingMessageRef.current = null
        }
      })

      ws.addEventListener('message', (event) => {
        handleSocketMessage(event.data.toString())
      })

      ws.addEventListener('error', () => {
        if (!opened && attempt < urls.length - 1) {
          attempt += 1
          openWithUrl(urls[attempt])
          return
        }
        setErrorMessage('连接失败，请确认后端 3001 已启动。')
      })

      ws.addEventListener('close', () => {
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        startedRef.current = false
        setConnectionState('idle')
      })
    }

    openWithUrl(urls[attempt])
    return wsRef.current!
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

  const resetSession = () => {
    setRoomState(null)
    setRoundHand(null)
    setSelectedSlots([null, null, null])
    setRoundResult(null)
    setGameOver(null)
    setErrorMessage(null)
    setRoomId('')
    setPlayerId('')
    setRoundLogs([])
    sessionActiveRef.current = false
  }

  const handleSocketMessage = (raw: string) => {
    let message: { type: string; payload?: unknown }
    try {
      message = JSON.parse(raw)
    } catch (error) {
      return
    }

    if (message.type === 'error') {
      const payload = message.payload as { message?: string }
      setErrorMessage(payload?.message ?? '服务器错误')
      if (!sessionActiveRef.current) {
        startedRef.current = false
      }
      return
    }

    if (message.type === 'room_created' || message.type === 'room_joined') {
      const payload = message.payload as { roomId?: string; playerId?: string }
      if (payload?.roomId && payload?.playerId) {
        setRoomId(payload.roomId)
        setPlayerId(payload.playerId)
        setRoute('battle')
      }
      return
    }

    if (message.type === 'room_state') {
      const payload = message.payload as RoomState
      setRoomState(payload)
      return
    }

    if (message.type === 'round_hand') {
      const payload = message.payload as RoundHand
      setRoundHand(payload)
      return
    }

    if (message.type === 'round_result') {
      const payload = message.payload as RoundResult
      setRoundResult(payload)
      return
    }

    if (message.type === 'game_over') {
      const payload = message.payload as GameOver
      setGameOver(payload)
      return
    }
  }

  const handleStartBotMatch = () => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    const trimmedName = playerName.trim()
    sendMessage({ type: 'start_bot', payload: { playerName: trimmedName || '玩家' } })
  }

  const handleCreateRoom = () => {
    if (startedRef.current) {
      return
    }
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setErrorMessage('请先输入昵称')
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    sendMessage({ type: 'create_room', payload: { playerName: trimmedName } })
  }

  const handleJoinRoom = () => {
    if (startedRef.current) {
      return
    }
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setErrorMessage('请先输入昵称')
      return
    }
    const normalizedRoomId = joinRoomCode.trim()
    if (!/^\d{4}$/.test(normalizedRoomId)) {
      setErrorMessage('房间号需要 4 位数字')
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    sendMessage({
      type: 'join_room',
      payload: {
        roomId: normalizedRoomId,
        playerName: trimmedName,
      },
    })
  }

  const handleSubmit = () => {
    if (!roomState || !roundHand) {
      return
    }
    const required = roundHand.requiredPickCount
    const picks = selectedSlots.filter((value): value is number => value !== null)
    if (picks.length !== required) {
      return
    }
    sendMessage({
      type: 'play_cards',
      payload: {
        roomId: roomState.roomId,
        playerId,
        round: roomState.round,
        picks,
      },
    })
  }

  const handleRematch = () => {
    if (!roomId || !playerId) {
      return
    }
    setGameOver(null)
    setRoundLogs([])
    setErrorMessage(null)
    sendMessage({
      type: 'rematch',
      payload: {
        roomId,
        playerId,
      },
    })
    setRoute('battle')
  }

  const toggleSelect = (index: number) => {
    if (!roundHand || !roomState || roomState.status !== 'playing') {
      return
    }
    if (me?.submitted || modalOpen) {
      return
    }
    const required = roundHand.requiredPickCount
    setSelectedSlots((prev) => {
      if (prev.includes(index)) {
        return prev
      }
      const filled = prev.filter((value) => value !== null).length
      if (filled >= required) {
        return prev
      }
      const next = [...prev]
      const emptyIndex = next.findIndex((value) => value === null)
      if (emptyIndex === -1) {
        return prev
      }
      next[emptyIndex] = index
      return next
    })
  }

  const removeSelected = (orderIndex: number) => {
    if (me?.submitted || modalOpen) {
      return
    }
    setSelectedSlots((prev) => {
      const next = [...prev]
      next[orderIndex] = null
      return next
    })
  }

  const handleDragStart = (source: 'hand' | 'selected', index: number) => {
    dragIndexRef.current = { source, index }
  }

  const handleDrop = (index: number) => {
    const dragInfo = dragIndexRef.current
    if (!dragInfo) {
      return
    }
    setSelectedSlots((prev) => {
      const next = [...prev]
      if (dragInfo.source === 'selected') {
        if (dragInfo.index === index) {
          return prev
        }
        const temp = next[index]
        next[index] = next[dragInfo.index]
        next[dragInfo.index] = temp
        return next
      }
      if (dragInfo.source === 'hand') {
        if (next.includes(dragInfo.index)) {
          return prev
        }
        if (next[index] !== null) {
          return prev
        }
        next[index] = dragInfo.index
        return next
      }
      return prev
    })
    dragIndexRef.current = null
  }

  const iAmP1 = roundResult ? roundResult.p1Id === playerId : true

  const resolvedIndex = showDelta ? stepIndex : stepIndex - 1
  const resolvedStep =
    modalOpen && roundResult && resolvedIndex >= 0 ? roundResult.steps[resolvedIndex] : null

  const myFinalHp = resolvedStep
    ? iAmP1
      ? resolvedStep.p1Hp
      : resolvedStep.p2Hp
    : me?.hp ?? roundBaseHp.my

  const opponentFinalHp = resolvedStep
    ? iAmP1
      ? resolvedStep.p2Hp
      : resolvedStep.p1Hp
    : opponent?.hp ?? roundBaseHp.opponent

  const renderPile = (cards: CardType[] | undefined, prefix: string) => {
    if (!cards || cards.length === 0) {
      return <span className="empty">空</span>
    }
    return (
      <div className="pile-cards">
        {cards.map((card, index) => {
          const meta = CARD_META[card]
          return (
            <span key={`${prefix}-${card}-${index}`} className={`chip chip-${meta.tone}`}>
              {meta.icon} {card}
            </span>
          )
        })}
      </div>
    )
  }

  const renderStepLine = (step: RoundStep, index: number) => {
    const isResolved = index < stepIndex || (index === stepIndex && showDelta)
    const isCurrent = index === stepIndex
    const myCard = iAmP1 ? step.p1Card : step.p2Card
    const oppCard = iAmP1 ? step.p2Card : step.p1Card
    const myDelta = iAmP1 ? step.p1Delta : step.p2Delta
    const oppDelta = iAmP1 ? step.p2Delta : step.p1Delta

    return (
      <div key={step.index} className={`modal-line ${isResolved ? 'resolved' : ''} ${isCurrent ? 'current' : ''}`}>
        <div className="modal-line-title">第 {step.index} 对</div>
        <div className="modal-line-cards">
          <span>{CARD_META[myCard].icon} {myCard}</span>
          <span className="vs">vs</span>
          <span>{isResolved ? `${CARD_META[oppCard].icon} ${oppCard}` : '？'}</span>
        </div>
        {isResolved ? (
          <div className="modal-line-delta">
            <span>我方 {myDelta >= 0 ? '+' : ''}{myDelta}</span>
            <span>对手 {oppDelta >= 0 ? '+' : ''}{oppDelta}</span>
          </div>
        ) : (
          <div className="modal-line-delta pending">等待结算…</div>
        )}
      </div>
    )
  }

  const selectedCount = selectedSlots.filter((value) => value !== null).length
  const canSubmit =
    roundHand &&
    roomState?.status === 'playing' &&
    !me?.submitted &&
    !modalOpen &&
    selectedCount === roundHand.requiredPickCount
  const displayRoomId = roomState?.roomId ?? roomId

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Demo2 · 抽 5 选 3 排序</p>
          <h1>Card Clash: 15 张固定牌组</h1>
          <p className="subtitle">节奏短促、三连对冲、10 回合定胜负。</p>
        </div>
        <div className="status-pill">
          {connectionState === 'connected' ? '已连接' : connectionState === 'connecting' ? '连接中' : '未连接'}
        </div>
      </header>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>对冲结算</h3>
            <div className="modal-lines">
              {roundResult?.steps.map((step, index) => renderStepLine(step, index))}
            </div>
            <p className="modal-step">
              {roundResult && stepIndex < roundResult.steps.length
                ? `进行中：第 ${Math.min(stepIndex + 1, roundResult.steps.length)} 对`
                : '本回合结算完成'}
            </p>

            {roundResult && stepIndex >= roundResult.steps.length && (
              <button
                className="primary"
                onClick={() => {
                  if (roomState && playerId && !gameOver) {
                    sendMessage({
                      type: 'round_confirm',
                      payload: {
                        roomId: roomState.roomId,
                        playerId,
                        round: roomState.round,
                      },
                    })
                  }
                  setModalOpen(false)
                  setShowDelta(false)
                  setStepIndex(0)
                  setRoundHand(null)
                }}
              >
                确定
              </button>
            )}
          </div>
        </div>
      )}

      {route === 'entry' && (
        <section className="panel entry">
          <div>
            <h2>准备开始</h2>
            <p>先输入昵称，然后创建房间或输入房间号加入。</p>
          </div>
          <div className="entry-form">
            <label>
              昵称
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="例如：小张"
                maxLength={20}
              />
            </label>
            <div className="actions">
              <button className="primary" onClick={handleCreateRoom}>
                创建房间
              </button>
              <button className="ghost" onClick={handleStartBotMatch}>
                人机对战
              </button>
            </div>
            <label>
              房间号（4 位数字）
              <input
                value={joinRoomCode}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 4)
                  setJoinRoomCode(digitsOnly)
                }}
                inputMode="numeric"
                placeholder="例如：1234"
              />
            </label>
            <button className="primary" onClick={handleJoinRoom}>
              加入房间
            </button>
            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>
        </section>
      )}

      {route === 'battle' && (
        <section className="battle">
          <div className="panel info">
            <div>
              <h2>对局状态</h2>
              <p>
                当前回合 <strong>{roomState?.round ?? 1}</strong> / 10
              </p>
              <p className="helper">房间号：{displayRoomId || '—'}</p>
              {roomState?.status === 'waiting' && (
                <p className="helper">等待另一位玩家加入…</p>
              )}
            </div>
            <div className="hp-grid">
              <div>
                <span className="label">我方</span>
                <span className="value">{myFinalHp}</span>
              </div>
              <div>
                <span className="label">对手</span>
                <span className="value">{opponentFinalHp}</span>
              </div>
            </div>
          </div>
          {errorMessage && <div className="panel error-panel">{errorMessage}</div>}

          <div className="panel hand">
              <div className="panel-header">
                <div>
                  <h3>本回合抽到的 5 张</h3>
                  <p>点选 3 张进入已选区，并拖拽排序。</p>
                </div>
                <div className="helper">
                已选 {selectedCount}/{roundHand?.requiredPickCount ?? 3}
                </div>
              </div>

            <div className="selected">
              <h4>已选序列</h4>
              <div className="selected-row">
                {[0, 1, 2].map((slot) => {
                  const handIndex = selectedSlots[slot]
                  if (handIndex === null || handIndex === undefined) {
                    return (
                      <div
                        key={`slot-${slot}`}
                        className="selected-slot"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(slot)}
                    >
                      <span className="order">{slot + 1}</span>
                      <span className="placeholder">空位</span>
                      </div>
                    )
                  }
                  const card = roundHand?.hand[handIndex]
                  if (!card) {
                    return null
                  }
                  const meta = CARD_META[card]
                  return (
                    <div
                      key={`${card}-${slot}`}
                      className={`selected-card card-${meta.tone}`}
                      draggable={!me?.submitted}
                      data-tip={`${meta.label}（${card}）`}
                      onDragStart={() => handleDragStart('selected', slot)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(slot)}
                    >
                      <span className="order">{slot + 1}</span>
                      <span className="icon">{meta.icon}</span>
                      <span className="title">{meta.label}</span>
                      <span className="tag">{card}</span>
                      <button
                        type="button"
                        className="remove"
                        onClick={() => removeSelected(slot)}
                        aria-label="移除"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
                <div className="actions inline">
                  <button className="primary" onClick={handleSubmit} disabled={!canSubmit}>
                    出牌
                  </button>
                  <span className="helper">
                    {me?.submitted ? '已提交，等待对手…' : '选满后即可出牌'}
                  </span>
                </div>
              </div>
            </div>

            <div className="cards">
              {roundHand?.hand.map((card, index) => {
                const meta = CARD_META[card]
                const isSelected = selectedSlots.includes(index)
                if (isSelected) {
                  return null
                }
                return (
                  <button
                    key={`${card}-${index}`}
                    className={`card card-${meta.tone} ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelect(index)}
                    type="button"
                    disabled={Boolean(me?.submitted)}
                    data-tip={`${meta.label}（${card}）`}
                    draggable={!me?.submitted}
                    onDragStart={() => handleDragStart('hand', index)}
                  >
                    <span className="icon">{meta.icon}</span>
                    <span className="title">{meta.label}</span>
                    <span className="tag">{card}</span>
                    {isSelected && <span className="badge">已选</span>}
                  </button>
                )
              })}
              {!roundHand && <p className="placeholder">等待发牌…</p>}
              {roundHand && roundHand.hand.every((_card, index) => selectedSlots.includes(index)) && (
                <p className="placeholder">已全部选入序列</p>
              )}
            </div>

          </div>

          <div className="panel piles">
            <div className="panel-header">
              <div>
                <h3>抽牌堆 / 弃牌堆</h3>
                <p>显示本回合开始时双方牌库与弃牌堆内容。</p>
              </div>
              <div className="helper">牌库剩余：{roundHand?.deck?.length ?? 0}</div>
            </div>
            <div className="pile-grid">
              <div className="pile">
                <h4>我方抽牌堆</h4>
                {renderPile(roundHand?.deck, 'my-deck')}
              </div>
              <div className="pile">
                <h4>我方弃牌堆</h4>
                {renderPile(roundHand?.discard, 'my-discard')}
              </div>
            </div>
          </div>

          <div className="panel log">
            <div className="panel-header">
              <div>
                <h3>对冲记录</h3>
                <p>10 回合内每一回合、每一对的结算都会被保留。</p>
              </div>
            </div>
            {roundLogs.length === 0 && <p className="placeholder">暂无记录，等待第一回合结算…</p>}
            {roundLogs.map((roundEntry) => (
              <div key={roundEntry.round} className="log-round">
                <h4>第 {roundEntry.round} 回合</h4>
                <div className="log-lines">
                  {roundEntry.pairs.map((pair) => (
                    <div key={`${roundEntry.round}-${pair.index}`} className="log-line">
                      <span className="log-index">#{pair.index}</span>
                      <span className="log-cards">
                        {CARD_META[pair.myCard].icon} {pair.myCard} <span className="vs">vs</span>{' '}
                        {CARD_META[pair.oppCard].icon} {pair.oppCard}
                      </span>
                      <span className="log-delta">
                        我方 {pair.myDelta >= 0 ? '+' : ''}{pair.myDelta} · 对手 {pair.oppDelta >= 0 ? '+' : ''}{pair.oppDelta}
                      </span>
                    </div>
                  ))}
                  {roundEntry.pairs.length === 0 && <p className="placeholder">等待结算…</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {route === 'result' && (
        <section className="panel result">
          <h2>对局结束</h2>
          <p className="result-title">
            {gameOver?.result === 'draw'
              ? '平局'
              : gameOver?.result === (iAmP1 ? 'p1_win' : 'p2_win')
                ? '胜利'
                : '失败'}
          </p>
          <div className="result-grid">
            <div>
              <span className="label">我方最终血量</span>
              <span className="value">{myFinalHp}</span>
            </div>
            <div>
              <span className="label">对手最终血量</span>
              <span className="value">{opponentFinalHp}</span>
            </div>
          </div>
          <p className="hint">回合数：{gameOver?.round ?? roomState?.round ?? 0}</p>
          <div className="actions">
            <button className="primary" onClick={handleRematch}>
              再来一局
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
