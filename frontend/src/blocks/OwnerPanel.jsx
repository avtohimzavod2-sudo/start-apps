import React, { useEffect, useState } from 'react';
import { SectionHeader, Badge } from '../design/index.js';
import { ui, todayPlus } from './ui.js';

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

  if (loading) return <div style={ui.section}><p className="sa-muted">Загрузка записей…</p></div>;

  const today = todayPlus(0);
  const week = new Set(Array.from({ length: 7 }, (_, i) => todayPlus(-i)));
  const todays = appts.filter((a) => a.date === today);
  const weekly = appts.filter((a) => week.has(a.date));
  const revenue = weekly.reduce((s, a) => s + (a.price || 0), 0);

  return (
    <div style={ui.section}>
      <SectionHeader title="Управление" subtitle="Сводка для владельца" />
      {err && <div style={errBox}>⚠ {err}</div>}

      <div style={metricsGrid}>
        <Metric label="Сегодня" value={todays.length} accent />
        <Metric label="За неделю" value={weekly.length} />
        <Metric label="Выручка" value={revenue.toLocaleString('ru-RU')} suffix="с" />
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionHeader title={`Сегодня · ${todays.length}`} />
        {todays.length === 0 ? (
          <p className="sa-muted">На сегодня записей нет.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todays.map((a) => (
              <div key={a.id} style={apptRow}>
                <div style={timeChip}>{a.time}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{a.service}</div>
                  <small className="sa-muted">{a.user_login}</small>
                </div>
                <Badge variant="info">{a.price} с</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, suffix, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-soft)' : 'var(--surface)',
      border: `1px solid ${accent ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'var(--line)'}`,
      borderRadius: 'var(--radius-card)', padding: 14,
    }}>
      <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}{suffix ? <small style={{ fontSize: 12, fontWeight: 400, marginLeft: 3, opacity: 0.7 }}>{suffix}</small> : ''}
      </div>
      <small className="sa-muted">{label}</small>
    </div>
  );
}

export function OwnerPanelEditor() {
  return <small className="sa-muted">Сводка автоматическая. Здесь нечего настраивать.</small>;
}

const metricsGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
};
const apptRow = {
  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-sm)',
};
const timeChip = {
  padding: '6px 10px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  background: 'var(--accent-soft)', color: 'var(--accent)', flexShrink: 0,
};
const errBox = {
  color: 'var(--danger)', fontSize: 13, marginBottom: 12,
  padding: '8px 12px', background: 'var(--danger-soft)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.18)',
};
