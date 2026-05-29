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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {services.map((s, i) => (
            <div key={i} style={ui.row}>
              <span>{s.name}</span>
              {s.duration ? <span style={{ opacity: 0.6 }}>{s.duration} мин</span> : <span />}
              <b>{s.price} сом</b>
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
      <label style={ui.lbl}>Заголовок</label>
      <input
        value={settings?.title || ''}
        onChange={(e) => onChange({ ...settings, title: e.target.value })}
        placeholder="Наши услуги"
        style={ui.input}
      />
    </div>
  );
}
