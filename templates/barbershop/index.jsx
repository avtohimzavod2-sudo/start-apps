import React, { useEffect, useMemo, useState } from 'react';

// Шаблон Барбершоп. Получает `sa` (scoped to tenant), `tenant` (метаданные),
// `isOwner` и `user`. Работает только через sa.* — никаких прямых вызовов.

export default function Barbershop({ sa, tenant, isOwner, user }) {
  const [view, setView] = useState('home');
  const [config, setConfig] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reloadMine() {
    const list = await sa.bookings.mine();
    setMyBookings(list);
  }

  useEffect(() => {
    (async () => {
      const [cfg, mine] = await Promise.all([
        sa.tenants.getConfig(tenant.slug),
        sa.bookings.mine(),
      ]);
      setConfig(cfg);
      setMyBookings(mine);
      setLoading(false);
    })();
  }, [sa, tenant.slug]);

  if (loading) return <div style={{ opacity: 0.6 }}>Загрузка…</div>;

  const props = { sa, tenant, isOwner, user, config, setConfig, myBookings, reloadMine, setView };
  return (
    <div>
      <Tabs view={view} setView={setView} isOwner={isOwner} />
      {view === 'home' && <Home {...props} />}
      {view === 'booking' && <Booking {...props} />}
      {view === 'chat' && <Chat {...props} />}
      {view === 'owner' && isOwner && <OwnerPanel {...props} />}
    </div>
  );
}

function Tabs({ view, setView, isOwner }) {
  const items = [
    { id: 'home', label: '🏠 Главная' },
    { id: 'booking', label: '📅 Записаться' },
    { id: 'chat', label: '💬 AI' },
  ];
  if (isOwner) items.push({ id: 'owner', label: '⚙️ Управление' });
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
      {items.map((it) => (
        <button key={it.id} onClick={() => setView(it.id)} style={tabBtn(view === it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Home({ tenant, config, setView, myBookings }) {
  const status = computeStatus(config?.schedule || '');
  const mine = myBookings;
  return (
    <section>
      <div style={statusCard(status.open)}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>сейчас</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{status.open ? '🟢 Открыто' : '🔴 Закрыто'}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{config?.schedule || '—'}</div>
      </div>

      {config?.master_name && (
        <p style={{ opacity: 0.8 }}>Мастер: <b>{config.master_name}</b></p>
      )}
      {config?.address && (
        <p style={{ opacity: 0.8 }}>📍 {config.address}</p>
      )}

      <h3>Услуги</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {(config?.services || []).map((s, i) => (
          <div key={i} style={serviceRow}>
            <span>{s.name}</span>
            <span style={{ opacity: 0.7 }}>{s.duration} мин</span>
            <b>{s.price} сом</b>
          </div>
        ))}
        {(!config?.services || config.services.length === 0) && (
          <small style={{ opacity: 0.5 }}>Владелец не настроил услуги.</small>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setView('booking')} style={btnPrimary}>📅 Записаться</button>
        <button onClick={() => setView('chat')} style={btnSecondary}>💬 Спросить AI</button>
      </div>

      {mine.length > 0 && (
        <>
          <h3>Мои записи</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mine.slice().reverse().map((a, i) => (
              <div key={i} style={serviceRow}>
                <span>{a.service}</span>
                <span style={{ opacity: 0.7 }}>{a.date} {a.time}</span>
                <b>{a.price} сом</b>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Booking({ sa, config, reloadMine, setView }) {
  const services = config?.services || [];
  const [service, setService] = useState(null);
  const [date, setDate] = useState(todayPlus(0));
  const [time, setTime] = useState('10:00');
  const [taken, setTaken] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  const times = useMemo(() => {
    const out = [];
    for (let h = 10; h < 20; h++) {
      for (const m of ['00', '30']) out.push(`${String(h).padStart(2, '0')}:${m}`);
    }
    return out;
  }, []);

  useEffect(() => {
    let cancelled = false;
    sa.bookings.taken(date).then((arr) => {
      if (!cancelled) setTaken(new Set(arr));
    });
    return () => { cancelled = true; };
  }, [sa, date, done]);

  async function confirm() {
    if (!service || busy || taken.has(time)) return;
    setBusy(true);
    setErr(null);
    try {
      const b = await sa.bookings.create({
        service: service.name,
        price: service.price,
        duration: service.duration,
        date, time,
      });
      await reloadMine();
      setDone(b);
    } catch (e) {
      const msg = String(e);
      if (msg.includes('409')) {
        setErr('Этот слот только что заняли. Выбери другое время.');
        // Перезагрузим занятые
        const fresh = await sa.bookings.taken(date);
        setTaken(new Set(fresh));
      } else {
        setErr(msg.replace(/^Error:\s*sa:\s*/, ''));
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section style={{ textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2>Записано!</h2>
        <p><b>{done.service}</b> — {done.date} в {done.time}</p>
        <p style={{ opacity: 0.6 }}>{done.price} сом</p>
        <button onClick={() => setView('home')} style={btnPrimary}>На главную</button>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Запись</h2>

      <label style={lbl}>Услуга</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {services.map((s, i) => (
          <button key={i} onClick={() => setService(s)} style={pickRow(service === s)}>
            <span>{s.name}</span>
            <span style={{ opacity: 0.7, fontSize: 13 }}>{s.duration} мин</span>
            <b>{s.price} сом</b>
          </button>
        ))}
      </div>

      <label style={lbl}>Дата</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
        {Array.from({ length: 7 }, (_, i) => i).map((i) => {
          const d = todayPlus(i);
          return (
            <button key={d} onClick={() => setDate(d)} style={pillBtn(date === d)}>
              {d.slice(5)}
            </button>
          );
        })}
      </div>

      <label style={lbl}>Время <small style={{ opacity: 0.5 }}>(серые — заняты)</small></label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
        {times.map((t) => {
          const isTaken = taken.has(t);
          return (
            <button
              key={t}
              onClick={() => !isTaken && setTime(t)}
              disabled={isTaken}
              style={slotBtn(time === t && !isTaken, isTaken)}
            >
              {t}
            </button>
          );
        })}
      </div>

      {err && <div style={{ color: '#f66', fontSize: 13, marginBottom: 8 }}>⚠ {err}</div>}

      <button
        onClick={confirm}
        disabled={!service || busy || taken.has(time)}
        style={{ ...btnPrimary, opacity: (!service || busy || taken.has(time)) ? 0.4 : 1 }}
      >
        {busy ? 'бронирую…' : 'Подтвердить запись'}
      </button>
    </section>
  );
}

function Chat({ sa }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    sa.storage.get('ai_chat').then((v) => setMessages(Array.isArray(v) ? v : []));
  }, [sa]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setErr(null);
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    await sa.storage.set('ai_chat', next);
    setBusy(true);
    try {
      const reply = await sa.ai.chat(next);
      const next2 = [...next, { role: 'assistant', content: reply }];
      setMessages(next2);
      await sa.storage.set('ai_chat', next2);
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    setMessages([]);
    await sa.storage.del('ai_chat');
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>AI-ассистент</h2>
        {messages.length > 0 && (
          <button onClick={clear} style={btnGhost}>очистить</button>
        )}
      </div>
      <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.length === 0 && (
          <p style={{ opacity: 0.5 }}>Спроси о услугах, ценах или запиши себя через чат.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={bubble(m.role)}>
            {m.content}
          </div>
        ))}
        {busy && <div style={bubble('assistant')}>…думаю</div>}
        {err && <div style={{ color: '#f66', fontSize: 13 }}>⚠ {err}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Например: сколько стоит стрижка?"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
        />
        <button onClick={send} disabled={busy} style={btnPrimary}>→</button>
      </div>
    </section>
  );
}

function OwnerPanel({ sa, tenant, config, setConfig }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(config || {})));
  const [allAppts, setAllAppts] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    sa.tenants.appointments(tenant.slug).then(setAllAppts).catch(() => setAllAppts([]));
  }, [sa, tenant.slug]);

  function setField(k, v) {
    setDraft({ ...draft, [k]: v });
  }
  function setService(i, k, v) {
    const services = [...(draft.services || [])];
    services[i] = { ...services[i], [k]: k === 'price' || k === 'duration' ? Number(v) || 0 : v };
    setDraft({ ...draft, services });
  }
  function addService() {
    setDraft({ ...draft, services: [...(draft.services || []), { name: '', price: 0, duration: 30 }] });
  }
  function removeService(i) {
    const services = [...(draft.services || [])];
    services.splice(i, 1);
    setDraft({ ...draft, services });
  }

  async function save() {
    setErr(null);
    try {
      const next = await sa.tenants.setConfig(tenant.slug, draft);
      setConfig(next);
      setSavedAt(Date.now());
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    }
  }

  const today = todayPlus(0);
  const week = Array.from({ length: 7 }, (_, i) => todayPlus(-i));
  const todays = allAppts.filter((a) => a.date === today);
  const weekly = allAppts.filter((a) => week.includes(a.date));

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Сегодня · {todays.length} записей</h2>
      {todays.length === 0 ? (
        <p style={{ opacity: 0.5 }}>На сегодня записей нет.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {todays.map((a, i) => (
            <div key={i} style={serviceRow}>
              <span><b>{a.time}</b> — {a.service}</span>
              <span style={{ opacity: 0.6, fontSize: 13 }}>{a.user_login}</span>
              <b>{a.price} сом</b>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Stat label="всего за неделю" value={weekly.length} />
        <Stat label="выручка за неделю" value={weekly.reduce((s, a) => s + (a.price || 0), 0)} suffix="сом" />
      </div>

      <h3>Данные бизнеса</h3>
      <label style={lbl}>Мастер</label>
      <input value={draft.master_name || ''} onChange={(e) => setField('master_name', e.target.value)} style={input} />

      <label style={lbl}>График</label>
      <input value={draft.schedule || ''} onChange={(e) => setField('schedule', e.target.value)} placeholder="Пн-Сб 10:00-20:00" style={input} />

      <label style={lbl}>Адрес</label>
      <input value={draft.address || ''} onChange={(e) => setField('address', e.target.value)} style={input} />

      <label style={lbl}>Услуги</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(draft.services || []).map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 30px', gap: 6 }}>
            <input value={s.name} onChange={(e) => setService(i, 'name', e.target.value)} placeholder="Название" style={input} />
            <input type="number" value={s.price} onChange={(e) => setService(i, 'price', e.target.value)} placeholder="сом" style={input} />
            <input type="number" value={s.duration} onChange={(e) => setService(i, 'duration', e.target.value)} placeholder="мин" style={input} />
            <button onClick={() => removeService(i)} style={{ ...btnGhost, color: '#f66', borderColor: '#f66' }}>×</button>
          </div>
        ))}
        <button onClick={addService} style={btnGhost}>+ услуга</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
        <button onClick={save} style={btnPrimary}>Сохранить</button>
        {savedAt && <small style={{ opacity: 0.6 }}>✓ сохранено {new Date(savedAt).toLocaleTimeString()}</small>}
        {err && <small style={{ color: '#f66' }}>⚠ {err}</small>}
      </div>
    </section>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}{suffix ? ` ${suffix}` : ''}</div>
      <small style={{ opacity: 0.6 }}>{label}</small>
    </div>
  );
}

// --- helpers ---

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeStatus(scheduleStr) {
  // Очень простая логика: ищем диапазон часов HH:MM-HH:MM в строке.
  // Если нет — считаем закрытым.
  const m = String(scheduleStr).match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return { open: false };
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const from = Number(m[1]) * 60 + Number(m[2]);
  const to = Number(m[3]) * 60 + Number(m[4]);
  return { open: cur >= from && cur < to };
}

// --- styles ---

const tabBtn = (active) => ({
  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
  border: `1px solid ${active ? '#6cf' : '#333'}`,
  background: active ? '#6cf' : 'transparent',
  color: active ? '#001' : '#fff', fontSize: 13, fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap',
});
const statusCard = (open) => ({
  background: '#111', border: `2px solid ${open ? '#6f9' : '#666'}`,
  borderRadius: 12, padding: 16, marginBottom: 16,
});
const serviceRow = {
  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
  alignItems: 'center', padding: '10px 12px', background: '#111', borderRadius: 8,
};
const btnPrimary = {
  flex: 1, padding: '12px 16px', borderRadius: 8, background: '#6cf',
  border: 0, cursor: 'pointer', fontWeight: 600, color: '#001', fontSize: 14,
};
const btnSecondary = {
  flex: 1, padding: '12px 16px', borderRadius: 8, background: 'transparent',
  border: '1px solid #6cf', cursor: 'pointer', fontWeight: 600, color: '#6cf', fontSize: 14,
};
const btnGhost = {
  padding: '8px 12px', borderRadius: 8, background: 'transparent',
  border: '1px solid #333', cursor: 'pointer', color: '#fff', fontSize: 13,
};
const lbl = { display: 'block', fontSize: 13, opacity: 0.6, marginTop: 12, marginBottom: 4 };
const input = {
  padding: 10, borderRadius: 8, border: '1px solid #333',
  background: '#0a0a14', color: '#fff', fontSize: 14, width: '100%', boxSizing: 'border-box',
};
const pickRow = (active) => ({
  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
  alignItems: 'center', padding: '10px 12px', borderRadius: 8,
  background: active ? '#1a2a3a' : '#111',
  border: `1px solid ${active ? '#6cf' : '#222'}`,
  color: '#fff', cursor: 'pointer', textAlign: 'left',
});
const pillBtn = (active) => ({
  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
  border: `1px solid ${active ? '#6cf' : '#333'}`,
  background: active ? '#6cf' : 'transparent',
  color: active ? '#001' : '#fff', fontSize: 13,
});
const slotBtn = (active, isTaken) => ({
  padding: '8px 12px', borderRadius: 8,
  cursor: isTaken ? 'not-allowed' : 'pointer',
  border: `1px solid ${active ? '#6cf' : isTaken ? '#222' : '#333'}`,
  background: active ? '#6cf' : isTaken ? '#1a1a1a' : 'transparent',
  color: active ? '#001' : isTaken ? '#555' : '#fff',
  fontSize: 13,
  textDecoration: isTaken ? 'line-through' : 'none',
});
const bubble = (role) => ({
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  background: role === 'user' ? '#6cf' : '#222',
  color: role === 'user' ? '#001' : '#fff',
  padding: '8px 12px', borderRadius: 12, maxWidth: '80%',
  whiteSpace: 'pre-wrap', fontSize: 14,
});
