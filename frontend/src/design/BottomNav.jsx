import React from 'react';
import {
  IconHome, IconCart, IconCalendar, IconMessage, IconMapPin, IconSettings,
} from './Icons.jsx';

// Маппинг типов блоков → пункт нижней навигации.
// Иконки берём из набора, метки русские.
const BLOCK_NAV = {
  services:     { label: 'Каталог',    icon: IconCart },
  booking:      { label: 'Запись',     icon: IconCalendar },
  ai_assistant: { label: 'AI',         icon: IconMessage },
  contacts:     { label: 'Контакты',   icon: IconMapPin },
  owner_panel:  { label: 'Управление', icon: IconSettings },
};

// Собирает пункты nav по реестру блоков, ограничивает до 5, в начало добавляет «Главная».
// onSelect(id) — id блока. Поведение клика — smooth-scroll к id="block-{id}", делает родитель.
export default function BottomNav({ blocks = [], active, onSelect, includeHome = true, isOwner }) {
  const items = [];
  if (includeHome) items.push({ id: '__home__', label: 'Главная', icon: IconHome });
  for (const b of blocks) {
    if (b.type === 'owner_panel' && !isOwner) continue;
    const def = BLOCK_NAV[b.type];
    if (!def) continue;
    items.push({ id: b.id, label: def.label, icon: def.icon });
  }
  const trimmed = items.slice(0, 5);
  if (trimmed.length < 2) return null;

  return (
    <nav style={wrap}>
      <div style={inner}>
        {trimmed.map((it) => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onSelect?.(it.id)} style={item(isActive)}>
              <it.icon size={22} />
              <span style={{ fontSize: 11, marginTop: 2, fontWeight: isActive ? 500 : 400 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const wrap = {
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
  background: 'var(--surface)', borderTop: '1px solid var(--line)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  boxShadow: '0 -2px 12px rgba(15,18,28,0.04)',
};
const inner = {
  display: 'flex', justifyContent: 'space-around',
  maxWidth: 720, margin: '0 auto', padding: '0 8px',
};
const item = (active) => ({
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '8px 4px', minHeight: 56,
  background: 'transparent',
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  transition: 'color 120ms',
});
