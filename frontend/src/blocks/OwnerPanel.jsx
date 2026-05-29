import React, { useEffect, useState } from 'react';
import { ui, todayPlus, prettyDate } from './ui.js';

export function OwnerPanel({ sa, business }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!business?.name) { setLoading(false); return; }
    sa.tenants.appointments(sa.tenant)
      .then(setAppts)
      .catch((e) => setErr(String(e).replace(/^Error:\s*sa:\s*/, '')))
      .finally(() => setLoading(false));
  }, [sa, business?.name]);

  if (loading) return <section style={ui.section}><p style={ui.muted}>Загрузка записей…</p></section>;

  const today = todayPlus(0);
  const week = new Set(Array.from({ length: 7 }, (_, i) => todayPlus(-i)));
  const todays = appts.filter((a) => a.date === today);
  const weekly = appts.filter((a) => week.has(a.date));
  const revenue = weekly.reduce((s, a) => s + (a.price || 0), 0);

  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>⚙️ Управление</h2>
      {err && <div style={errBox}>⚠ {err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <Stat label="Сегодня" value={todays.length} accent />
        <Stat label="За неделю" value={weekly.length} />
        <Stat label="Выручка" value={revenue.toLocaleString('ru-RU')} suffix="сом" />
      </div>

      <h3 style={{ marginBottom: 10 }}>Сегодня {plural(todays.length, ['запись', 'записи', 'записей'])}</h3>
      {todays.length === 0 ? (
        <p style={ui.muted}>На сегодня записей нет.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todays.map((a) => (
            <div key={a.id} style={apptRow}>
              <div style={timeChip}>{a.time}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{a.service}</div>
                <small className="sa-muted">{a.user_login} · {a.price} сом</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, suffix, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-soft)' : 'var(--surface)',
      border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
        {value}{suffix ? <small style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }} className="sa-muted">{suffix}</small> : ''}
      </div>
      <small className="sa-muted">{label}</small>
    </div>
  );
}

function plural(n, [one, few, many]) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if ([2, 3, 4].includes(n10) && ![12, 13, 14].includes(n100)) return few;
  return many;
}

export function OwnerPanelEditor() {
  return <small style={ui.muted}>Здесь нечего настраивать — сводка автоматическая.</small>;
}

const apptRow = {
  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, boxShadow: 'var(--shadow-sm)',
};
const timeChip = {
  padding: '6px 10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
  background: 'var(--accent-soft)', color: 'var(--accent)', flexShrink: 0,
};
const errBox = {
  color: 'var(--danger)', fontSize: 14, marginBottom: 12,
  padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
};
