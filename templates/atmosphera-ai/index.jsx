import React, { useEffect, useState } from 'react';

// Шаблон-пример: работает ТОЛЬКО через переданный sa (контракт v1).
// Не знает ни про FastAPI, ни про fetch — только про розетки.
export default function AtmospheraAI({ sa }) {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState('');
  const [mood, setMood] = useState('🙂');

  useEffect(() => {
    sa.storage.get('notes').then((v) => setNotes(v || []));
  }, [sa]);

  async function add() {
    if (!draft.trim()) return;
    const next = [...notes, { mood, text: draft.trim(), at: Date.now() }];
    setNotes(next);
    setDraft('');
    await sa.storage.set('notes', next);
  }

  async function clearAll() {
    setNotes([]);
    await sa.storage.del('notes');
  }

  const moods = ['🙂', '😌', '😶‍🌫️', '🌧️', '✨'];
  const counts = moods.map((m) => ({ m, n: notes.filter((x) => x.mood === m).length }));

  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Atmosphera AI</h1>
      <p style={{ opacity: 0.7 }}>Заметка о настроении момента. Хранится через <code>sa.storage</code>.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {moods.map((m) => (
          <button key={m}
            onClick={() => setMood(m)}
            style={{
              fontSize: 22, padding: '6px 10px', borderRadius: 8,
              border: mood === m ? '2px solid #6cf' : '1px solid #333',
              background: '#111', color: '#fff', cursor: 'pointer',
            }}>{m}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="что вокруг прямо сейчас?"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
        />
        <button onClick={add} style={{ padding: '10px 16px', borderRadius: 8, background: '#6cf', border: 0, cursor: 'pointer' }}>+</button>
      </div>

      <h3 style={{ marginTop: 24 }}>Карта настроения</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        {counts.map(({ m, n }) => (
          <div key={m} style={{ textAlign: 'center', minWidth: 40 }}>
            <div style={{ fontSize: 20 }}>{m}</div>
            <div style={{ opacity: 0.7 }}>{n}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Заметки ({notes.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notes.slice().reverse().map((n) => (
          <li key={n.at} style={{ padding: '8px 0', borderBottom: '1px solid #222' }}>
            <span style={{ marginRight: 8 }}>{n.mood}</span>{n.text}
          </li>
        ))}
      </ul>

      {notes.length > 0 && (
        <button onClick={clearAll} style={{ marginTop: 12, background: 'transparent', color: '#f66', border: '1px solid #f66', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
          очистить
        </button>
      )}
    </section>
  );
}
