import { useState } from 'react'

type LobbyAction = 'create' | 'join'

type EntryPageProps = {
  onSubmit: (payload: { roomId: string; playerName: string; action: LobbyAction }) => void
}

export function EntryPage({ onSubmit }: EntryPageProps) {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  const validate = () => {
    const trimmedRoomId = roomId.trim()
    const trimmedName = playerName.trim()

    if (!trimmedRoomId) {
      setError('Room ID is required.')
      return false
    }

    if (!trimmedName) {
      setError('Player name is required.')
      return false
    }

    setError('')
    return true
  }

  const handleSubmit = (action: LobbyAction) => {
    if (!validate()) {
      return
    }

    onSubmit({
      roomId: roomId.trim(),
      playerName: playerName.trim(),
      action,
    })
  }

  return (
    <section className="entry">
      <header className="entry__header">
        <p className="entry__eyebrow">Card Duel Lobby</p>
        <h1 className="entry__title">Create or Join a Room</h1>
        <p className="entry__subtitle">
          Enter a room ID and your name to get ready for a match.
        </p>
      </header>

      <div className="entry__form">
        <label className="entry__field">
          <span className="entry__label">Room ID</span>
          <input
            className={`entry__input ${error && !roomId.trim() ? 'entry__input--error' : ''}`}
            placeholder="e.g. demo"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
          />
        </label>

        <label className="entry__field">
          <span className="entry__label">Player Name</span>
          <input
            className={`entry__input ${error && !playerName.trim() ? 'entry__input--error' : ''}`}
            placeholder="e.g. Alex"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>

        {error ? <p className="entry__error">{error}</p> : null}

        <div className="entry__actions">
          <button className="entry__button entry__button--ghost" onClick={() => handleSubmit('create')}>
            Create Room
          </button>
          <button className="entry__button" onClick={() => handleSubmit('join')}>
            Join Room
          </button>
        </div>
      </div>
    </section>
  )
}
