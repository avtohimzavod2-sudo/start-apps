import React, { useEffect, useRef, useState } from 'react';
import { ui } from './ui.js';

export function AiAssistant({ settings, sa }) {
  const greeting = settings?.greeting || 'Привет! Помогу записаться или ответить на вопросы.';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    sa.storage.get('ai_chat').then((v) => setMessages(Array.isArray(v) ? v : []));
  }, [sa]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setErr(null);
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setInput('');
    await sa.storage.set('ai_chat', next);
    setBusy(true);
    try {
      const reply = await sa.ai.chat(next);
      const next2 = [...next, { role: 'assistant', content: reply }];
      setMessages(next2);
      await sa.storage.set('ai_chat', next2);
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally { setBusy(false); }
  }

  async function clear() {
    setMessages([]);
    await sa.storage.del('ai_chat');
  }

  return (
    <section style={ui.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ ...ui.h2, marginBottom: 0 }}>💬 AI-ассистент</h2>
        {messages.length > 0 && <button onClick={clear} style={ui.ghost}>очистить</button>}
      </div>

      <div style={chatBox}>
        {messages.length === 0 && (
          <div style={{ ...ui.bubble('assistant'), maxWidth: '100%' }}>
            {greeting}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={ui.bubble(m.role)}>{m.content}</div>
        ))}
        {busy && (
          <div style={ui.bubble('assistant')}>
            <span style={dot}></span><span style={{ ...dot, animationDelay: '0.15s' }}></span><span style={{ ...dot, animationDelay: '0.3s' }}></span>
          </div>
        )}
        {err && <div style={errBox}>⚠ {err}</div>}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && send()}
               placeholder="Напиши свой вопрос…" />
        <button onClick={send} disabled={busy || !input.trim()}
                style={{ ...ui.primary, padding: '12px 16px' }}>→</button>
      </div>

      <style>{`@keyframes sa-blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }`}</style>
    </section>
  );
}

export function AiAssistantEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>Приветственное сообщение</label>
      <input value={settings?.greeting || ''}
             onChange={(e) => onChange({ ...settings, greeting: e.target.value })}
             placeholder="Привет! Помогу записаться" />
    </div>
  );
}

const chatBox = {
  minHeight: 220, maxHeight: 480, overflow: 'auto',
  display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12,
  padding: 16, background: 'var(--surface-alt)', borderRadius: 14,
  border: '1px solid var(--border)',
};
const dot = {
  display: 'inline-block', width: 6, height: 6, margin: '0 2px',
  borderRadius: '50%', background: 'var(--text-muted)',
  animation: 'sa-blink 1.2s infinite',
};
const errBox = {
  color: 'var(--danger)', fontSize: 14,
  padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
};
