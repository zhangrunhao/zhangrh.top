import { useEffect, useState } from 'react'
import type { Translator } from '../src/i18n'

type MatchPageProps = {
  t: Translator
  roomId: string
  playerName: string
  playerId: string
  status?: 'waiting' | 'playing' | 'finished'
  playersCount?: number
  onBack: () => void
}

const statusLabels = {
  waiting: 'status.waiting',
  playing: 'status.playing',
  finished: 'status.finished',
} as const

export function MatchPage({
  t,
  roomId,
  playerName,
  playerId,
  status,
  playersCount,
  onBack,
}: MatchPageProps) {
  const hasPlayerInfo = Boolean(roomId && playerName)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const displayStatus = status ? t(statusLabels[status]) : ''

  useEffect(() => {
    if (!hasPlayerInfo) {
      return
    }

    const startTime = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 250)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasPlayerInfo])

  return (
    <section className="match">
      <header className="match__header">
        <p className="match__eyebrow">{t('match.eyebrow')}</p>
        <h1 className="match__title">{t('match.title')}</h1>
        <p className="match__subtitle">{t('match.subtitle')}</p>
      </header>

      <div className="match__panel">
        {hasPlayerInfo ? (
          <>
            <div className="match__row">
              <span className="match__label">{t('match.label.room')}</span>
              <span className="match__value">{roomId}</span>
            </div>
            <div className="match__row">
              <span className="match__label">{t('match.label.player')}</span>
              <span className="match__value">{playerName}</span>
            </div>
            <div className="match__row">
              <span className="match__label">{t('match.label.user_id')}</span>
              <span className="match__value">{playerId || t('match.pending')}</span>
            </div>
            {typeof playersCount === 'number' ? (
              <div className="match__row">
                <span className="match__label">{t('match.label.players')}</span>
                <span className="match__value">{playersCount}/2</span>
              </div>
            ) : null}
            {status ? (
              <div className="match__row">
                <span className="match__label">{t('match.label.status')}</span>
                <span className="match__value">{displayStatus}</span>
              </div>
            ) : null}
            <div className="match__row">
              <span className="match__label">{t('match.label.wait_time')}</span>
              <span className="match__value">
                {elapsedSeconds}
                {t('match.seconds')}
              </span>
            </div>
          </>
        ) : (
          <p className="match__empty">{t('match.empty')}</p>
        )}
      </div>

      <div className="match__actions">
        <button className="match__button match__button--ghost" onClick={onBack}>
          {t('match.back')}
        </button>
      </div>
    </section>
  )
}
