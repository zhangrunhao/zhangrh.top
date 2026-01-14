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
