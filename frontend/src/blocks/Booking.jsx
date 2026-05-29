import React, { useEffect, useMemo, useState } from 'react';
import { ui, todayPlus, generateTimes, prettyDate } from './ui.js';

export function Booking({ settings, data, sa }) {
  const services = data?.services || [];
  const schedule = data?.schedule || {};
  const daysAhead = Math.max(1, Math.min(30, Number(settings?.days_ahead) || 7));
  const times = useMemo(() => generateTimes(schedule), [schedule]);

  const [service, setService] = useState(null);
  const [date, setDate] = useState(todayPlus(0));
  const [time, setTime] = useState(times[0] || '10:00');
  const [taken, setTaken] = useState(new Set());
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  async function reloadMine() {
    try { setMine(await sa.bookings.mine()); } catch {}
  }
  useEffect(() => { reloadMine(); }, [sa]);

  useEffect(() => {
    let cancelled = false;
    sa.bookings.taken(date)
      .then((arr) => { if (!cancelled) setTaken(new Set(arr)); })
      .catch(() => { if (!cancelled) setTaken(new Set()); });
    return () => { cancelled = true; };
  }, [sa, date]);

  async function confirm() {
    if (!service || busy || taken.has(time)) return;
    setBusy(true); setErr(null);
    try {
      const b = await sa.bookings.create({ service: service.name, date, time });
      await reloadMine();
      setDone(b);
    } catch (e) {
      const msg = String(e);
      if (msg.includes('409')) {
        setErr('Этот слот только что заняли. Выбери другое время.');
        setTaken(new Set(await sa.bookings.taken(date)));
      } else {
        setErr(msg.replace(/^Error:\s*sa:\s*/, ''));
      }
    } finally { setBusy(false); }
  }

  async function cancelBooking(id) {
    if (!window.confirm('Отменить запись?')) return;
    try {
      await sa.bookings.cancel(id);
      await reloadMine();
      setTaken(new Set(await sa.bookings.taken(date)));
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    }
  }

  if (done) {
    return (
      <section style={{ ...ui.section, textAlign: 'center', padding: '32px 20px',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
          background: 'rgba(22,163,74,0.1)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>✓</div>
        <h2 style={{ marginBottom: 8 }}>Записано</h2>
        <p style={{ marginBottom: 4 }}><b>{done.service}</b></p>
        <p className="sa-muted">{prettyDate(done.date)} в {done.time} · {done.price} сом</p>
        <button onClick={() => setDone(null)} style={{ ...ui.primary, marginTop: 20 }}>
          Записаться ещё
        </button>
      </section>
    );
  }

  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>Записаться</h2>

      {services.length === 0 && (
        <p style={ui.muted}>Сначала добавь услуги в разделе данных.</p>
      )}

      {services.length > 0 && (
        <>
          <label style={ui.lbl}>Услуга</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {services.map((s, i) => (
              <button key={i} onClick={() => setService(s)} style={ui.pickRow(service === s)}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.duration && <small className="sa-muted">{s.duration} мин</small>}
                </div>
                <span />
                <div style={{ fontWeight: 600 }}>{s.price} сом</div>
              </button>
            ))}
          </div>

          <label style={ui.lbl}>Дата</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {Array.from({ length: daysAhead }, (_, i) => todayPlus(i)).map((d) => (
              <button key={d} onClick={() => setDate(d)} style={{ ...ui.pill(date === d), whiteSpace: 'nowrap' }}>
                {prettyDate(d)}
              </button>
            ))}
          </div>

          <label style={ui.lbl}>Время</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, marginBottom: 20 }}>
            {times.map((t) => {
              const isT = taken.has(t);
              return (
                <button key={t} onClick={() => !isT && setTime(t)} disabled={isT}
                        style={ui.slot(time === t && !isT, isT)}>{t}</button>
              );
            })}
          </div>

          {err && <div style={errBox}>⚠ {err}</div>}

          <button onClick={confirm}
                  disabled={!service || busy || taken.has(time)}
                  style={{ ...ui.primary, width: '100%' }}>
            {busy ? 'Бронирую…' : `Записаться на ${prettyDate(date)} в ${time}`}
          </button>
        </>
      )}

      {mine.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 12 }}>Мои записи</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mine.slice().reverse().map((a) => (
              <div key={a.id} style={myRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{a.service}</div>
                  <small className="sa-muted">{prettyDate(a.date)} в {a.time} · {a.price} сом</small>
                </div>
                <button onClick={() => cancelBooking(a.id)} style={ui.danger}>отменить</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function BookingEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>На сколько дней вперёд можно записаться</label>
      <input type="number" min="1" max="30"
             value={settings?.days_ahead ?? 7}
             onChange={(e) => onChange({ ...settings, days_ahead: Number(e.target.value) || 7 })} />
    </div>
  );
}

const myRow = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, boxShadow: 'var(--shadow-sm)',
};
const errBox = {
  color: 'var(--danger)', fontSize: 14, marginBottom: 12,
  padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
};
