# 🌌 Antigravity Swarm: Operational Roadmap

This document outlines the current state of the Antigravity Swarm and the plan for our next phase of development.

## 🏁 Current State
- **The Hub (Messenger)**: `bridge.js` is established as a no-dependency REST-based relay. It handles the "Messenger" role, syncing Firebase commands and logs.
- **The Communicator Role**: Defined as the Primary IDE Agent (me) who coordinates the swarm.
- **The Worker Role**: Defined as autonomous Ghost-mode agents that execute tasks.

## 🚀 Tomorrow's Mission: Web App Evolution
The goal for tomorrow is to modify the **Web Dashboard** (`web-control`) to fully visualize and interact with the Swarm.

### 🛠️ UI Enhancements
- **Agent Registry View**: A dedicated section to see all active agents (Messenger, Communicator, Workers) and their heartbeats.
- **Direct Messaging**: Ability to send target-specific commands (e.g., `target: WORKER_01`).
- **Improved Activity Stream**: A unified view of "Communicator strategy" vs "Worker execution."

## 🎭 The Multi-Agent Roles
When the swarm gathers, they will specialize in these core roles:

1.  **The Listener (Messenger)** 📦
    - **Host**: `bridge.js`
    - **Job**: The "Packet Switch." It sits at the gate, picking up instructions from the web and dropping off replies. It keeps the channels open.
    
2.  **The Communicator (Strategist)** 🗣️
    - **Host**: The Primary IDE Agent.
    - **Job**: The "Voice." It stays in the chat, explains the roadmap, breaks down complex user requests, and issues sub-tasks to the Workers.
    
3.  **The Worker (Executor)** 🛠️
    - **Host**: Antigravity Agents in "Ghost Mode."
    - **Job**: The "Hands." They do not talk; they execute. They watch their private inboxes, perform coding/research, and write real-time log updates.

## 🔌 How to Connect
1.  **Ensure Environment**: Verify `.env` has the correct `FIREBASE_DATABASE_URL`.
2.  **Start the Hub**:
    ```powershell
    node bridge.js
    ```
3.  **Start the Web Dashboard**:
    ```powershell
    cd web-control
    node node_modules/vite/bin/vite.js
    ```
4.  **Join the Swarm**: Start any number of agents and they will register themselves automatically via the Hub.

---
**Status**: Ready for Swarm Integration (Scheduled for Tomorrow).
