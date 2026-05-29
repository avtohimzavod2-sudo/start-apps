import React, { useEffect, useRef, useState } from 'react';
import { Button, IconButton, SectionHeader } from '../design/index.js';
import { IconMessage, IconX, IconArrowRight } from '../design/Icons.jsx';
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
    <div style={ui.section}>
      <SectionHeader
        title="AI-ассистент"
        actionLabel={messages.length > 0 ? 'очистить' : null}
        onAction={messages.length > 0 ? clear : undefined}
      />

      <div style={chatBox}>
        {messages.length === 0 && (
          <Bubble role="assistant" first>{greeting}</Bubble>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>{m.content}</Bubble>
        ))}
        {busy && (
          <Bubble role="assistant">
            <span style={dot}></span>
            <span style={{ ...dot, animationDelay: '0.15s' }}></span>
            <span style={{ ...dot, animationDelay: '0.3s' }}></span>
          </Bubble>
        )}
        {err && <div style={errBox}>⚠ {err}</div>}
        <div ref={endRef} />
      </div>

      <div style={inputRow}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && send()}
               placeholder="Напиши свой вопрос…"
               style={{ flex: 1, height: 44, borderRadius: 'var(--radius-pill)', padding: '0 16px' }} />
        <IconButton icon={IconArrowRight} variant="primary" onClick={send}
                    disabled={busy || !input.trim()} title="Отправить" />
      </div>
    </div>
  );
}

function Bubble({ role, children, first }) {
  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '82%', padding: '10px 14px',
          background: 'var(--accent)', color: 'var(--accent-text)',
          borderRadius: '16px 16px 4px 16px',
          fontSize: 14, lineHeight: 1.4, whiteSpace: 'pre-wrap',
        }}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={avatar}><IconMessage size={14} color="var(--accent)" /></div>
      <div style={{
        maxWidth: '82%', padding: '10px 14px',
        background: 'var(--surface)', color: 'var(--text)',
        borderRadius: '16px 16px 16px 4px',
        border: '1px solid var(--line)',
        fontSize: 14, lineHeight: 1.4, whiteSpace: 'pre-wrap',
        boxShadow: 'var(--shadow-sm)',
      }}>{children}</div>
    </div>
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
  minHeight: 240, maxHeight: 520, overflow: 'auto',
  display: 'flex', flexDirection: 'column', gap: 10,
  marginBottom: 12, padding: 14,
  background: 'var(--surface-alt)', borderRadius: 'var(--radius-card)',
  border: '1px solid var(--line)',
};
const inputRow = {
  display: 'flex', alignItems: 'center', gap: 8,
};
const avatar = {
  width: 28, height: 28, borderRadius: '50%',
  background: 'var(--accent-soft)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const dot = {
  display: 'inline-block', width: 6, height: 6, margin: '0 2px',
  borderRadius: '50%', background: 'var(--text-faint)',
  animation: 'sa-pulse 1.2s infinite',
};
const errBox = {
  color: 'var(--danger)', fontSize: 13,
  padding: '8px 12px', background: 'var(--danger-soft)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.18)',
};
