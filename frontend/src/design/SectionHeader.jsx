import React from 'react';
import { IconChevronRight } from './Icons.jsx';

export default function SectionHeader({ title, actionLabel, onAction, subtitle }) {
  return (
    <div style={wrap}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ marginBottom: subtitle ? 2 : 0 }}>{title}</h2>
        {subtitle && <small className="sa-muted">{subtitle}</small>}
      </div>
      {actionLabel && (
        <button onClick={onAction} style={action}>
          <span>{actionLabel}</span>
          <IconChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

const wrap = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
  marginBottom: 12,
};
const action = {
  display: 'inline-flex', alignItems: 'center', gap: 2,
  fontSize: 13, fontWeight: 500, color: 'var(--accent)',
  background: 'transparent', padding: '4px 0',
};
