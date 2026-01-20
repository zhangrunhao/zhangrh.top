import { useEffect, useState } from 'react'
import type { Translator } from '../src/i18n'
import type { RoomState, RoundResult } from '../src/types'

const actionKeyMap = {
  attack: 'action.attack',
  defend: 'action.defend',
  rest: 'action.rest',
} as const

type BattlePageProps = {
  t: Translator
  playerId: string
  opponentId: string
  roomState: RoomState | null
  roundResult: RoundResult | null
  playerSide: 'p1' | 'p2' | null
  onPlayAction: (action: 'attack' | 'defend' | 'rest') => void
  onBack: () => void
}

export function BattlePage({
  t,
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

  const actionCards = [
    {
      id: 'attack',
      title: t('action.attack'),
      description: t('action.attack_desc'),
    },
    {
      id: 'defend',
      title: t('action.defend'),
      description: t('action.defend_desc'),
    },
    {
      id: 'rest',
      title: t('action.rest'),
      description: t('action.rest_desc'),
    },
  ]

  const displayPlayerName = self?.name || t('battle.unknown')
  const displayPlayerId = playerId || t('battle.pending')
  const displayOpponentName = opponent?.name || t('battle.unknown')
  const displayOpponentId = opponent?.playerId || opponentId || t('battle.pending')
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
  const formatAction = (action: 'attack' | 'defend' | 'rest') => t(actionKeyMap[action])

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
          <p className="battle__eyebrow">
            {t('battle.round')} {round} / 10
          </p>
          <h1 className="battle__title">{t('battle.title')}</h1>
          <p className="battle__subtitle">{t('battle.subtitle')}</p>
        </div>
        <div className="battle__round">
          <span className="battle__round-label">{t('battle.current')}</span>
          <span className="battle__round-value">{round}</span>
        </div>
      </header>
      <div className="battle__nav">
        <button className="battle__back" onClick={onBack}>
          {t('battle.back')}
        </button>
      </div>

      <div className="battle__players">
        <div className="battle__player-card">
          <p className="battle__player-role">{t('battle.you')}</p>
          <p className="battle__player-name">{displayPlayerName}</p>
          <p className="battle__player-id">
            {t('battle.id')} {displayPlayerId}
          </p>
          <p className="battle__hp">
            {t('battle.hp')} {displayPlayerHp}
          </p>
          <p className="battle__hp-bar">
            <span style={{ width: playerHpPercent }} />
          </p>
        </div>
        <div className="battle__player-card battle__player-card--opponent">
          <p className="battle__player-role">{t('battle.opponent')}</p>
          <p className="battle__player-name">{displayOpponentName}</p>
          <p className="battle__player-id">
            {t('battle.id')} {displayOpponentId}
          </p>
          <p className="battle__hp">
            {t('battle.hp')} {displayOpponentHp}
          </p>
          <p className="battle__hp-bar">
            <span style={{ width: opponentHpPercent }} />
          </p>
        </div>
      </div>

      <section className="battle__actions">
        <h2 className="battle__section-title">{t('battle.choose_card')}</h2>
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
            {isSubmitted ? t('battle.waiting') : t('battle.your_move')}
          </h3>
          <p className="battle__status-text">
            {isSubmitted ? t('battle.locked') : t('battle.pick')}
          </p>
          {selectedAction ? (
            <p className="battle__status-text">
              {t('battle.selected')}: {formatAction(selectedAction)}
            </p>
          ) : null}
        </div>
        <div className="battle__status-panel battle__status-panel--result">
          <h3 className="battle__status-title">
            {latestResult
              ? `${t('battle.round')} ${latestResult.round} ${t('battle.result')}`
              : t('battle.latest_result')}
          </h3>
          {latestResult && youResult && opponentResult ? (
            <>
              <div className="battle__reveal">
                <div className="battle__reveal-side">
                  <p className="battle__reveal-label">{t('battle.you')}</p>
                  <p className="battle__reveal-name">{displayPlayerName}</p>
                  <span className="battle__reveal-card">{formatAction(youResult.action)}</span>
                  <p className="battle__reveal-delta">
                    ΔHP {youResult.delta > 0 ? '+' : ''}
                    {youResult.delta}
                  </p>
                  <p className="battle__reveal-hp">
                    {t('battle.hp')} {youBeforeHp} → {youResult.hp}
                  </p>
                </div>
                <div className="battle__reveal-vs">{t('battle.vs')}</div>
                <div className="battle__reveal-side">
                  <p className="battle__reveal-label">{t('battle.opponent')}</p>
                  <p className="battle__reveal-name">{displayOpponentName}</p>
                  <span className="battle__reveal-card">{formatAction(opponentResult.action)}</span>
                  <p className="battle__reveal-delta">
                    ΔHP {opponentResult.delta > 0 ? '+' : ''}
                    {opponentResult.delta}
                  </p>
                  <p className="battle__reveal-hp">
                    {t('battle.hp')} {opponentBeforeHp} → {opponentResult.hp}
                  </p>
                </div>
              </div>
              <p className="battle__status-text">
                {t('battle.net')}: {t('battle.you')} {youResult.delta > 0 ? '+' : ''}
                {youResult.delta}, {t('battle.opponent')} {opponentResult.delta > 0 ? '+' : ''}
                {opponentResult.delta}
              </p>
            </>
          ) : (
            <p className="battle__status-text">{t('battle.results_pending')}</p>
          )}
        </div>
      </section>
      {isRevealOpen && pendingReveal ? (
        <div className="battle__reveal-overlay">
          <div className="battle__reveal-modal">
            <h3 className="battle__reveal-title">
              {t('battle.round')} {pendingReveal.round} {t('battle.result')}
            </h3>
            <div className="battle__reveal-grid">
              <div className="battle__reveal-side">
                <p className="battle__reveal-label">{t('battle.you')}</p>
                <p className="battle__reveal-name">{displayPlayerName}</p>
                <span className="battle__reveal-card">
                  {formatAction(isPlayerOne ? pendingReveal.p1.action : pendingReveal.p2.action)}
                </span>
                <p className="battle__reveal-delta">
                  ΔHP {(isPlayerOne ? pendingReveal.p1.delta : pendingReveal.p2.delta) > 0 ? '+' : ''}
                  {isPlayerOne ? pendingReveal.p1.delta : pendingReveal.p2.delta}
                </p>
              </div>
              <div className="battle__reveal-vs">{t('battle.vs')}</div>
              <div className="battle__reveal-side">
                <p className="battle__reveal-label">{t('battle.opponent')}</p>
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
              {t('battle.confirm')}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
