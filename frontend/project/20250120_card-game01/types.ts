export type RoomState = {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  round: number
  players: Array<{
    playerId: string
    name: string
    hp: number
    submitted: boolean
  }>
}

export type RoundResult = {
  roomId: string
  round: number
  p1: {
    action: 'attack' | 'defend' | 'rest'
    delta: number
    hp: number
  }
  p2: {
    action: 'attack' | 'defend' | 'rest'
    delta: number
    hp: number
  }
}

export type GameOver = {
  roomId: string
  round: number
  result: 'p1_win' | 'p2_win' | 'draw'
  final: {
    p1: { hp: number }
    p2: { hp: number }
  }
}
