import React, { useEffect, useMemo, useState } from 'react';
import { ui, todayPlus, generateTimes, computeStatusBishkek } from './ui.js';

export function Booking({ settings, data, sa }) {
  const services = data?.services || [];
  const schedule = data?.schedule || {};
  const status = computeStatusBishkek(schedule);
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
    try { setMine(await sa.bookings.mine()); } catch { /* ignore */ }
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
        const fresh = await sa.bookings.taken(date);
        setTaken(new Set(fresh));
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
      const fresh = await sa.bookings.taken(date);
      setTaken(new Set(fresh));
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    }
  }

  if (done) {
    return (
      <section style={{ ...ui.section, textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2 style={ui.h2}>Записано!</h2>
        <p><b>{done.service}</b> — {done.date} в {done.time}</p>
        <p style={ui.muted}>{done.price} сом</p>
        <button onClick={() => setDone(null)} style={ui.primary}>Записаться ещё</button>
      </section>
    );
  }

  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>Запись</h2>
      <div style={{ marginBottom: 12, opacity: 0.7, fontSize: 14 }}>
        {status.open ? '🟢 Сейчас открыто' : '🔴 Сейчас закрыто'} · {status.hours || '—'}
      </div>

      {services.length === 0 && (
        <p style={ui.muted}>Сначала добавь услуги в разделе данных.</p>
      )}

      {services.length > 0 && (
        <>
          <label style={ui.lbl}>Услуга</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {services.map((s, i) => (
              <button key={i} onClick={() => setService(s)} style={ui.pickRow(service === s)}>
                <span>{s.name}</span>
                <span style={{ opacity: 0.7, fontSize: 13 }}>{s.duration ? `${s.duration} мин` : ''}</span>
                <b>{s.price} сом</b>
              </button>
            ))}
          </div>

          <label style={ui.lbl}>Дата</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
            {Array.from({ length: daysAhead }, (_, i) => todayPlus(i)).map((d) => (
              <button key={d} onClick={() => setDate(d)} style={ui.pill(date === d)}>{d.slice(5)}</button>
            ))}
          </div>

          <label style={ui.lbl}>Время <small style={{ opacity: 0.5 }}>(серые — заняты)</small></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {times.map((t) => {
              const isT = taken.has(t);
              return (
                <button key={t} onClick={() => !isT && setTime(t)} disabled={isT}
                        style={ui.slot(time === t && !isT, isT)}>{t}</button>
              );
            })}
          </div>

          {err && <div style={{ color: '#f66', fontSize: 13, marginBottom: 8 }}>⚠ {err}</div>}

          <button onClick={confirm}
                  disabled={!service || busy || taken.has(time)}
                  style={{ ...ui.primary, width: '100%',
                           opacity: (!service || busy || taken.has(time)) ? 0.4 : 1 }}>
            {busy ? 'бронирую…' : 'Подтвердить запись'}
          </button>
        </>
      )}

      {mine.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Мои записи</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mine.slice().reverse().map((a) => (
              <div key={a.id} style={ui.row}>
                <span>{a.service}</span>
                <span style={{ opacity: 0.6, fontSize: 13 }}>{a.date} {a.time}</span>
                <button onClick={() => cancelBooking(a.id)} style={ui.danger}>отменить</button>
              </div>
            ))}
          </div>
        </>
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
             onChange={(e) => onChange({ ...settings, days_ahead: Number(e.target.value) || 7 })}
             style={ui.input} />
    </div>
  );
}
