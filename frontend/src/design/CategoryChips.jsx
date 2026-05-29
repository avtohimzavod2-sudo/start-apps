import React from 'react';

// Горизонтальный ряд чипов с активным состоянием.
// items: [{ id, label, icon? }] | строки
export default function CategoryChips({ items = [], active, onSelect }) {
  if (!items.length) return null;
  return (
    <div style={scroller}>
      {items.map((raw) => {
        const item = typeof raw === 'string' ? { id: raw, label: raw } : raw;
        const isActive = item.id === active;
        return (
          <button key={item.id} onClick={() => onSelect?.(item.id)} style={chip(isActive)}>
            {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const scroller = {
  display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
  scrollbarWidth: 'none',
};
const chip = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 'var(--radius-pill)',
  fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
  background: active ? 'var(--accent)' : 'var(--surface)',
  color: active ? 'var(--accent-text)' : 'var(--text-muted)',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
  transition: 'all 120ms',
});
