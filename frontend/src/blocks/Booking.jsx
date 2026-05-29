import React, { useEffect, useMemo, useState } from 'react';
import { Button, CategoryChips, PriceTag, SectionHeader, Badge } from '../design/index.js';
import { IconCheck, IconClock } from '../design/Icons.jsx';
import { ui, todayPlus, generateTimes, prettyDate } from './ui.js';

export function Booking({ settings, data, sa }) {
  const services = data?.services || [];
  const schedule = data?.schedule || {};
  const daysAhead = Math.max(1, Math.min(30, Number(settings?.days_ahead) || 7));
  const times = useMemo(() => generateTimes(schedule), [schedule]);

  const [service, setService] = useState(services[0] || null);
  const [date, setDate] = useState(todayPlus(0));
  const [time, setTime] = useState(times[0] || '10:00');
  const [taken, setTaken] = useState(new Set());
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  async function reloadMine() { try { setMine(await sa.bookings.mine()); } catch {} }
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
        setErr('Этот слот только что заняли');
        setTaken(new Set(await sa.bookings.taken(date)));
      } else setErr(msg.replace(/^Error:\s*sa:\s*/, ''));
    } finally { setBusy(false); }
  }

  async function cancelBooking(id) {
    if (!window.confirm('Отменить запись?')) return;
    try {
      await sa.bookings.cancel(id);
      await reloadMine();
      setTaken(new Set(await sa.bookings.taken(date)));
    } catch (e) { setErr(String(e).replace(/^Error:\s*sa:\s*/, '')); }
  }

  if (done) {
    return (
      <div style={ui.section}>
        <div style={successCard}>
          <div style={successIcon}><IconCheck size={28} color="var(--success)" /></div>
          <h2 style={{ marginBottom: 6 }}>Записано</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
            {done.service} · {prettyDate(done.date)} в {done.time}
          </p>
          <PriceTag price={done.price} size="lg" />
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" onClick={() => setDone(null)}>Записаться ещё</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ui.section}>
      <SectionHeader title="Записаться" subtitle="Услуга → дата → время" />

      {services.length === 0 ? (
        <p className="sa-muted">Сначала добавь услуги в редакторе.</p>
      ) : (
        <>
          <label style={ui.lbl}>Услуга</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {services.map((s, i) => (
              <button key={i} onClick={() => setService(s)} style={pickRow(service === s)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.duration && (
                    <small className="sa-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <IconClock size={11} /> {s.duration} мин
                    </small>
                  )}
                </div>
                <PriceTag price={s.price} oldPrice={s.oldPrice} size="md" />
              </button>
            ))}
          </div>

          <label style={ui.lbl}>Дата</label>
          <div style={{ marginBottom: 16 }}>
            <CategoryChips
              items={Array.from({ length: daysAhead }, (_, i) => {
                const d = todayPlus(i);
                return { id: d, label: prettyDate(d) };
              })}
              active={date}
              onSelect={setDate}
            />
          </div>

          <label style={ui.lbl}>Время</label>
          <div style={slotGrid}>
            {times.map((t) => {
              const isT = taken.has(t);
              return (
                <button key={t} onClick={() => !isT && setTime(t)} disabled={isT}
                        style={ui.slot(time === t && !isT, isT)}>{t}</button>
              );
            })}
          </div>

          {err && (
            <div style={{ marginTop: 12 }}><Badge variant="saleSoft">⚠ {err}</Badge></div>
          )}

          <div style={summary}>
            <div>
              <small className="sa-muted">Итого</small>
              <div><PriceTag price={service?.price} size="lg" /></div>
            </div>
            <Button variant="primary" size="lg"
              disabled={!service || busy || taken.has(time)} onClick={confirm}>
              {busy ? 'Бронирую…' : `${prettyDate(date)} · ${time}`}
            </Button>
          </div>
        </>
      )}

      {mine.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <SectionHeader title="Мои записи" subtitle={`${mine.length} активн${mine.length === 1 ? 'ая' : 'ых'}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mine.slice().reverse().map((a) => (
              <div key={a.id} style={myRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{a.service}</div>
                  <small className="sa-muted">{prettyDate(a.date)} в {a.time} · {a.price} с</small>
                </div>
                <Button variant="danger" size="sm" onClick={() => cancelBooking(a.id)}>отменить</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BookingEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>Дней вперёд</label>
      <input type="number" min="1" max="30"
             value={settings?.days_ahead ?? 7}
             onChange={(e) => onChange({ ...settings, days_ahead: Number(e.target.value) || 7 })} />
    </div>
  );
}

const pickRow = (active) => ({
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 16px', borderRadius: 'var(--radius-card)',
  background: active ? 'var(--accent-soft)' : 'var(--surface)',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
  color: 'var(--text)', textAlign: 'left',
  transition: 'all 120ms',
});
const slotGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
  gap: 8, marginBottom: 16,
};
const summary = {
  position: 'sticky', bottom: 'calc(var(--bottom-nav-h) + 8px)',
  marginTop: 20, padding: 14,
  background: 'var(--surface)', borderRadius: 'var(--radius-card)',
  border: '1px solid var(--line)', boxShadow: 'var(--shadow)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
};
const myRow = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 14px', background: 'var(--surface)',
  border: '1px solid var(--line)', borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-sm)',
};
const successCard = {
  textAlign: 'center', padding: '32px 20px',
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
};
const successIcon = {
  width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%',
  background: 'var(--success-soft)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
