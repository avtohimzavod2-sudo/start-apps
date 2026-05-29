import React from 'react';
import { ui } from './ui.js';

export function Services({ settings, data }) {
  const services = data?.services || [];
  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>{settings?.title || 'Наши услуги'}</h2>
      {services.length === 0 ? (
        <p style={ui.muted}>Услуги пока не настроены.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map((s, i) => (
            <div key={i} style={serviceRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                {s.duration && <small className="sa-muted">{s.duration} мин</small>}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{s.price} <small className="sa-muted">сом</small></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ServicesEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>Заголовок раздела</label>
      <input value={settings?.title || ''}
             onChange={(e) => onChange({ ...settings, title: e.target.value })}
             placeholder="Наши услуги" />
    </div>
  );
}

const serviceRow = {
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, boxShadow: 'var(--shadow-sm)',
};
