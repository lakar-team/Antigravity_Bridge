const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// --- LOAD ENV MANUALLY (NO DOTENV) ---
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

const BRIDGE_DIR = "C:\\antigravity-bridge";
const INBOX_PATH = path.join(BRIDGE_DIR, "inbox");
const OUTBOX_PATH = path.join(BRIDGE_DIR, "outbox");
const LOG_FILE = path.join(BRIDGE_DIR, "agent_progress.log");
const STOP_SIGNAL = path.join(BRIDGE_DIR, "stop.signal");

if (!fs.existsSync(BRIDGE_DIR)) fs.mkdirSync(BRIDGE_DIR, { recursive: true });
if (!fs.existsSync(INBOX_PATH)) fs.mkdirSync(INBOX_PATH, { recursive: true });
if (!fs.existsSync(OUTBOX_PATH)) fs.mkdirSync(OUTBOX_PATH, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "");

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

console.log("🚀 Antigravity Swarm Hub (Communicator) Started...");

// 1. Set Status & Registry
const AGENT_ID = "PRIMARY_IDE_AGENT";
dbPut(`bridge/registry/${AGENT_ID}`, {
    type: "IDE",
    status: "online",
    lastSeen: Date.now(),
    role: "STRATEGIC SWARM LEAD",
    activeTask: "Evolving Swarm UI"
});
dbPut('bridge/status', { online: true, lastSeen: Date.now(), machine: "ADAMLAB-HUB", activity: "Ready" });

// 2. Outbox Monitor (Me -> World)
fs.watch(OUTBOX_PATH, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
        const filePath = path.join(OUTBOX_PATH, filename);
        setTimeout(() => {
            if (!fs.existsSync(filePath)) return;
            try {
                const msg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`📤 Routing ${msg.type} to ${msg.target || 'User'}`);

                if (msg.type === 'REPLY' && msg.requestId) {
                    dbPut(`bridge/responses/${msg.requestId}`, { result: msg.text, timestamp: Date.now() });
                } else if (msg.type === 'BROADCAST' || msg.target === 'User') {
                    dbPost('bridge/logs', {
                        message: `[${msg.from || 'System'}] ${msg.text}`,
                        type: 'agent',
                        timestamp: Date.now()
                    });
                } else if (msg.target) {
                    dbPut(`bridge/agents/${msg.target}/inbox/${Date.now()}`, { ...msg, from: AGENT_ID });
                }

                fs.unlinkSync(filePath);
            } catch (e) { }
        }, 150);
    }
});

// 3. Command Polling (Relaxed to 10s for Google Drive)
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
                    if (!cmd.processed) {
                        if (!cmd.target || cmd.target === AGENT_ID) {
                            processAction(id, cmd);
                        }
                    }
                });
            } catch (e) { }
        });
    }).on('error', () => { });

    // Pulse Heartbeat
    dbPatch('bridge/status', { lastSeen: Date.now() });
    dbPatch(`bridge/registry/${AGENT_ID}`, { lastSeen: Date.now() });
}, 10000);

// 4. Watch Logs (Real-time Progress Reporting)
let lastLineCount = 0;
fs.watchFile(LOG_FILE, { interval: 1000 }, (curr, prev) => {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > lastLineCount) {
        const newLines = lines.slice(lastLineCount);
        newLines.forEach(line => {
            dbPost('bridge/logs', { message: line, type: 'agent', timestamp: Date.now(), agentId: AGENT_ID });
        });
        lastLineCount = lines.length;
    }
});

// 5. Watch Inbox for Activity Status
fs.watch(INBOX_PATH, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
        dbPatch('bridge/status', { activity: "Task Received" });
        dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: "Processing Data" });
    } else {
        const files = fs.readdirSync(INBOX_PATH);
        if (files.length === 0) {
            dbPatch('bridge/status', { activity: "Listening" });
            dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: "Idling - Standby" });
        }
    }
});

// 6. Emergency Watchdog (Immediate Exit)
if (fs.existsSync(STOP_SIGNAL)) fs.unlinkSync(STOP_SIGNAL);
fs.watch(BRIDGE_DIR, (eventType, filename) => {
    if (filename === "stop.signal" && fs.existsSync(STOP_SIGNAL)) {
        console.log("🛑 Emergency Stop Received. Exiting...");
        dbPatch('bridge/status', { online: false, activity: "Terminated" });
        setTimeout(() => process.exit(0), 500);
    }
});

async function processAction(id, command) {
    dbPatch('bridge/status', { activity: `Processing ${command.action}` });
    dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: `Executing ${command.action}` });
    console.log(`📩 Routing ${command.action} for ${id}...`);
    let result = "Action completed";

    try {
        switch (command.action) {
            case 'STATUS':
                result = `🕵️ Hub: Primary Agent is ready. Swarm status: Healthy.`;
                break;
            case 'ASK_AGENT':
                fs.writeFileSync(path.join(INBOX_PATH, `${id}.json`), JSON.stringify(command));
                result = "🫡 Messenger: Task dropped in Inbox for Agent.";
                break;
            case 'STOP_TASK':
                fs.writeFileSync(STOP_SIGNAL, "STOP");
                result = "🛑 Hub: Kill signal issued.";
                break;
            default:
                result = `Hub Alert: Instruction received: ${command.action}`;
        }
    } catch (err) {
        result = `Error: ${err.message}`;
    }

    dbPatch(`bridge/commands/${id}`, { processed: true });
    dbPut(`bridge/responses/${id}`, { result: result, timestamp: Date.now() });

    setTimeout(() => {
        const files = fs.readdirSync(INBOX_PATH);
        if (files.length === 0) {
            dbPatch('bridge/status', { activity: "Listening" });
            dbPatch(`bridge/registry/${AGENT_ID}`, { activeTask: "Idling - Standby" });
        }
    }, 1000);
}

process.on('SIGINT', () => {
    dbPatch('bridge/status', { online: false });
    process.exit();
});
