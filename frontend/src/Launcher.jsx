import React from 'react';
import { TEMPLATES } from './templates.js';

// Главный экран после логина — выбор шаблона из реестра.
export default function Launcher({ onOpen }) {
  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Мои приложения</h1>
      <p style={{ opacity: 0.7 }}>
        Шаблоны платформы. У каждого свои данные, общая авторизация и общие розетки.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 20 }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onOpen(t.id)}
            style={{
              textAlign: 'left',
              background: '#111',
              border: '1px solid #222',
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              transition: 'border-color .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6cf')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
          >
            <div style={{ fontSize: 28 }}>{t.icon}</div>
            <strong>{t.name}</strong>
            <small style={{ opacity: 0.6 }}>{t.tagline}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
