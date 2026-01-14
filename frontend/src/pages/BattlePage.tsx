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

export function BattlePage() {
  return (
    <section className="battle">
      <header className="battle__header">
        <div>
          <p className="battle__eyebrow">Round 3 / 10</p>
          <h1 className="battle__title">Duel in Progress</h1>
          <p className="battle__subtitle">Choose a card and wait for your opponent.</p>
        </div>
        <div className="battle__round">
          <span className="battle__round-label">Current</span>
          <span className="battle__round-value">3</span>
        </div>
      </header>

      <div className="battle__players">
        <div className="battle__player-card">
          <p className="battle__player-role">You</p>
          <p className="battle__player-name">Player One</p>
          <p className="battle__hp">HP 10</p>
          <p className="battle__hp-bar">
            <span style={{ width: '100%' }} />
          </p>
        </div>
        <div className="battle__player-card battle__player-card--opponent">
          <p className="battle__player-role">Opponent</p>
          <p className="battle__player-name">Player Two</p>
          <p className="battle__hp">HP 10</p>
          <p className="battle__hp-bar">
            <span style={{ width: '100%' }} />
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
          <h3 className="battle__status-title">Waiting for opponent</h3>
          <p className="battle__status-text">Your card is locked in. Hang tight.</p>
        </div>
        <div className="battle__status-panel battle__status-panel--result">
          <h3 className="battle__status-title">Resolution</h3>
          <div className="battle__status-list">
            <div className="battle__status-row">
              <span>You</span>
              <span>Attack • -2</span>
            </div>
            <div className="battle__status-row">
              <span>Opponent</span>
              <span>Rest • -2</span>
            </div>
          </div>
          <button className="battle__next-round" disabled>
            Next Round
          </button>
        </div>
      </section>
    </section>
  )
}
