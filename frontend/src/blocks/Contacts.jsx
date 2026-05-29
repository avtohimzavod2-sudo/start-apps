import React from 'react';
import { Button, SectionHeader } from '../design/index.js';
import { IconPhone, IconMapPin } from '../design/Icons.jsx';
import { ui } from './ui.js';

export function Contacts({ business }) {
  const { name, address, phone } = business || {};
  const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  const telUrl = phone ? `tel:${phone.replace(/\s+/g, '')}` : null;
  const hasContacts = !!(address || phone);

  return (
    <div style={ui.section}>
      <SectionHeader title="Контакты" />
      {!hasContacts ? (
        <p className="sa-muted">Контакты пока не заполнены.</p>
      ) : (
        <div style={card}>
          {name && <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>{name}</div>}

          {address && (
            <div style={{ marginBottom: 12 }}>
              <div style={lineRow}>
                <div style={lineIcon}><IconMapPin size={16} color="var(--accent)" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <small className="sa-muted">Адрес</small>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{address}</div>
                </div>
              </div>
            </div>
          )}

          {phone && (
            <div style={{ marginBottom: 16 }}>
              <div style={lineRow}>
                <div style={lineIcon}><IconPhone size={16} color="var(--accent)" /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <small className="sa-muted">Телефон</small>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{phone}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {telUrl && (
              <a href={telUrl} style={{ flex: 1, textDecoration: 'none' }}>
                <Button variant="primary" icon={IconPhone} block>Позвонить</Button>
              </a>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                <Button variant="secondary" icon={IconMapPin} block>Маршрут</Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactsEditor() {
  return (
    <small className="sa-muted">
      Контакты заполняются в редакторе данных бизнеса ниже.
    </small>
  );
}

const card = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', padding: 16,
  boxShadow: 'var(--shadow-sm)',
};
const lineRow = {
  display: 'flex', alignItems: 'center', gap: 12,
};
const lineIcon = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--accent-soft)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
