import { useState, useEffect } from 'react';
import { ref, onValue, push, set, DataSnapshot } from 'firebase/database';
import { db } from './firebase';
import { Terminal, Send, Activity } from 'lucide-react';
import './App.css';

interface Message {
  id: string;
  action: string;
  processed: boolean;
  result?: string;
  timestamp: number;
  prompt?: string;
  requiresInput?: boolean;
}

interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'agent';
  timestamp: number;
}

function App() {
  const [status, setStatus] = useState({ online: false, lastSeen: 0 });
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'activity' | 'debug'>('activity');

  useEffect(() => {
    // Listen for Online Status
    const statusRef = ref(db, 'bridge/status');
    onValue(statusRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) setStatus(snapshot.val());
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
        })).sort((a: Message, b: Message) => b.timestamp - a.timestamp);

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
      })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
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
    // Mark as processed if it was an input request
    const cmdRef = ref(db, `bridge/commands/${id}/processed`);
    await set(cmdRef, true);
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'left', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800 }}>
          Antigravity <span style={{ color: '#a855f7' }}>Mobile</span>
        </h1>
        <p style={{ opacity: 0.6 }}>Remote Interface</p>
      </header>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className={`status-badge ${status.online ? 'status-online' : 'status-offline'}`}>
            <Activity size={14} />
            {status.online ? 'Local PC Online' : 'Local PC Offline'}
          </div>
          <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>
            ID: ADAMLAB-01
          </div>
        </div>

        <form onSubmit={sendCommand}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tell your local agent to do something..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={!status.online || loading}
            />
            <button type="submit" disabled={!status.online || loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={18} />
              {loading ? 'Transmitting...' : 'Send to PC'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
            <Terminal size={18} />
            <h3 style={{ margin: 0 }}>Terminal</h3>
          </div>
          <div className="tab-group" style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setView('activity')}
              className={`tab-btn ${view === 'activity' ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: view === 'activity' ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
            >Activity</button>
            <button
              onClick={() => setView('debug')}
              className={`tab-btn ${view === 'debug' ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: view === 'debug' ? '#a855f7' : 'rgba(255,255,255,0.1)' }}
            >Debug Logs</button>
          </div>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {view === 'activity' ? (
            history.length === 0 ? (
              <p style={{ opacity: 0.3, textAlign: 'center', padding: '2rem' }}>No recent activity</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#a855f7' }}>{item.action}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0', opacity: 0.8 }}>{item.prompt || 'Local system action'}</p>
                  {item.result && (
                    <div style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      borderLeft: '2px solid #6366f1',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {item.result}
                    </div>
                  )}
                  {item.requiresInput && !item.processed && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleInput(item.id, "ACCEPT")}
                        style={{ background: '#22c55e', padding: '8px 16px', fontSize: '0.8rem' }}
                      >Accept</button>
                      <button
                        onClick={() => handleInput(item.id, "DENY")}
                        style={{ background: '#ef4444', padding: '8px 16px', fontSize: '0.8rem' }}
                      >Deny</button>
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            <div style={{ padding: '10px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {logs.map((log) => (
                <div key={log.id} style={{ marginBottom: '6px', color: log.type === 'error' ? '#ff4444' : log.type === 'warn' ? '#ffaa00' : log.type === 'agent' ? '#00eeff' : '#ffffff', opacity: 0.9 }}>
                  <span style={{ opacity: 0.4, marginRight: '8px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{log.type.toUpperCase()}:</span>
                  {log.message}
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
