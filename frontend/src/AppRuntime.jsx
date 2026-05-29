import React, { useEffect, useState } from 'react';
import { blockDef } from './blocks/index.js';
import { computeStatusBishkek } from './blocks/ui.js';

export default function AppRuntime({ sa, tenant, isOwner }) {
  const [config, setConfig] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    sa.tenants.getConfig(tenant.slug)
      .then((c) => { if (alive) setConfig(c); })
      .catch((e) => { if (alive) setErr(String(e).replace(/^Error:\s*sa:\s*/, '')); });
    return () => { alive = false; };
  }, [sa, tenant.slug]);

  if (err) return <p style={{ color: 'var(--danger)' }}>⚠ {err}</p>;
  if (!config) return <p className="sa-muted">Загрузка приложения…</p>;

  return (
    <div className="sa-appear">
      <TenantHero tenant={tenant} config={config} />
      <RenderBlocks config={config} sa={sa} isOwner={isOwner} />
    </div>
  );
}

function TenantHero({ tenant, config }) {
  const biz = config.business || {};
  const status = computeStatusBishkek(config.data?.schedule);
  return (
    <div style={hero}>
      <div style={heroBackdrop} />
      <div style={heroInner}>
        <div style={heroIcon}>{tenant.icon_emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ marginBottom: 4 }}>{tenant.name}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusPill open={status.open} hours={status.hours} />
            {biz.address && <span className="sa-muted" style={{ fontSize: 14 }}>📍 {biz.address}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ open, hours }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500,
      background: open ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
      color: open ? 'var(--success)' : 'var(--danger)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: open ? 'var(--success)' : 'var(--danger)',
      }} />
      {open ? 'Открыто' : 'Закрыто'}{hours ? ` · ${hours}` : ''}
    </span>
  );
}

// Чистый рендер-луп — используется и в превью конструктора.
export function RenderBlocks({ config, sa, isOwner }) {
  const blocks = config?.blocks || [];
  if (blocks.length === 0) {
    return <p className="sa-muted">В этом приложении пока нет блоков.</p>;
  }
  return (
    <>
      {blocks.map((b) => {
        const def = blockDef(b.type);
        if (!def) {
          if (!isOwner) return null;
          return (
            <div key={b.id} style={{
              padding: 12, marginBottom: 12, background: 'var(--surface-alt)',
              border: '1px dashed var(--danger)', borderRadius: 8, color: 'var(--danger)',
            }}>
              блок недоступен: <code>{b.type}</code>
            </div>
          );
        }
        if (def.ownerOnly && !isOwner) return null;
        const C = def.component;
        return (
          <C key={b.id}
             settings={b.settings || {}}
             business={config.business || {}}
             data={config.data || {}}
             sa={sa}
             isOwner={isOwner} />
        );
      })}
    </>
  );
}

const hero = {
  position: 'relative', marginBottom: 28, padding: '24px 4px 24px',
};
const heroBackdrop = {
  position: 'absolute', inset: '-24px -16px auto -16px', height: 140,
  background: 'linear-gradient(180deg, var(--accent-soft), transparent)',
  borderRadius: '0 0 24px 24px', zIndex: 0, pointerEvents: 'none',
};
const heroInner = {
  position: 'relative', zIndex: 1, display: 'flex',
  alignItems: 'center', gap: 16, flexWrap: 'wrap',
};
const heroIcon = {
  width: 64, height: 64, borderRadius: 16,
  background: 'var(--accent)', color: 'var(--accent-text)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 34, flexShrink: 0, boxShadow: 'var(--shadow)',
};
