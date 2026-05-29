import React, { useEffect, useState } from 'react';
import { blockDef } from './blocks/index.js';

// Клиентский рантайм-рендерер.
// Загружает config через sa.tenants.getConfig (бэк уже нормализует под единую схему),
// затем мапит config.blocks → компоненты из реестра и рендерит по порядку.
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

  if (err) return <p style={{ color: '#f66' }}>⚠ {err}</p>;
  if (!config) return <p style={{ opacity: 0.6 }}>Загрузка приложения…</p>;

  return <RenderBlocks config={config} sa={sa} isOwner={isOwner} />;
}

// Чистый рендер-луп — переиспользуется в превью конструктора.
export function RenderBlocks({ config, sa, isOwner }) {
  const blocks = config?.blocks || [];
  if (blocks.length === 0) {
    return <p style={{ opacity: 0.6 }}>В этом приложении пока нет блоков.</p>;
  }
  return (
    <>
      {blocks.map((b) => {
        const def = blockDef(b.type);
        if (!def) {
          if (!isOwner) return null;
          return (
            <div key={b.id} style={{
              padding: 12, marginBottom: 12, background: '#1a1a2a',
              border: '1px dashed #f66', borderRadius: 8, color: '#f66',
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
