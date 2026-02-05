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
}

function App() {
  const [status, setStatus] = useState({ online: false, lastSeen: 0 });
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', opacity: 0.8 }}>
          <Terminal size={18} />
          <h3 style={{ margin: 0 }}>Activity Log</h3>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {history.length === 0 ? (
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
                    borderLeft: '2px solid #6366f1'
                  }}>
                    {item.result}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
