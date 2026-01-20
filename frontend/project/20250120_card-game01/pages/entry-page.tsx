import { useState } from 'react'
import type { MessageKey, Translator } from '../src/i18n'

type EntryPageProps = {
  t: Translator
  onJoin: (payload: { roomId: string; playerName: string }) => void
  onCreate: () => void
}

export function EntryPage({ t, onJoin, onCreate }: EntryPageProps) {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null)

  const validate = () => {
    const trimmedRoomId = roomId.trim()
    const trimmedName = playerName.trim()

    if (!trimmedRoomId) {
      setErrorKey('entry.error.room_required')
      return false
    }

    if (!/^\d+$/.test(trimmedRoomId)) {
      setErrorKey('entry.error.room_numeric')
      return false
    }

    if (!trimmedName) {
      setErrorKey('entry.error.name_required')
      return false
    }

    setErrorKey(null)
    return true
  }

  const handleJoin = () => {
    if (!validate()) {
      return
    }

    onJoin({
      roomId: roomId.trim(),
      playerName: playerName.trim(),
    })
  }

  const hasRoomError =
    errorKey === 'entry.error.room_required' || errorKey === 'entry.error.room_numeric'
  const hasNameError = errorKey === 'entry.error.name_required'

  return (
    <section className="entry">
      <header className="entry__header">
        <p className="entry__eyebrow">{t('entry.eyebrow')}</p>
        <h1 className="entry__title">{t('entry.title')}</h1>
        <p className="entry__subtitle">{t('entry.subtitle')}</p>
      </header>

      <div className="entry__form">
        <label className="entry__field">
          <span className="entry__label">{t('entry.room_id')}</span>
          <input
            className={`entry__input ${hasRoomError ? 'entry__input--error' : ''}`}
            placeholder={t('entry.room_placeholder')}
            value={roomId}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setRoomId(event.target.value.replace(/\D/g, ''))}
          />
        </label>

        <label className="entry__field">
          <span className="entry__label">{t('entry.player_name')}</span>
          <input
            className={`entry__input ${hasNameError ? 'entry__input--error' : ''}`}
            placeholder={t('entry.player_placeholder')}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>

        {errorKey ? <p className="entry__error">{t(errorKey)}</p> : null}

        <div className="entry__actions">
          <button className="entry__button entry__button--ghost" onClick={onCreate}>
            {t('entry.create')}
          </button>
          <button className="entry__button" onClick={handleJoin}>
            {t('entry.join')}
          </button>
        </div>
      </div>
    </section>
  )
}
