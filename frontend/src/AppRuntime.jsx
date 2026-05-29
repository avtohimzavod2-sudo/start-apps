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
  const color = tenant.color || '#2563eb';
  return (
    <div style={{
      ...hero,
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    }}>
      <div style={heroPattern} />
      <div style={heroInner}>
        <div style={heroIcon}>{tenant.icon_emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ marginBottom: 8, color: '#fff', fontSize: 30 }}>{tenant.name}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusPill open={status.open} hours={status.hours} />
            {biz.address && (
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>📍 {biz.address}</span>
            )}
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
      padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 500,
      background: 'rgba(255,255,255,0.2)',
      color: '#fff',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: open ? '#7af07a' : '#ff8080',
        boxShadow: open ? '0 0 8px #7af07a' : 'none',
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
  position: 'relative', marginBottom: 28,
  padding: '32px 24px', borderRadius: 20,
  overflow: 'hidden',
  boxShadow: 'var(--shadow-lg)',
};
const heroPattern = {
  position: 'absolute', inset: 0,
  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 50%)',
  pointerEvents: 'none',
};
const heroInner = {
  position: 'relative', zIndex: 1, display: 'flex',
  alignItems: 'center', gap: 18, flexWrap: 'wrap',
};
const heroIcon = {
  width: 72, height: 72, borderRadius: 18,
  background: 'rgba(255,255,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 38, flexShrink: 0,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.3)',
};
