import React from 'react';

const SIZES = {
  sm: { padding: '6px 10px',   fontSize: 13, iconGap: 4, height: 30 },
  md: { padding: '9px 14px',   fontSize: 14, iconGap: 6, height: 38 },
  lg: { padding: '12px 16px',  fontSize: 15, iconGap: 8, height: 46 },
};

const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--line-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid transparent',
  },
  accentSoft: {
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--line)',
  },
};

export default function Button({
  children, onClick, disabled, type = 'button',
  variant = 'primary', size = 'md', icon: Icon, block, style, title,
}) {
  const sz = SIZES[size] || SIZES.md;
  const vr = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: sz.iconGap, padding: sz.padding, height: sz.height,
        borderRadius: 'var(--radius-btn)', fontWeight: 500, fontSize: sz.fontSize,
        cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
        transition: 'transform 80ms ease, filter 120ms ease, background 120ms ease',
        width: block ? '100%' : undefined,
        ...vr, ...style,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}>
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, onClick, disabled, variant = 'ghost', size = 'md', title, badge }) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;
  const vr = VARIANTS[variant] || VARIANTS.ghost;
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        position: 'relative', width: dim, height: dim, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-btn)', cursor: 'pointer',
        transition: 'background 120ms ease',
        ...vr,
      }}>
      <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
      {badge != null && Number(badge) > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16,
          padding: '0 4px', borderRadius: 8, background: 'var(--sale)', color: '#fff',
          fontSize: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge}</span>
      )}
    </button>
  );
}
