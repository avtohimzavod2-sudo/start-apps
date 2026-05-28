import React, { useEffect, useRef, useState } from 'react';

// Pomodoro: 25 мин работы / 5 мин отдыха. История завершённых сессий — в sa.storage, ключ 'pomodoro'.
// Структура: { sessions: [{ id, kind: 'work'|'rest', startedAt, finishedAt }] }

const WORK_SEC = 25 * 60;
const REST_SEC = 5 * 60;

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function Pomodoro({ sa }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('work');
  const [remaining, setRemaining] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    sa.storage.get('pomodoro').then((v) => {
      setSessions(Array.isArray(v?.sessions) ? v.sessions : []);
      setLoading(false);
    });
  }, [sa]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        clearInterval(tickRef.current);
        finish();
        return 0;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  async function persist(next) {
    setSessions(next);
    await sa.storage.set('pomodoro', { sessions: next });
  }

  function start() {
    startedAtRef.current = Date.now();
    setRunning(true);
  }

  function pause() {
    setRunning(false);
    clearInterval(tickRef.current);
  }

  function reset() {
    setRunning(false);
    clearInterval(tickRef.current);
    setRemaining(kind === 'work' ? WORK_SEC : REST_SEC);
    startedAtRef.current = null;
  }

  async function finish() {
    setRunning(false);
    const finishedAt = Date.now();
    const startedAt = startedAtRef.current || finishedAt;
    const next = [...sessions, { id: finishedAt, kind, startedAt, finishedAt }];
    await persist(next);
    const nextKind = kind === 'work' ? 'rest' : 'work';
    setKind(nextKind);
    setRemaining(nextKind === 'work' ? WORK_SEC : REST_SEC);
    startedAtRef.current = null;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(kind === 'work' ? 'Помидор готов 🍅' : 'Отдых окончен', {
        body: kind === 'work' ? 'Время отдохнуть 5 минут.' : 'Снова за работу!',
      });
    }
  }

  function switchKind(k) {
    if (running) return;
    setKind(k);
    setRemaining(k === 'work' ? WORK_SEC : REST_SEC);
  }

  function askNotify() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  if (loading) return <div style={{ opacity: 0.6 }}>Загрузка…</div>;

  const today = sessions.filter((s) => s.kind === 'work' && sameDay(s.finishedAt, Date.now()));
  const total = sessions.filter((s) => s.kind === 'work');
  const totalMin = Math.round(total.reduce((acc, s) => acc + (s.finishedAt - s.startedAt) / 60000, 0));
  const recent = [...sessions].reverse().slice(0, 10);

  const progress = 1 - remaining / (kind === 'work' ? WORK_SEC : REST_SEC);
  const accent = kind === 'work' ? '#f66' : '#6cf';

  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Pomodoro</h1>
      <p style={{ opacity: 0.7 }}>25 мин работа / 5 мин отдых. История — через <code>sa.storage</code>, ключ <code>pomodoro</code>.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => switchKind('work')} style={tab(kind === 'work', '#f66')}>🍅 работа</button>
        <button onClick={() => switchKind('rest')} style={tab(kind === 'rest', '#6cf')}>☕ отдых</button>
      </div>

      <div style={{
        background: '#111', borderRadius: 16, padding: 32, textAlign: 'center',
        border: `2px solid ${accent}`, marginBottom: 16,
      }}>
        <div style={{ fontSize: 64, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: accent }}>
          {fmt(remaining)}
        </div>
        <div style={{ height: 6, background: '#222', borderRadius: 3, margin: '16px 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: accent, transition: 'width 1s linear' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {!running ? (
            <button onClick={() => { askNotify(); start(); }} style={primaryBtn(accent)}>▶ старт</button>
          ) : (
            <button onClick={pause} style={primaryBtn('#ca6')}>⏸ пауза</button>
          )}
          <button onClick={reset} style={ghostBtn}>сброс</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <Stat label="сегодня" value={today.length} suffix="🍅" />
        <Stat label="всего" value={total.length} suffix="🍅" />
        <Stat label="минут" value={totalMin} />
      </div>

      <h3 style={{ marginBottom: 8 }}>Последние сессии</h3>
      {recent.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>Пока пусто. Жми старт.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recent.map((s) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: '#111', borderRadius: 8, fontSize: 14,
            }}>
              <span>{s.kind === 'work' ? '🍅 работа' : '☕ отдых'}</span>
              <span style={{ opacity: 0.6 }}>{new Date(s.finishedAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div style={{ background: '#111', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}{suffix ? ` ${suffix}` : ''}</div>
      <div style={{ opacity: 0.6, fontSize: 12 }}>{label}</div>
    </div>
  );
}

const tab = (active, color) => ({
  flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
  border: `1px solid ${active ? color : '#333'}`,
  background: active ? color : 'transparent',
  color: active ? '#001' : '#fff',
});

const primaryBtn = (color) => ({
  padding: '10px 24px', borderRadius: 8, background: color, border: 0,
  cursor: 'pointer', fontWeight: 600, color: '#001', fontSize: 16,
});

const ghostBtn = {
  padding: '10px 16px', borderRadius: 8, background: 'transparent',
  border: '1px solid #333', cursor: 'pointer', color: '#fff',
};
