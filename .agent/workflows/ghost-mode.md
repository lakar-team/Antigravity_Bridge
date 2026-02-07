---
description: Ghost Mode - Automated Remote Execution (Supervisor Edition)
---

// turbo-all
This workflow enables a two-agent system:
- **Agent 1 (Supervisor)**: Runs `bridge.js` to relay updates to you and listen for "STOP".
- **Agent 2 (Worker)**: Autonomous execution with real-time reporting.

1. **Agent 1: Start Supervisor Bridge**
   ```powershell
   node bridge.js
   ```

2. **Agent 2: Enter Autonomous Worker Loop**
   - **Reporting**: Always write `Progress: [Current Task]` to `C:\antigravity-bridge\agent_progress.log` before tool calls.
   - **Cancellation**: Before every step, check if `C:\antigravity-bridge\stop.signal` exists.
   - **Listening**: Poll `C:\antigravity-bridge\inbox` for new `.json` tasks.

3. **Task Execution Protocol**
   - Read task from `C:\antigravity-bridge\inbox`.
   - Update `agent_progress.log` with "Starting task...".
   - If `stop.signal` is detected, stop immediately and write "Task Stopped by User" to the log.
   - Write final result to `C:\antigravity-bridge\responses/[id].json` or via update to Firebase.
