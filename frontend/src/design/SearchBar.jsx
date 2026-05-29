import React from 'react';
import { IconSearch, IconX } from './Icons.jsx';

// Поисковая пилюля. В MVP в AppBar её не рендерим (ещё нечего искать),
// но компонент готов: блоки могут использовать его как локальный поиск.
export default function SearchBar({ value, onChange, placeholder = 'Поиск…', autoFocus }) {
  return (
    <div style={wrap}>
      <IconSearch size={18} color="var(--text-faint)" />
      <input
        autoFocus={autoFocus}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
      {value && (
        <button onClick={() => onChange?.('')} style={clearBtn} title="очистить">
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

const wrap = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 12px', height: 40,
  background: 'var(--surface-alt)', borderRadius: 'var(--radius-pill)',
  border: '1px solid transparent',
  transition: 'border-color 120ms, background 120ms',
};
const input = {
  flex: 1, border: 0, padding: 0, background: 'transparent',
  fontSize: 14, color: 'var(--text)', outline: 'none', boxShadow: 'none',
};
const clearBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 22, height: 22, borderRadius: '50%',
  background: 'var(--line-strong)', color: 'var(--text-muted)',
};
