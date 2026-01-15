import { useEffect, useState } from 'react'
import type { RoomState, RoundResult } from '../types'

const actionCards = [
  {
    id: 'attack',
    title: 'Attack',
    description: 'Strike hard to pressure your opponent.',
  },
  {
    id: 'defend',
    title: 'Defend',
    description: 'Brace yourself and reduce losses.',
  },
  {
    id: 'rest',
    title: 'Rest',
    description: 'Recover and prepare for the next exchange.',
  },
]

type BattlePageProps = {
  playerId: string
  opponentId: string
  roomState: RoomState | null
  roundResult: RoundResult | null
  playerSide: 'p1' | 'p2' | null
  onPlayAction: (action: 'attack' | 'defend' | 'rest') => void
  onBack: () => void
}

export function BattlePage({
  playerId,
  opponentId,
  roomState,
  roundResult,
  playerSide,
  onPlayAction,
  onBack,
}: BattlePageProps) {
  const round = roomState?.round ?? 1
  const players = roomState?.players ?? []
  const self = players.find((player) => player.playerId === playerId)
  const opponent = players.find((player) => player.playerId !== playerId)
  const isSubmitted = self?.submitted ?? false
  const status = roomState?.status ?? 'waiting'
  const [selectedAction, setSelectedAction] = useState<'attack' | 'defend' | 'rest' | null>(null)
  const [pendingReveal, setPendingReveal] = useState<RoundResult | null>(null)
  const [revealedResult, setRevealedResult] = useState<RoundResult | null>(null)
  const [isRevealOpen, setIsRevealOpen] = useState(false)

  const displayPlayerName = self?.name || 'Unknown'
  const displayPlayerId = playerId || 'pending'
  const displayOpponentName = opponent?.name || 'Unknown'
  const displayOpponentId = opponent?.playerId || opponentId || 'pending'
  const playerHp = self?.hp ?? 10
  const opponentHp = opponent?.hp ?? 10

  useEffect(() => {
    if (!roundResult) {
      return
    }
    if (revealedResult?.round === roundResult.round) {
      return
    }
    setPendingReveal(roundResult)
    setIsRevealOpen(true)
  }, [roundResult, revealedResult?.round])

  const latestResult =
    revealedResult && roomState && revealedResult.round <= roomState.round ? revealedResult : null
  const isPlayerOne = playerSide ? playerSide === 'p1' : true
  const formatAction = (action: 'attack' | 'defend' | 'rest') =>
    action.charAt(0).toUpperCase() + action.slice(1)

  const youResult = latestResult
    ? isPlayerOne
      ? latestResult.p1
      : latestResult.p2
    : null
  const opponentResult = latestResult
    ? isPlayerOne
      ? latestResult.p2
      : latestResult.p1
    : null
  const youBeforeHp = youResult ? youResult.hp - youResult.delta : playerHp
  const opponentBeforeHp = opponentResult ? opponentResult.hp - opponentResult.delta : opponentHp
  const pendingYou = pendingReveal ? (isPlayerOne ? pendingReveal.p1 : pendingReveal.p2) : null
  const pendingOpponent = pendingReveal ? (isPlayerOne ? pendingReveal.p2 : pendingReveal.p1) : null
  const isRevealing = Boolean(isRevealOpen && pendingYou && pendingOpponent)
  const displayPlayerHp = isRevealing && pendingYou ? pendingYou.hp - pendingYou.delta : playerHp
  const displayOpponentHp = isRevealing && pendingOpponent
    ? pendingOpponent.hp - pendingOpponent.delta
    : opponentHp

  const clampHp = (value: number) => Math.max(0, Math.min(10, value))
  const playerHpPercent = `${(clampHp(displayPlayerHp) / 10) * 100}%`
  const opponentHpPercent = `${(clampHp(displayOpponentHp) / 10) * 100}%`

  useEffect(() => {
    setSelectedAction(null)
  }, [roomState?.round])

  const handleSelect = (action: 'attack' | 'defend' | 'rest') => {
    if (isSubmitted || status !== 'playing') {
      return
    }
    setSelectedAction(action)
    onPlayAction(action)
  }

  const handleConfirmReveal = () => {
    if (!pendingReveal) {
      return
    }
    setRevealedResult(pendingReveal)
    setIsRevealOpen(false)
    setPendingReveal(null)
  }

  return (
    <section className="battle">
      <header className="battle__header">
        <div>
          <p className="battle__eyebrow">Round {round} / 10</p>
          <h1 className="battle__title">Duel in Progress</h1>
          <p className="battle__subtitle">Choose a card and wait for your opponent.</p>
        </div>
        <div className="battle__round">
          <span className="battle__round-label">Current</span>
          <span className="battle__round-value">{round}</span>
        </div>
      </header>
      <div className="battle__nav">
        <button className="battle__back" onClick={onBack}>
          Back to Lobby
        </button>
      </div>

      <div className="battle__players">
        <div className="battle__player-card">
          <p className="battle__player-role">You</p>
          <p className="battle__player-name">{displayPlayerName}</p>
          <p className="battle__player-id">ID {displayPlayerId}</p>
          <p className="battle__hp">HP {displayPlayerHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: playerHpPercent }} />
          </p>
        </div>
        <div className="battle__player-card battle__player-card--opponent">
          <p className="battle__player-role">Opponent</p>
          <p className="battle__player-name">{displayOpponentName}</p>
          <p className="battle__player-id">ID {displayOpponentId}</p>
          <p className="battle__hp">HP {displayOpponentHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: opponentHpPercent }} />
          </p>
        </div>
      </div>

      <section className="battle__actions">
        <h2 className="battle__section-title">Choose Your Card</h2>
        <div className="battle__cards">
          {actionCards.map((card) => (
            <button
              className={`battle__card${
                selectedAction === card.id ? ' battle__card--selected' : ''
              }${isSubmitted || status !== 'playing' ? ' battle__card--disabled' : ''}`}
              key={card.id}
              onClick={() => handleSelect(card.id as 'attack' | 'defend' | 'rest')}
              disabled={isSubmitted || status !== 'playing'}
            >
              <span className="battle__card-title">{card.title}</span>
              <span className="battle__card-desc">{card.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="battle__status">
        <div className="battle__status-panel">
          <h3 className="battle__status-title">
            {isSubmitted ? 'Waiting for opponent' : 'Your move'}
          </h3>
          <p className="battle__status-text">
            {isSubmitted ? 'Card locked in. Await the other player.' : 'Pick a card to submit.'}
          </p>
          {selectedAction ? (
            <p className="battle__status-text">Selected: {selectedAction}</p>
          ) : null}
        </div>
        <div className="battle__status-panel battle__status-panel--result">
          <h3 className="battle__status-title">
            {latestResult ? `Round ${latestResult.round} Reveal` : 'Latest Result'}
          </h3>
          {latestResult && youResult && opponentResult ? (
            <>
              <div className="battle__reveal">
                <div className="battle__reveal-side">
                  <p className="battle__reveal-label">You</p>
                  <p className="battle__reveal-name">{displayPlayerName}</p>
                  <span className="battle__reveal-card">{formatAction(youResult.action)}</span>
                  <p className="battle__reveal-delta">
                    ΔHP {youResult.delta > 0 ? '+' : ''}
                    {youResult.delta}
                  </p>
                  <p className="battle__reveal-hp">
                    HP {youBeforeHp} → {youResult.hp}
                  </p>
                </div>
                <div className="battle__reveal-vs">VS</div>
                <div className="battle__reveal-side">
                  <p className="battle__reveal-label">Opponent</p>
                  <p className="battle__reveal-name">{displayOpponentName}</p>
                  <span className="battle__reveal-card">{formatAction(opponentResult.action)}</span>
                  <p className="battle__reveal-delta">
                    ΔHP {opponentResult.delta > 0 ? '+' : ''}
                    {opponentResult.delta}
                  </p>
                  <p className="battle__reveal-hp">
                    HP {opponentBeforeHp} → {opponentResult.hp}
                  </p>
                </div>
              </div>
              <p className="battle__status-text">
                Net: You {youResult.delta > 0 ? '+' : ''}
                {youResult.delta}, Opponent {opponentResult.delta > 0 ? '+' : ''}
                {opponentResult.delta}
              </p>
            </>
          ) : (
            <p className="battle__status-text">Results will appear after both players act.</p>
          )}
        </div>
      </section>
      {isRevealOpen && pendingReveal ? (
        <div className="battle__reveal-overlay">
          <div className="battle__reveal-modal">
            <h3 className="battle__reveal-title">Round {pendingReveal.round} Reveal</h3>
            <div className="battle__reveal-grid">
              <div className="battle__reveal-side">
                <p className="battle__reveal-label">You</p>
                <p className="battle__reveal-name">{displayPlayerName}</p>
                <span className="battle__reveal-card">
                  {formatAction(isPlayerOne ? pendingReveal.p1.action : pendingReveal.p2.action)}
                </span>
                <p className="battle__reveal-delta">
                  ΔHP {(isPlayerOne ? pendingReveal.p1.delta : pendingReveal.p2.delta) > 0 ? '+' : ''}
                  {isPlayerOne ? pendingReveal.p1.delta : pendingReveal.p2.delta}
                </p>
              </div>
              <div className="battle__reveal-vs">VS</div>
              <div className="battle__reveal-side">
                <p className="battle__reveal-label">Opponent</p>
                <p className="battle__reveal-name">{displayOpponentName}</p>
                <span className="battle__reveal-card">
                  {formatAction(isPlayerOne ? pendingReveal.p2.action : pendingReveal.p1.action)}
                </span>
                <p className="battle__reveal-delta">
                  ΔHP {(isPlayerOne ? pendingReveal.p2.delta : pendingReveal.p1.delta) > 0 ? '+' : ''}
                  {isPlayerOne ? pendingReveal.p2.delta : pendingReveal.p1.delta}
                </p>
              </div>
            </div>
            <button className="battle__reveal-confirm" onClick={handleConfirmReveal}>
              Confirm
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
