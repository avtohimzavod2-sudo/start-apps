import React, { useEffect, useState } from 'react';
import { ui, todayPlus } from './ui.js';

// ownerOnly: рантайм не показывает клиенту. Здесь — только сводка по записям.
// Редактирование услуг/графика/контактов — отдельный экран AppBuilder, не блок.
export function OwnerPanel({ sa, business }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!business?.name) { setLoading(false); return; }
    // tenant slug нужен — берём из sa.tenant
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
      <h2 style={ui.h2}>⚙️ Управление · сегодня {todays.length} запис{plural(todays.length)}</h2>
      {err && <div style={{ color: '#f66', fontSize: 13, marginBottom: 8 }}>⚠ {err}</div>}

      {todays.length === 0 ? (
        <p style={ui.muted}>На сегодня записей нет.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {todays.map((a) => (
            <div key={a.id} style={ui.row}>
              <span><b>{a.time}</b> — {a.service}</span>
              <span style={{ opacity: 0.6, fontSize: 13 }}>{a.user_login}</span>
              <b>{a.price} сом</b>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Stat label="за неделю" value={weekly.length} />
        <Stat label="выручка" value={revenue} suffix="сом" />
      </div>
    </section>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div style={{ flex: 1, ...ui.card, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}{suffix ? ` ${suffix}` : ''}</div>
      <small style={ui.muted}>{label}</small>
    </div>
  );
}

function plural(n) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 'ь';
  if ([2, 3, 4].includes(n10) && ![12, 13, 14].includes(n100)) return 'и';
  return 'ей';
}

export function OwnerPanelEditor() {
  return <small style={ui.muted}>Здесь нечего настраивать.</small>;
}
