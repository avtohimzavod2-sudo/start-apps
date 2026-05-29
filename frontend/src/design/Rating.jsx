import React from 'react';
import { IconStar } from './Icons.jsx';

export default function Rating({ value, count, size = 'md' }) {
  if (value == null) return null;
  const sz = size === 'sm' ? 12 : 14;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: size === 'sm' ? 12 : 13, fontWeight: 500, color: 'var(--text)',
    }}>
      <IconStar size={sz} color="var(--star)" />
      <span>{Number(value).toFixed(1)}</span>
      {count != null && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>({count})</span>}
    </span>
  );
}
