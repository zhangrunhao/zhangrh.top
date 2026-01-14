import type { RoomState } from '../types'

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
  onBack: () => void
}

export function BattlePage({ playerId, opponentId, roomState, onBack }: BattlePageProps) {
  const round = roomState?.round ?? 1
  const players = roomState?.players ?? []
  const self = players.find((player) => player.playerId === playerId)
  const opponent = players.find((player) => player.playerId !== playerId)

  const displayPlayerName = self?.name || 'Unknown'
  const displayPlayerId = playerId || 'pending'
  const displayOpponentName = opponent?.name || 'Unknown'
  const displayOpponentId = opponent?.playerId || opponentId || 'pending'
  const playerHp = self?.hp ?? 10
  const opponentHp = opponent?.hp ?? 10

  const clampHp = (value: number) => Math.max(0, Math.min(10, value))
  const playerHpPercent = `${(clampHp(playerHp) / 10) * 100}%`
  const opponentHpPercent = `${(clampHp(opponentHp) / 10) * 100}%`

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
          <p className="battle__hp">HP {playerHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: playerHpPercent }} />
          </p>
        </div>
        <div className="battle__player-card battle__player-card--opponent">
          <p className="battle__player-role">Opponent</p>
          <p className="battle__player-name">{displayOpponentName}</p>
          <p className="battle__player-id">ID {displayOpponentId}</p>
          <p className="battle__hp">HP {opponentHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: opponentHpPercent }} />
          </p>
        </div>
      </div>

      <section className="battle__actions">
        <h2 className="battle__section-title">Choose Your Card</h2>
        <div className="battle__cards">
          {actionCards.map((card) => (
            <button className="battle__card" key={card.id}>
              <span className="battle__card-title">{card.title}</span>
              <span className="battle__card-desc">{card.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="battle__status">
        <div className="battle__status-panel">
          <h3 className="battle__status-title">Waiting for actions</h3>
          <p className="battle__status-text">Submit a card to start the round.</p>
        </div>
        <div className="battle__status-panel battle__status-panel--result">
          <h3 className="battle__status-title">Latest Result</h3>
          <p className="battle__status-text">Results will appear after both players act.</p>
          <button className="battle__next-round" disabled>
            Next Round
          </button>
        </div>
      </section>
    </section>
  )
}
