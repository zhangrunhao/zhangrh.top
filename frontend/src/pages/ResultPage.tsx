import type { GameOver } from '../types'

type ResultPageProps = {
  playerId: string
  playerSide: 'p1' | 'p2' | null
  gameOver: GameOver | null
  onRematch: () => void
  onBack: () => void
}

export function ResultPage({ playerId, playerSide, gameOver, onRematch, onBack }: ResultPageProps) {
  if (!gameOver) {
    return null
  }

  const { p1, p2 } = gameOver.final
  const isDraw = gameOver.result === 'draw'
  const isPlayerOne = playerSide ? playerSide === 'p1' : true
  const playerHp = isPlayerOne ? p1.hp : p2.hp
  const opponentHp = isPlayerOne ? p2.hp : p1.hp
  const isWin =
    !isDraw &&
    ((playerSide === 'p1' && gameOver.result === 'p1_win') ||
      (playerSide === 'p2' && gameOver.result === 'p2_win'))
  const resultLabel = isDraw
    ? 'Draw'
    : playerSide
      ? isWin
        ? 'Victory'
        : 'Defeat'
      : gameOver.result === 'p1_win'
        ? 'Player 1 Wins'
        : 'Player 2 Wins'
  const reason = p1.hp === 0 || p2.hp === 0 ? 'HP reached 0' : '10 rounds complete'
  const playerHpLabel = playerSide ? 'Your HP' : 'Player 1 HP'
  const opponentHpLabel = playerSide ? 'Opponent HP' : 'Player 2 HP'

  return (
    <section className="result">
      <header className="result__header">
        <p className="result__eyebrow">Game Over</p>
        <h1 className="result__title">{resultLabel}</h1>
        <p className="result__subtitle">{reason}</p>
      </header>

      <div className="result__panel">
        <div className="result__row">
          <span className="result__label">Your ID</span>
          <span className="result__value">{playerId || 'unknown'}</span>
        </div>
        <div className="result__row">
          <span className="result__label">{playerHpLabel}</span>
          <span className="result__value">{playerHp}</span>
        </div>
        <div className="result__row">
          <span className="result__label">{opponentHpLabel}</span>
          <span className="result__value">{opponentHp}</span>
        </div>
        <div className="result__row">
          <span className="result__label">Round</span>
          <span className="result__value">{gameOver.round}</span>
        </div>
      </div>

      <div className="result__actions">
        <button className="result__button result__button--ghost" onClick={onBack}>
          Back to Lobby
        </button>
        <button className="result__button" onClick={onRematch}>
          Rematch
        </button>
      </div>
    </section>
  )
}
