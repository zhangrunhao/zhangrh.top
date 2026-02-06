# Cardgame Migration Design

**Date:** 2026-02-06
**Goal:** Migrate the 20250126-card_game02 frontend/backend into the new 20250120_cardgame project with a new API/WS prefix, and keep future iteration in the new project.

## Scope
- Frontend: copy the entire `frontend/project/20250126-card_game02` into `frontend/project/20250120_cardgame`.
- Backend: create a new `backend/projects/20250120_cardgame.js` that mirrors `20250126-card_game02.js` behavior, but with a new API prefix `/api/20250120_cardgame` and updated health metadata.
- Server: register the new backend module in `backend/server.js`.

## Non-Goals
- No gameplay or protocol changes.
- No refactors, optimization, or re-architecture.
- No tests (per request).

## Architecture & Data Flow
- Frontend keeps the same module layout (`app.tsx`, `main.tsx`, `styles.css`, `vite.config.ts`).
- All REST/WS traffic is re-pointed to the new prefix `/api/20250120_cardgame`.
- WebSocket endpoint remains `{PREFIX}/ws` with the existing message protocol:
  - `start_bot`, `create_room`, `create_room_bot`, `join_room`, `play_cards`, `round_confirm`, `rematch`.
- Backend module mirrors room lifecycle, bot flow, round resolution, and rematch behavior unchanged.

## Error Handling
- Preserve `sendError` behavior on the backend.
- Frontend error UI remains unchanged; only prefix updates.

## Migration Plan (High-Level)
1. Copy `20250126-card_game02` to `20250120_cardgame`.
2. Update frontend API/WS prefix references to `/api/20250120_cardgame`.
3. Clone backend module to `20250120_cardgame.js` and update prefix + health metadata.
4. Register new module in `backend/server.js`.

## Risks & Mitigations
- **Risk:** Frontend still points to old prefix.
  - **Mitigation:** replace all `/api/20250126-card_game02` occurrences in the new project.
- **Risk:** backend module not registered.
  - **Mitigation:** update `server.js` and verify import & registration.

## Success Criteria
- New frontend project connects to backend using `/api/20250120_cardgame`.
- Rooms, bot matches, and rematch flows work without protocol changes.
- Old project remains intact but no longer updated.
