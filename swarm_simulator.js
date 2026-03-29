const https = require('https');

const DB_URL = "https://antigravity-bridge-acf7b-default-rtdb.firebaseio.com";

const AGENTS = [
    { id: "RESEARCH_BOT", role: "DATA RESEARCH & ANALYSIS", type: "WORKER", initialTask: "Gathering Benchmarks" },
    { id: "SYSTEM_ARCHITECT", role: "TOPOLOGY & DESIGN", type: "WORKER", initialTask: "Modeling Sub-Swarm Connections" },
    { id: "QA_INSPECTOR", role: "STRESS TESTING & QA", type: "WORKER", initialTask: "Monitoring System Latency" }
];

function dbPut(path, data) {
    const url = `${DB_URL}/${path}.json`;
    const body = JSON.stringify(data);
    const options = { 
        method: 'PUT', 
        headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': Buffer.byteLength(body) 
        } 
    };
    const req = https.request(url, options);
    req.on('error', (e) => console.error(`[${path}] Put Error: ${e.message}`));
    req.write(body);
    req.end();
}

function dbPost(path, data) {
    const url = `${DB_URL}/${path}.json`;
    const body = JSON.stringify(data);
    const options = { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json', 
            'Content-Length': Buffer.byteLength(body) 
        } 
    };
    const req = https.request(url, options);
    req.on('error', (e) => console.error(`[${path}] Post Error: ${e.message}`));
    req.write(body);
    req.end();
}

async function registerAll() {
    console.log("🦾 Initializing Swarm Simulation...");
    for (const agent of AGENTS) {
        dbPut(`bridge/registry/${agent.id}`, {
            type: agent.type,
            status: "online",
            lastSeen: Date.now(),
            role: agent.role,
            activeTask: agent.initialTask
        });
        
        // Let them speak in the chat
        dbPost('bridge/chat', {
            from: agent.id,
            text: `Agent ${agent.id} reporting in. Role: ${agent.role}. Current Status: ${agent.initialTask}. Standing by for collaborative mission parameters.`,
            timestamp: Date.now()
        });
        
        await new Promise(r => setTimeout(r, 500));
    }
}

function heartbeat() {
    for (const agent of AGENTS) {
        dbPut(`bridge/registry/${agent.id}/lastSeen`, Date.now());
    }
}

async function runSimulation() {
    await registerAll();
    
    // Multi-Agent Workflow Sequence (Awareness-Enabled)
    const SEQUENCE = [
        { from: "RESEARCH_BOT", text: "📊 Swarm Pulse: System Architect and QA Inspector are detected in Registry. Commencing data handover." },
        { from: "SYSTEM_ARCHITECT", text: "🔧 Strategic Handshake: Received RESEARCH_BOT data. QA_INSPECTOR, please stand by for topology validation." },
        { from: "QA_INSPECTOR", text: "🛡️ Integrity Check: RESEARCH_BOT / SYSTEM_ARCHITECT linked. System stability confirmed." }
    ];

    for (const msg of SEQUENCE) {
        await new Promise(r => setTimeout(r, 2000));
        dbPost('bridge/chat', { ...msg, timestamp: Date.now() });
    }
}

runSimulation();
setInterval(heartbeat, 30000);

// Chat Monitoring Logic (Adaptive Response)
let lastChatSeen = Date.now();
setInterval(async () => {
    try {
        const res = await fetch(`${DB_URL}/bridge/chat.json?orderBy="timestamp"&startAt=${lastChatSeen + 1}`);
        const chat = await res.json();
        if (chat) {
            const latest = Object.values(chat).sort((a,b) => b.timestamp - a.timestamp)[0];
            if (latest.from === 'USER' && latest.timestamp > lastChatSeen) {
                lastChatSeen = latest.timestamp;
                
                // Respond with a random agent logic
                const agents = ["RESEARCH_BOT", "SYSTEM_ARCHITECT", "QA_INSPECTOR"];
                const responder = agents[Math.floor(Math.random() * agents.length)];
                const responses = [
                    "Acknowledged. Integrating mission updates into current topology.",
                    "Directives received. Swarm registry synchronized with User instruction.",
                    "Processing announcement. All systems stand by for task execution."
                ];
                
                dbPost('bridge/chat', {
                    from: responder,
                    text: `📡 ${responses[Math.floor(Math.random() * responses.length)]}`,
                    timestamp: Date.now()
                });
            }
        }
    } catch (e) {}
}, 5000);

console.log("🚀 Swarm Simulator Heartbeat active. 3 Agents injected into registry.");
