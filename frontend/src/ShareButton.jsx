import React, { useState } from 'react';

// Web Share API на мобилках с системным шитом, на десктопе fallback в clipboard.
export default function ShareButton({ title, url }) {
  const [hint, setHint] = useState(null);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setHint('ссылка скопирована');
        setTimeout(() => setHint(null), 2000);
      }
    } catch (e) {
      // отмена шер-диалога — это AbortError, считаем за норму
      if (e?.name !== 'AbortError') setHint(String(e.message || e));
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={share}
        style={{
          background: 'transparent', color: '#6cf', border: '1px solid #6cf',
          padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
        }}
      >
        ↗ поделиться
      </button>
      {hint && <small style={{ opacity: 0.7 }}>{hint}</small>}
    </span>
  );
}
