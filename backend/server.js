import http from 'http'
import express from 'express'
import cors from 'cors'
import { registerCardGame } from './projects/cardgame.js'

const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const server = http.createServer(app)
registerCardGame({ app, server })

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
