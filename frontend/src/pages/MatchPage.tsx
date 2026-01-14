type MatchPageProps = {
  roomId: string
  playerName: string
  onBack: () => void
}

export function MatchPage({ roomId, playerName, onBack }: MatchPageProps) {
  const hasPlayerInfo = Boolean(roomId && playerName)

  return (
    <section className="match">
      <header className="match__header">
        <p className="match__eyebrow">Matching Room</p>
        <h1 className="match__title">Finding an Opponent</h1>
        <p className="match__subtitle">Stay on this screen while we match you.</p>
      </header>

      <div className="match__panel">
        {hasPlayerInfo ? (
          <>
            <div className="match__row">
              <span className="match__label">Room</span>
              <span className="match__value">{roomId}</span>
            </div>
            <div className="match__row">
              <span className="match__label">Player</span>
              <span className="match__value">{playerName}</span>
            </div>
          </>
        ) : (
          <p className="match__empty">Missing room or player info. Please return to the lobby.</p>
        )}
      </div>

      <div className="match__actions">
        <button className="match__button match__button--ghost" onClick={onBack}>
          Back to Lobby
        </button>
      </div>
    </section>
  )
}
