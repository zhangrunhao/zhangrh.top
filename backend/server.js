import http from 'http'
import express from 'express'
import cors from 'cors'

import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());

app.get("/health", (req, res) => {
  console.log(req);
  res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "connected", payload: { message: "ws ready" } }));

  ws.on("message", (data) => {
    const text = data.toString();
    ws.send(text);
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
