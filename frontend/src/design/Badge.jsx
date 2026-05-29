import React from 'react';

const VARIANTS = {
  sale:    { background: 'var(--sale)',      color: '#fff' },
  saleSoft:{ background: 'var(--sale-soft)', color: 'var(--sale)' },
  info:    { background: 'var(--accent-soft)', color: 'var(--accent)' },
  neutral: { background: 'var(--surface-alt)', color: 'var(--text-muted)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)' },
  new:     { background: 'var(--accent)', color: 'var(--accent-text)' },
};

export default function Badge({ children, variant = 'info', size = 'sm' }) {
  const vr = VARIANTS[variant] || VARIANTS.info;
  const pad = size === 'sm' ? '2px 8px' : '4px 10px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, borderRadius: 'var(--radius-pill)',
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 500,
      lineHeight: 1, whiteSpace: 'nowrap',
      ...vr,
    }}>{children}</span>
  );
}
