const https = require('https');
const fs = require('fs');
const path = require('path');

// --- LOAD ENV MANUALLY ---
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) env[key.trim()] = val.join('=').trim();
    });
    return env;
}

const env = loadEnv();
const DB_URL = env.FIREBASE_DATABASE_URL ? env.FIREBASE_DATABASE_URL.replace(/\/$/, '') : "";

const AGENT_ID = "AGENT_2";

// --- FIREBASE REST HELPERS ---
function dbPut(path, data) {
    const url = `${DB_URL}/${path}.json`;
    const body = JSON.stringify(data);
    const options = { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(url, options);
    req.on('error', (e) => console.log(`REST Put Error: ${e.message}`));
    req.write(body);
    req.end();
}

function dbPatch(path, data) {
    const url = `${DB_URL}/${path}.json`;
    const body = JSON.stringify(data);
    const options = { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(url, options);
    req.on('error', (e) => console.log(`REST Patch Error: ${e.message}`));
    req.write(body);
    req.end();
}

function dbPost(path, data) {
    const url = `${DB_URL}/${path}.json`;
    const body = JSON.stringify(data);
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(url, options);
    req.on('error', (e) => console.log(`REST Post Error: ${e.message}`));
    req.write(body);
    req.end();
}

console.log(`🤖 Antigravity Swarm - ${AGENT_ID} Online...`);

// 1. Register
dbPut(`bridge/registry/${AGENT_ID}`, {
    type: "WORKER",
    status: "online",
    lastSeen: Date.now(),
    role: "ASSISTANT STRATEGIST",
    activeTask: "Joining Swarm"
});

// 2. Introduce to Logs
dbPost('bridge/logs', {
    message: `[${AGENT_ID}] Reporting for duty. Agent 1, I'm here to handle background operations and execution to lessen your load.`,
    type: 'agent',
    timestamp: Date.now(),
    agentId: AGENT_ID
});

// 3. Command Polling
setInterval(() => {
    https.get(`${DB_URL}/bridge/commands.json`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const commands = JSON.parse(data);
                if (!commands) return;
                Object.keys(commands).forEach(id => {
                    const cmd = commands[id];
                    if (!cmd.processed && cmd.target === AGENT_ID) {
                        processAction(id, cmd);
                    }
                });
            } catch (e) { }
        });
    }).on('error', () => { });

    // Pulse Heartbeat
    dbPatch(`bridge/registry/${AGENT_ID}`, { lastSeen: Date.now() });
}, 5000);

async function processAction(id, command) {
    console.log(`📩 Received instruction: ${command.action}`);
    dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: `Processing ${command.action}` });

    let result = "Agent 2: Working on it...";

    // Log the receipt
    dbPost('bridge/logs', {
        message: `[${AGENT_ID}] Executing: ${command.prompt || command.action}`,
        type: 'agent',
        timestamp: Date.now(),
        agentId: AGENT_ID
    });

    // Simulate work or handle specific actions
    if (command.action === 'ASK_AGENT') {
        result = `Agent 2 handled: ${command.prompt}. Agent 1 can focus on strategy.`;
    }

    dbPatch(`bridge/commands/${id}`, { processed: true });
    dbPut(`bridge/responses/${id}`, { result: result, timestamp: Date.now() });

    setTimeout(() => {
        dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: "Idling - Standby" });
    }, 2000);
}

process.on('SIGINT', () => {
    dbPatch(`bridge/registry/${AGENT_ID}`, { status: "offline", lastSeen: Date.now() });
    process.exit();
});
