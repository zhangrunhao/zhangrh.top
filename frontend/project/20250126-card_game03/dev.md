# Card Game 03 · Frontend DEV

## 目标
基于新规则实现轻量对战 UI：展示公开牌/暗牌、出牌选择、回合结算、10 回合胜负与回合记录。支持 PVP 与人机。

---

## 规则摘要（对齐 PRD）
- 仅 3 种牌：A / D / R。
- 无牌库与弃牌堆，补牌时随机生成。
- 初始血量 10，共 10 回合；HP ≤ 0 立即结束。
- 手牌结构：**2 张公开牌 + 1 张暗牌**。
- 开局直接生成 3 张（2 公开 + 1 暗）。
- 每回合：补暗牌（第 2 回合起）→ 选 1 张 → 同时揭示 → 结算一次 → 剩余 2 张变公开。
- 只记录每回合结果：回合数、双方出牌、双方血量变化、结算后血量。

---

## 页面结构

### 1. 入口页（Entry）
- 昵称输入
- 创建房间 / 加入房间 / 人机对战
- 连接状态与错误提示

### 2. 对战页（Battle）
- 顶部：回合数、房间号、双方血量
- 手牌区：
  - **我方公开牌 x2**（可选）
  - **我方暗牌 x1**（仅自己可见）
- 对手区：仅显示 **对手公开牌 x2**（不可见暗牌）
- 操作区：点击 1 张出牌
- 回合结果弹窗 / 区域：显示双方出牌、HP 变化与结算后 HP
- 回合记录区：列表展示每回合结果

### 3. 结算页（Result）
- 胜/负/平
- 最终血量
- 再来一局

---

## UI 交互细节

### 出牌选择
- 一回合只能选择 1 张（点击即提交，或点击后显示“确认出牌”按钮）。
- 已提交后禁用操作，并显示“等待对手”。
- 暗牌可被选择，选中后卡面可保持“暗”直到回合揭示。

### 回合揭示
- 同时展示双方出牌（对手暗牌此时可见）。
- 展示本回合 HP 变化与结算后 HP。
- 提供“下一回合 / 确定”按钮触发 `round_confirm`。

### 公开牌流转
- 每回合结束后，未出的 2 张变为下一回合公开牌。
- UI 上能明显区分“公开 / 暗”。

### 回合记录
- 每回合记录一条：`回合数 / 我方出牌 / 对手出牌 / HP 变化 / 结算后 HP`。

---

## 前端状态模型（建议）

```ts
type CardType = 'A' | 'D' | 'R'

type PlayerSummary = {
  playerId: string
  name: string
  hp: number
  submitted: boolean
}

type RoundState = {
  roomId: string
  round: number
  my: { openCards: CardType[]; hiddenCard: CardType | null }
  opp: { openCards: CardType[] }
}

type RoundResult = {
  roomId: string
  round: number
  p1Id: string
  p2Id: string
  p1Card: CardType
  p2Card: CardType
  p1Delta: number
  p2Delta: number
  p1Hp: number
  p2Hp: number
}

type RoundLog = {
  round: number
  myCard: CardType
  oppCard: CardType
  myDelta: number
  oppDelta: number
  myHp: number
  oppHp: number
}
```

---

## WebSocket 事件映射（前端视角）

### 发送
- `start_bot`, `create_room`, `join_room`
- `play_card { roomId, playerId, round, sourceIndex }`
- `round_confirm`
- `rematch`

### 接收
- `room_state` → 更新玩家状态、回合数
- `round_state` → 渲染公开牌/暗牌
- `round_result` → 展示揭示弹窗 + 追加记录
- `game_over` → 进入结算页
- `error` → UI 提示

---

## 组件拆分（建议）
- `EntryPanel`：昵称 + 房间
- `BattleHeader`：回合/血量
- `HandPanel`：公开牌 + 暗牌 + 选择状态
- `OpponentPanel`：对手公开牌
- `RoundModal`：回合揭示 + HP 变化
- `RoundLogList`
- `ResultPanel`

---

## 开发步骤（前端）
1. 新建 `frontend/project/20250126-card_game03` 工程（可复用 game02 结构）。
2. 完成基础路由/页面骨架（Entry / Battle / Result）。
3. 接入 WebSocket 与事件流（room_state / round_state / round_result / game_over）。
4. 实现手牌区（公开/暗可视化）与出牌交互。
5. 实现回合揭示弹窗与回合记录列表。
6. 联调：
   - 回合 1 初始化
   - 回合 2+ 补暗牌
   - 10 回合结算与 HP ≤ 0 结束

