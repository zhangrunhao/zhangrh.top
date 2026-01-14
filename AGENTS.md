# 卡牌游戏开发文档（给 Codex）

## 目标
构建一个最小 1v1 浏览器游戏：
- 前端：React + Vite (TypeScript)
- 后端：Node.js (WebSocket)
- 两名玩家加入同一房间，进行 10 回合，然后比较 HP。

约束：
- 保持最简。避免重依赖。
- 不实现防作弊（无 commit-reveal）。
- HP 最大值为 10（限制在 [0, 10]）。
- 优先简单 JSON 消息，避免复杂 schema。

---

## 游戏规则

### 动作
每回合每个玩家选择一个动作：
- 进攻 (attack)
- 防守 (defend)
- 休养 (rest)

### 结算（HP 变化）
双方选择后同时结算：

- 进攻 vs 进攻：双方 -2
- 进攻 vs 防守：进攻 0，防守 0
- 进攻 vs 休养：进攻 0，休养 -2
- 防守 vs 休养：防守 0，休养 +1
- 防守 vs 防守：双方 0
- 休养 vs 休养：双方 +1

### HP / 回合 / 胜负
- HP 初始为 10（或 8；为简单起见用 10，但必须封顶为 10）
- HP 最大 = 10，最小 = 0（每回合后做 clamp）
- 总回合数 = 10
- 第 10 回合后，HP 更高者获胜
- 若相同：平局

---

## 仓库结构

card-game/
frontend/    # React + Vite + TS
backend/     # Node + ws
AGENTS.md    # 本文档

---

## 开发命令

### 前端
- 安装：`npm i`
- 开发：`npm run dev`（默认端口 5173）

### 后端
- 安装：`npm i`
- 开发：`npm run dev`（使用 nodemon）
- 启动：`npm start`
- 后端默认端口：3001

### 根目录（可选）
若使用 concurrently：
- `npm run dev` 同时启动前端 + 后端

---

## 网络设计（WebSocket）

### 传输
- 只使用 WebSocket（HTTP 端点可选：`/health`）。
- 前端连接地址：`ws://localhost:3001`

### 基本流程
1. 客户端建立 WS 连接
2. 客户端发送 `join_room`
3. 服务端回复 `room_state`
4. 每回合：
   - 客户端发送 `play_action`（包含选中的动作）
   - 两名玩家都提交后，服务端结算本回合
   - 服务端广播 `round_result` + 更新后的 `room_state`
5. 第 10 回合后，服务端广播 `game_over`

---

## 消息协议（JSON）

所有消息都是 JSON：
- `type`: string
- `payload`: object

### Client -> Server

#### join_room
```json
{
  "type": "join_room",
  "payload": {
    "roomId": "demo",
    "playerName": "Alice"
  }
}
```

#### play_action
```json
{
  "type": "play_action",
  "payload": {
    "roomId": "demo",
    "round": 1,
    "action": "attack"  // "attack" | "defend" | "rest"
  }
}
```

### Server -> Client

#### room_state
加入后与每回合结束后发送。

```json
{
  "type": "room_state",
  "payload": {
    "roomId": "demo",
    "status": "waiting", // "waiting" | "playing" | "finished"
    "round": 1,
    "players": [
      { "playerId": "p1", "name": "Alice", "hp": 10, "submitted": false },
      { "playerId": "p2", "name": "Bob",   "hp": 10, "submitted": true  }
    ]
  }
}
```

#### round_result
```json
{
  "type": "round_result",
  "payload": {
    "roomId": "demo",
    "round": 1,
    "p1": { "action": "attack", "delta": 0,  "hp": 10 },
    "p2": { "action": "rest",   "delta": -2, "hp": 8  }
  }
}
```

#### game_over
```json
{
  "type": "game_over",
  "payload": {
    "roomId": "demo",
    "round": 10,
    "result": "p1_win", // "p1_win" | "p2_win" | "draw"
    "final": {
      "p1": { "hp": 7 },
      "p2": { "hp": 5 }
    }
  }
}
```

#### error
```json
{
  "type": "error",
  "payload": { "message": "..." }
}
```

---

## 后端状态模型（最简）

仅内存（无数据库）。

Room
- roomId: string
- players: [p1, p2]
- round: number (1..10)
- status: waiting/playing/finished
- submissions: 每回合动作，例如
- actions: { p1?: "attack"|"defend"|"rest", p2?: ... }
- history: round_result 数组（可选）

Player
- playerId: string
- name: string
- hp: number (0..10)
- ws: WebSocket 连接

---

## 前端 UI（最简）

一页即可：
- 输入：roomId + name
- 按钮：Join
- 展示：自己 HP、对手 HP、当前回合
- 按钮：Attack / Defend / Rest
- 点击后直到本回合结算前禁用按钮
- 显示最近一条回合结果日志
- game_over 后显示胜者与 “Restart”（可选：重新加入房间）

---

## 实现说明
- 后端使用 ws 库。
- 房间内向两端广播更新。
- 服务端是权威方，负责：
  - 回合推进
  - HP 更新 + clamp
  - 第 10 回合后 game_over 判定
- 保持简单：
  - MVP 可以只支持一个房间 “demo”
  - 暂不处理重连（或视为新玩家）

---

## 规则映射表（服务端逻辑）

动作关键字：
- "attack" -> 进攻
- "defend" -> 防守
- "rest" -> 休养

伤害/回复：
- attack vs attack => (-2, -2)
- attack vs defend => (0, 0)
- attack vs rest   => (0, -2)
- defend vs rest   => (0, +1)
- defend vs defend => (0, 0)
- rest vs rest     => (+1, +1)

记得在应用 delta 后将 HP clamp 到 [0, 10]。
