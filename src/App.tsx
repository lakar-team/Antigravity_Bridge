import { useState, useEffect } from 'react';
import { ref, onValue, push, set, DataSnapshot } from 'firebase/database';
import { db } from './firebase';
import { Terminal, Send, Activity, Users, Shield, Cpu, MessageSquare } from 'lucide-react';
import './App.css';

interface Message {
  id: string;
  action: string;
  processed: boolean;
  result?: string;
  timestamp: number;
  prompt?: string;
  target?: string;
  requiresInput?: boolean;
}

interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'agent';
  timestamp: number;
  agentId?: string;
}

interface Agent {
  id: string;
  type: string;
  status: string;
  lastSeen: number;
  role?: string;
  activeTask?: string;
}

function App() {
  const [status, setStatus] = useState({ online: false, lastSeen: 0 });
  const [registry, setRegistry] = useState<Record<string, Agent>>({});
  const [command, setCommand] = useState('');
  const [targetAgent, setTargetAgent] = useState('PRIMARY_IDE_AGENT');
  const [history, setHistory] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'activity' | 'debug' | 'registry'>('activity');

  useEffect(() => {
    // Listen for Online Status
    const statusRef = ref(db, 'bridge/status');
    onValue(statusRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) setStatus(snapshot.val());
    });

    // Listen for Agent Registry
    const registryRef = ref(db, 'bridge/registry');
    onValue(registryRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        setRegistry(snapshot.val());
      }
    });

    // Listen for History
    const commandsRef = ref(db, 'bridge/commands');
    const responsesRef = ref(db, 'bridge/responses');

    onValue(commandsRef, (cmdSnap: DataSnapshot) => {
      const cmds = cmdSnap.val() || {};
      onValue(responsesRef, (respSnap: DataSnapshot) => {
        const resps = respSnap.val() || {};

        const combined = Object.keys(cmds).map(id => ({
          id,
          ...cmds[id],
          result: resps[id]?.result
        })).sort((a: Message, b: Message) => b.timestamp - a.timestamp).slice(0, 20);

        setHistory(combined);
      });
    });

    // Listen for Logs
    const logsRef = ref(db, 'bridge/logs');
    onValue(logsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val() || {};
      const combinedLogs = Object.keys(data).map(id => ({
        id,
        ...data[id]
      })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
      setLogs(combinedLogs);
    });
  }, []);

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    const commandsRef = ref(db, 'bridge/commands');
    const newCmdRef = push(commandsRef);

    await set(newCmdRef, {
      action: 'ASK_AGENT',
      target: targetAgent,
      prompt: command,
      processed: false,
      timestamp: Date.now()
    });

    setCommand('');
    setLoading(false);
  };

  const handleInput = async (id: string, value: string) => {
    const responsesRef = ref(db, `bridge/responses/${id}`);
    await set(responsesRef, {
      result: value,
      timestamp: Date.now()
    });
    const cmdRef = ref(db, `bridge/commands/${id}/processed`);
    await set(cmdRef, true);
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>
          ANTIGRAVITY <span style={{ color: '#a855f7' }}>SWARM</span>
        </h1>
        <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '4px' }}>Multi-Agent Command Interface</p>
      </header>

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className={`status-badge ${status.online ? 'status-online' : 'status-offline'}`}>
            <Activity size={14} />
            {status.online ? 'HUB CONNECTED' : 'HUB DISCONNECTED'}
          </div>
          <div style={{ opacity: 0.4, fontSize: '0.8rem', fontFamily: 'monospace' }}>
            {status.lastSeen ? `VIBE: ${new Date(status.lastSeen).toLocaleTimeString()}` : 'WAITING...'}
          </div>
        </div>

        <form onSubmit={sendCommand}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', textAlign: 'left', fontWeight: 700 }}>SEND TO</label>
              <select
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="PRIMARY_IDE_AGENT">Primary Strategist (IDE)</option>
                {Object.keys(registry).filter(id => id !== 'PRIMARY_IDE_AGENT').map(id => (
                  <option key={id} value={id}>{id} ({registry[id].type})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Deploy operational instruction..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={!status.online || loading}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={!status.online || loading} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Send size={18} />
                {loading ? 'TRANSMITTING...' : 'EXECUTE'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const commandsRef = ref(db, 'bridge/commands');
                  const newCmdRef = push(commandsRef);
                  await set(newCmdRef, {
                    action: 'STOP_TASK',
                    timestamp: Date.now(),
                    processed: false
                  });
                }}
                disabled={!status.online}
                style={{ flex: 1, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                KILL SWARM
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ marginTop: '0', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div className="tab-group" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setView('activity')}
              className={`tab-btn ${view === 'activity' ? 'active' : ''}`}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: view === 'activity' ? '#a855f7' : 'transparent',
                color: view === 'activity' ? 'white' : 'rgba(255,255,255,0.5)'
              }}
            >
              <MessageSquare size={14} /> Activity
            </button>
            <button
              onClick={() => setView('registry')}
              className={`tab-btn ${view === 'registry' ? 'active' : ''}`}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: view === 'registry' ? '#a855f7' : 'transparent',
                color: view === 'registry' ? 'white' : 'rgba(255,255,255,0.5)'
              }}
            >
              <Users size={14} /> Registry
            </button>
            <button
              onClick={() => setView('debug')}
              className={`tab-btn ${view === 'debug' ? 'active' : ''}`}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: view === 'debug' ? '#a855f7' : 'transparent',
                color: view === 'debug' ? 'white' : 'rgba(255,255,255,0.5)'
              }}
            >
              <Terminal size={14} /> Logs
            </button>
          </div>
        </div>

        <div style={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
          {view === 'activity' && (
            history.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', opacity: 0.2 }}>
                <Activity size={48} />
                <p style={{ marginTop: '1rem' }}>SILENCE IN THE CHANNEL</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item" style={{ borderLeft: `3px solid ${item.target === 'PRIMARY_IDE_AGENT' ? '#a855f7' : '#00eeff'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        background: item.target === 'PRIMARY_IDE_AGENT' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 238, 255, 0.2)',
                        color: item.target === 'PRIMARY_IDE_AGENT' ? '#d8b4fe' : '#00eeff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 800
                      }}>
                        TO: {item.target || 'UNKNOWN'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: '1rem', fontWeight: 500 }}>{item.prompt}</p>
                  {item.result && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.9)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {item.result}
                    </div>
                  )}
                  {item.requiresInput && !item.processed && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleInput(item.id, "ACCEPT")}
                        style={{ background: '#22c55e', padding: '10px 20px', fontSize: '0.8rem', width: 'auto' }}
                      >CONFIRM STRATEGY</button>
                      <button
                        onClick={() => handleInput(item.id, "DENY")}
                        style={{ background: '#ef4444', padding: '10px 20px', fontSize: '0.8rem', width: 'auto' }}
                      >ABORT</button>
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {view === 'registry' && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {Object.keys(registry).map(id => {
                const agent = registry[id];
                const isOnline = Date.now() - agent.lastSeen < 60000;
                return (
                  <div key={id} style={{
                    padding: '1.25rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: agent.type === 'IDE' ? '#a855f7' : '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {agent.type === 'IDE' ? <Shield size={20} /> : <Cpu size={20} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{id}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, color: agent.type === 'IDE' ? '#d8b4fe' : '#93c5fd' }}>
                            {agent.role || 'GENERAL PURPOSE NODE'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.7rem',
                          color: isOnline ? '#22c55e' : '#ef4444',
                          fontWeight: 800,
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                          {isOnline ? 'ACTIVE' : 'OFFLINE'}
                        </div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.3 }}>
                          {new Date(agent.lastSeen).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '6px', fontWeight: 800 }}>CURRENT MISSION / STATUS</div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '10px',
                        borderRadius: '8px',
                        color: agent.activeTask ? '#00eeff' : 'rgba(255,255,255,0.3)',
                        border: agent.activeTask ? '1px solid rgba(0, 238, 255, 0.2)' : '1px solid transparent'
                      }}>
                        {agent.activeTask || 'IDLE - STANDING BY'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'debug' && (
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'black', padding: '15px', borderRadius: '12px' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
                  <span style={{ opacity: 0.3, marginRight: '8px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{
                    color: log.type === 'error' ? '#ef4444' : log.type === 'warn' ? '#f59e0b' : log.type === 'agent' ? '#00eeff' : '#6b7280',
                    fontWeight: 'bold',
                    marginRight: '8px',
                    fontSize: '0.7rem'
                  }}>
                    {log.agentId ? `${log.agentId}` : log.type.toUpperCase()}
                  </span>
                  <span style={{ opacity: 0.8 }}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
