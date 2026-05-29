import React from 'react';
import { IconButton } from './Button.jsx';
import { IconCart } from './Icons.jsx';

// Верхняя панель приложения тенанта. Фон = градиент акцента (WB-фишка),
// слева — иконка/имя бизнеса, справа — действия (корзина с бейджем, если есть).
// Поиск в MVP скрыт (нечего искать).
export default function AppBar({ tenant, cartCount, onCart, backCrumb, onBack, right }) {
  return (
    <div style={wrap}>
      <div style={inner}>
        {backCrumb && (
          <button onClick={onBack} style={crumbBtn}>← {backCrumb}</button>
        )}
        <div style={iconBox}>{tenant?.icon_emoji || '✨'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={name}>{tenant?.name || 'Приложение'}</div>
          {tenant?.template_id && <div style={tag}>{tenant.template_id === 'barbershop' ? 'Барбершоп' : tenant.template_id}</div>}
        </div>
        {right}
        {onCart && (
          <IconButton icon={IconCart} variant="ghost" size="md" badge={cartCount}
            onClick={onCart}
            title="Корзина" />
        )}
      </div>
    </div>
  );
}

const wrap = {
  background: 'linear-gradient(135deg, var(--accent), var(--accent-press))',
  color: '#fff',
  padding: '14px 16px 16px',
  borderRadius: '0 0 20px 20px',
  marginBottom: 16,
  boxShadow: 'var(--shadow)',
};
const inner = {
  display: 'flex', alignItems: 'center', gap: 12,
  maxWidth: 720, margin: '0 auto',
};
const iconBox = {
  width: 40, height: 40, borderRadius: 12, fontSize: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.22)',
  border: '1px solid rgba(255,255,255,0.3)',
  flexShrink: 0, backdropFilter: 'blur(6px)',
};
const name = {
  fontSize: 16, fontWeight: 500, color: '#fff',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const tag = {
  fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1,
};
const crumbBtn = {
  background: 'rgba(255,255,255,0.18)', color: '#fff',
  padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
  border: '1px solid rgba(255,255,255,0.25)',
};
