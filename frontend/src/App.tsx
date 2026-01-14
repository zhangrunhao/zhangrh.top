import { useEffect, useState } from 'react'
import './App.css'
import { BattlePage } from './pages/BattlePage'
import { EntryPage } from './pages/EntryPage'
import { MatchPage } from './pages/MatchPage'

type RoutePath = '/' | '/match' | '/battle'

const resolvePath = (): RoutePath => {
  const path = window.location.pathname
  if (path === '/match' || path === '/battle') {
    return path
  }
  return '/'
}

function App() {
  const [route, setRoute] = useState<RoutePath>(resolvePath)
  const [playerInfo, setPlayerInfo] = useState({ roomId: '', playerName: '' })

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolvePath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path: RoutePath) => {
    if (route === path) {
      return
    }

    window.history.pushState({}, '', path)
    setRoute(path)
  }

  return (
    <div className="app">
      {route === '/' ? (
        <EntryPage
          onSubmit={({ roomId, playerName }) => {
            setPlayerInfo({ roomId, playerName })
            navigate('/match')
          }}
        />
      ) : null}
      {route === '/match' ? (
        <MatchPage
          roomId={playerInfo.roomId}
          playerName={playerInfo.playerName}
          onBack={() => navigate('/')}
        />
      ) : null}
      {route === '/battle' ? <BattlePage /> : null}
    </div>
  )
}

export default App
