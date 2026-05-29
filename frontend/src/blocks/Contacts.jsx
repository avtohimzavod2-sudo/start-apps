import React from 'react';
import { ui } from './ui.js';

export function Contacts({ business }) {
  const { name, address, phone } = business || {};
  const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>Контакты</h2>
      <div style={card}>
        {name && <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 10 }}>{name}</div>}
        {address && (
          <a href={mapUrl} target="_blank" rel="noreferrer" style={contactLine}>
            <span style={icon}>📍</span>
            <span>{address}</span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} style={contactLine}>
            <span style={icon}>📞</span>
            <span>{phone}</span>
          </a>
        )}
        {!address && !phone && <small style={ui.muted}>Контакты пока не заполнены.</small>}
      </div>
    </section>
  );
}

export function ContactsEditor() {
  return (
    <small style={ui.muted}>
      Контакты (имя, адрес, телефон) настраиваются в редакторе данных бизнеса ниже.
    </small>
  );
}

const card = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-sm)',
  display: 'flex', flexDirection: 'column', gap: 4,
};
const contactLine = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
  color: 'var(--text)', textDecoration: 'none', fontSize: 15,
};
const icon = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--accent-soft)', color: 'var(--accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 16, flexShrink: 0,
};
