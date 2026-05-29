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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ ...ui.h2, marginBottom: 0 }}>AI-ассистент</h2>
        {messages.length > 0 && <button onClick={clear} style={ui.ghost}>очистить</button>}
      </div>
      <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.length === 0 && <p style={ui.muted}>{greeting}</p>}
        {messages.map((m, i) => (
          <div key={i} style={ui.bubble(m.role)}>{m.content}</div>
        ))}
        {busy && <div style={ui.bubble('assistant')}>…думаю</div>}
        {err && <div style={{ color: '#f66', fontSize: 13 }}>⚠ {err}</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && send()}
               placeholder="Например: сколько стоит стрижка?"
               style={ui.input} />
        <button onClick={send} disabled={busy} style={ui.primary}>→</button>
      </div>
    </section>
  );
}

export function AiAssistantEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>Приветственное сообщение</label>
      <input value={settings?.greeting || ''}
             onChange={(e) => onChange({ ...settings, greeting: e.target.value })}
             placeholder="Привет! Помогу записаться"
             style={ui.input} />
    </div>
  );
}
