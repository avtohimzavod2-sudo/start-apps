import React from 'react';

export default function PromoBanner({ title, subtitle, cta, onAction, emoji }) {
  return (
    <div onClick={onAction} style={{ ...wrap, cursor: onAction ? 'pointer' : 'default' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={titleStyle}>{title}</div>}
        {subtitle && <div style={subStyle}>{subtitle}</div>}
        {cta && <div style={ctaStyle}>{cta} →</div>}
      </div>
      {emoji && <div style={emojiStyle}>{emoji}</div>}
    </div>
  );
}

const wrap = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: 16, borderRadius: 'var(--radius-card)',
  background: 'var(--accent-soft)',
  border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
};
const titleStyle = { fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 2 };
const subStyle = { fontSize: 13, color: 'var(--text-muted)' };
const ctaStyle = { fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginTop: 6 };
const emojiStyle = { fontSize: 32, flexShrink: 0 };
