# 后端开发文档

## 目标
支持当前前端流程：创建房间、加入房间、匹配、对战回合结算与结束判定。

## 运行信息
- 服务端口：3001
- WebSocket 地址：`ws://localhost:3001`
- 可选健康检查：`GET /health`

## 接口清单
### HTTP
#### GET /health
返回 `{ ok: true }`，用于检查服务存活。

### WebSocket（JSON）
所有消息结构：
```json
{
  "type": "string",
  "payload": {}
}
```

#### Client -> Server
1) create_room  
创建房间并生成 4 位数字房间号。  
```json
{
  "type": "create_room",
  "payload": {
    "playerName": "Alice",
    "playerId": "user_xxxxxx"
  }
}
```

2) join_room  
加入指定房间并进入匹配流程。  
```json
{
  "type": "join_room",
  "payload": {
    "roomId": "1234",
    "playerName": "Bob",
    "playerId": "user_yyyyyy"
  }
}
```

3) play_action  
提交本回合选择。  
```json
{
  "type": "play_action",
  "payload": {
    "roomId": "1234",
    "round": 1,
    "playerId": "user_xxxxxx",
    "action": "attack"
  }
}
```

4) rematch  
再次对战（仅游戏结束后）。  
```json
{
  "type": "rematch",
  "payload": {
    "roomId": "1234",
    "playerId": "user_xxxxxx"
  }
}
```

#### Server -> Client
1) connected  
连接成功提示。  

2) room_created  
创建房间后返回生成的房间号与用户 ID。  
```json
{
  "type": "room_created",
  "payload": {
    "roomId": "1234",
    "playerId": "user_xxxxxx"
  }
}
```

3) room_joined  
加入房间后返回用户 ID。  
```json
{
  "type": "room_joined",
  "payload": {
    "roomId": "1234",
    "playerId": "user_yyyyyy"
  }
}
```

4) room_state  
进入房间后或每回合结算后广播。  
```json
{
  "type": "room_state",
  "payload": {
    "roomId": "1234",
    "status": "waiting",
    "round": 1,
    "players": [
      { "playerId": "user_xxxxxx", "name": "Alice", "hp": 10, "submitted": false },
      { "playerId": "user_yyyyyy", "name": "Bob", "hp": 10, "submitted": true }
    ]
  }
}
```

5) round_result  
两名玩家都提交后广播。  
```json
{
  "type": "round_result",
  "payload": {
    "roomId": "1234",
    "round": 1,
    "p1": { "action": "attack", "delta": 0,  "hp": 10 },
    "p2": { "action": "rest",   "delta": -2, "hp": 8  }
  }
}
```

6) game_over  
任一方 HP 归零或第 10 回合结束后广播。  
```json
{
  "type": "game_over",
  "payload": {
    "roomId": "1234",
    "round": 10,
    "result": "p1_win",
    "final": {
      "p1": { "hp": 7 },
      "p2": { "hp": 5 }
    }
  }
}
```

7) error  
```json
{
  "type": "error",
  "payload": { "message": "..." }
}
```

## 规则与约束
- 房间号：4 位数字字符串（"1000" - "9999"）。
- 玩家 ID：字符串（如 `user_xxxxxx`）。
- HP 限制在 `[0, 10]`。
- 回合数：1..10。
- 动作：`attack` | `defend` | `rest`。
