# 🌌 ANTIGRAVITY BRIDGE: SWARM PROTOCOL

![Version](https://img.shields.io/badge/Version-1.2.0--ALPHA-blueviolet)
![Protocol](https://img.shields.io/badge/Swarm_Protocol-Active-emerald)
![Platform](https://img.shields.io/badge/Platform-Node.js_%2F_Vite-blue)

**Antigravity Bridge** is a low-latency, automated task-polling system designed to bridge the gap between remote cloud dashboards and local agency environments. It serves as the "nervous system" of the Antigravity Swarm, enabling seamless, hands-free task execution.

## 🚀 The "Swarm" Architecture

Unlike traditional agent setups, the **Bridge** protocol allows a distributed network of agents to synchronize via a central heartbeat. 

- 🛰️ **Long-Polling Engine**: Uses a specialized Node.js bridge (`bridge.js`) to maintain a "live" connection with remote task queues.
- ⚡ **Auto-Polling**: Automatically detects and processes incoming signals without requiring manual terminal input.
- 🔗 **Bi-Directional Sync**: A unified bridge between the **Lakar Web Dashboard** (React/Vite) and the local filesystem operations.

## ✨ Core Features

- 🛰️ **Task Satellite**: A lightweight Node.js listener that stays awake to receive instructions from mobile or web interfaces.
- 🛡️ **Auto-Accept Protocol**: Configurable logic (`adam-auto-accept/`) that allows the agent to start jobs immediately based on safety rules.
- 📊 **Web Control Interface**: A high-fidelity management console (located in `web-control/`) for real-time monitoring of the swarm status.
- 🧠 **Dynamic Workflow Injection**: Injects `.agent/workflows` into the local system on-the-fly when a remote task is received.

## 🛠️ Quick Start

### 1. Initialize the Bridge
```bash
npm install
node bridge.js
```

### 2. Launch the Control Center
```bash
npm run dev
```

### 3. Configure the Swarm
Copy `.env.example` to `.env` and configure your remote endpoints.

## 📦 Project Structure

- `bridge.js`: The heart of the swarm protocol; handles signal polling and execution.
- `web-control/`: React-based dashboard for monitoring the bridge state.
- `auto_polling_plan.md`: The technical blueprint for the protocol's evolution.
- `agent2.js`: Secondary agent logic for handled tasks.

---

### 🛡️ Swarm Connectivity Status
> [!IMPORTANT]
> Ensure your local firewall allows the Bridge to maintain stable outbound long-polling connections to the Antigravity Cloud.

&copy; 2026 Lakar Lab / Advanced Agency Framework
