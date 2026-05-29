import React from 'react';
import { ui } from './ui.js';

export function Contacts({ business }) {
  const { name, address, phone } = business || {};
  const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  return (
    <section style={ui.section}>
      <h2 style={ui.h2}>Контакты</h2>
      <div style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {name && <div><b>{name}</b></div>}
        {address && (
          <div>
            📍 <a href={mapUrl} target="_blank" rel="noreferrer" style={{ color: '#6cf' }}>{address}</a>
          </div>
        )}
        {phone && (
          <div>
            📞 <a href={`tel:${phone}`} style={{ color: '#6cf' }}>{phone}</a>
          </div>
        )}
        {!address && !phone && (
          <small style={ui.muted}>Контакты пока не заполнены.</small>
        )}
      </div>
    </section>
  );
}

export function ContactsEditor() {
  return (
    <small style={ui.muted}>
      Поля контактов настраиваются в редакторе бизнеса (имя, адрес, телефон). Здесь нечего настраивать.
    </small>
  );
}
