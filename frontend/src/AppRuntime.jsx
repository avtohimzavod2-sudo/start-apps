import React, { useEffect, useState } from 'react';
import { blockDef } from './blocks/index.js';
import { AppBar, BottomNav } from './design/index.js';

// Клиентский рантайм: AppBar сверху, стек блоков, BottomNav снизу.
// BottomNav скроллит к id="block-{id}". Логика блоков не меняется.

export default function AppRuntime({ sa, tenant, isOwner }) {
  const [config, setConfig] = useState(null);
  const [err, setErr] = useState(null);
  const [active, setActive] = useState('__home__');

  useEffect(() => {
    let alive = true;
    sa.tenants.getConfig(tenant.slug)
      .then((c) => { if (alive) setConfig(c); })
      .catch((e) => { if (alive) setErr(String(e).replace(/^Error:\s*sa:\s*/, '')); });
    return () => { alive = false; };
  }, [sa, tenant.slug]);

  function navTo(id) {
    setActive(id);
    if (id === '__home__') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`block-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  if (err) return <div className="sa-container"><p style={{ color: 'var(--danger)' }}>⚠ {err}</p></div>;
  if (!config) return <div className="sa-container"><p className="sa-muted">Загрузка приложения…</p></div>;

  const visibleBlocks = (config.blocks || []).filter((b) => {
    const def = blockDef(b.type);
    return def && (!def.ownerOnly || isOwner);
  });

  return (
    <div className="sa-appear">
      <AppBar tenant={tenant} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px',
                    paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
        <RenderBlocks config={config} sa={sa} isOwner={isOwner} />
      </div>
      <BottomNav blocks={visibleBlocks} active={active} onSelect={navTo} isOwner={isOwner} />
    </div>
  );
}

// Чистый рендер-луп — используется и в превью конструктора.
// Каждый блок оборачивается в <section id="block-{id}"> чтобы BottomNav мог к нему скроллить.
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
            <div key={b.id} id={`block-${b.id}`} style={{
              padding: 12, marginBottom: 12, background: 'var(--surface-alt)',
              border: '1px dashed var(--danger)', borderRadius: 'var(--radius-card)',
              color: 'var(--danger)',
            }}>
              блок недоступен: <code>{b.type}</code>
            </div>
          );
        }
        if (def.ownerOnly && !isOwner) return null;
        const C = def.component;
        return (
          <section key={b.id} id={`block-${b.id}`} style={{ scrollMarginTop: 80 }}>
            <C settings={b.settings || {}}
               business={config.business || {}}
               data={config.data || {}}
               sa={sa}
               isOwner={isOwner} />
          </section>
        );
      })}
    </>
  );
}
