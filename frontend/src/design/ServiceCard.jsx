import React from 'react';
import PriceTag from './PriceTag.jsx';
import Rating from './Rating.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import { IconImage, IconClock } from './Icons.jsx';

// WB-плотная карточка услуги/товара.
// service: { name, price, oldPrice?, duration?, image?, rating?, reviews?, sale? }
export default function ServiceCard({ service, onPick, cta = 'Записаться', accent }) {
  const s = service || {};
  const hasImg = !!s.image;
  return (
    <div style={wrap}>
      <div style={{ ...media, background: hasImg ? `center/cover no-repeat url("${s.image}")` : 'var(--surface-alt)' }}>
        {!hasImg && (
          <div style={placeholder}>
            <IconImage size={28} color="var(--text-faint)" />
          </div>
        )}
        {s.sale && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <Badge variant="sale">−{s.sale}%</Badge>
          </div>
        )}
      </div>

      <div style={body}>
        <div style={{ marginBottom: 6 }}>
          <PriceTag price={s.price} oldPrice={s.oldPrice} size="md" />
        </div>
        <div style={name} title={s.name}>{s.name}</div>
        <div style={meta}>
          {s.duration ? (
            <span style={metaItem}>
              <IconClock size={12} color="var(--text-faint)" />
              <span>{s.duration} мин</span>
            </span>
          ) : <span />}
          {s.rating != null && <Rating value={s.rating} count={s.reviews} size="sm" />}
        </div>
        <div style={{ marginTop: 10 }}>
          <Button variant="primary" size="sm" block onClick={() => onPick?.(s)}>
            {cta}
          </Button>
        </div>
      </div>
    </div>
  );
}

const wrap = {
  background: 'var(--surface)', borderRadius: 'var(--radius-card)',
  border: '1px solid var(--line)', overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  boxShadow: 'var(--shadow-sm)',
};
const media = {
  position: 'relative', aspectRatio: '4 / 3', width: '100%',
};
const placeholder = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const body = { padding: 12 };
const name = {
  fontSize: 13, lineHeight: 1.35, color: 'var(--text)',
  marginBottom: 6,
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
  overflow: 'hidden', textOverflow: 'ellipsis',
  minHeight: 36,
};
const meta = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontSize: 12, color: 'var(--text-muted)',
};
const metaItem = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
};
