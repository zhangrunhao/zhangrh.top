import './App.css'
import { EntryPage } from './pages/EntryPage'
import { BattlePage } from './pages/BattlePage'

function App() {
  const activePage: 'entry' | 'battle' = 'battle'

  return (
    <div className="app">
      {activePage === 'entry' ? <EntryPage /> : <BattlePage />}
    </div>
  )
}

export default App
