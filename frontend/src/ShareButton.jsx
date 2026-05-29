import React, { useState } from 'react';

export default function ShareButton({ title, url }) {
  const [hint, setHint] = useState(null);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setHint('ссылка скопирована');
        setTimeout(() => setHint(null), 2000);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') setHint(String(e.message || e));
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button onClick={share} style={btn}>↗ поделиться</button>
      {hint && <small style={{ color: 'var(--text-muted)' }}>{hint}</small>}
    </span>
  );
}

const btn = {
  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: 'transparent', color: 'var(--accent)',
  border: '1px solid var(--border-strong)',
};
