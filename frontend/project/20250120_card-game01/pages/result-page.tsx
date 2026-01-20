import type { Translator } from '../src/i18n'
import type { GameOver } from '../src/types'

type ResultPageProps = {
  t: Translator
  playerId: string
  playerSide: 'p1' | 'p2' | null
  gameOver: GameOver | null
  onRematch: () => void
  onBack: () => void
}

export function ResultPage({
  t,
  playerId,
  playerSide,
  gameOver,
  onRematch,
  onBack,
}: ResultPageProps) {
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
    ? t('result.draw')
    : playerSide
      ? isWin
        ? t('result.victory')
        : t('result.defeat')
      : gameOver.result === 'p1_win'
        ? t('result.p1_win')
        : t('result.p2_win')
  const reason = p1.hp === 0 || p2.hp === 0 ? t('result.reason_zero') : t('result.reason_rounds')
  const playerHpLabel = playerSide ? t('result.player_hp') : t('result.player1_hp')
  const opponentHpLabel = playerSide ? t('result.opponent_hp') : t('result.player2_hp')

  return (
    <section className="result">
      <header className="result__header">
        <p className="result__eyebrow">{t('result.eyebrow')}</p>
        <h1 className="result__title">{resultLabel}</h1>
        <p className="result__subtitle">{reason}</p>
      </header>

      <div className="result__panel">
        <div className="result__row">
          <span className="result__label">{t('result.your_id')}</span>
          <span className="result__value">{playerId || t('result.unknown')}</span>
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
          <span className="result__label">{t('result.round')}</span>
          <span className="result__value">{gameOver.round}</span>
        </div>
      </div>

      <div className="result__actions">
        <button className="result__button result__button--ghost" onClick={onBack}>
          {t('result.back')}
        </button>
        <button className="result__button" onClick={onRematch}>
          {t('result.rematch')}
        </button>
      </div>
    </section>
  )
}
