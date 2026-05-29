import React from 'react';

const SIZES = {
  sm: { price: 14, old: 11, suffix: 11 },
  md: { price: 17, old: 12, suffix: 12 },
  lg: { price: 22, old: 13, suffix: 13 },
};

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('ru-RU');
}

export default function PriceTag({ price, oldPrice, size = 'md', currency = 'с' }) {
  const sz = SIZES[size] || SIZES.md;
  const hasDiscount = oldPrice != null && Number(oldPrice) > Number(price);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: sz.price, fontWeight: 500, color: hasDiscount ? 'var(--sale)' : 'var(--text)' }}>
        {fmt(price)}<span style={{ fontSize: sz.suffix, color: 'inherit', marginLeft: 2, fontWeight: 400, opacity: 0.85 }}>{currency}</span>
      </span>
      {hasDiscount && (
        <span style={{ fontSize: sz.old, color: 'var(--text-faint)', textDecoration: 'line-through' }}>
          {fmt(oldPrice)} {currency}
        </span>
      )}
    </span>
  );
}
