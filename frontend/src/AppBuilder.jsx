import React, { useEffect, useMemo, useState } from 'react';
import { RenderBlocks } from './AppRuntime.jsx';
import { BLOCK_REGISTRY, allBlockDefs, blockDef, blockGaps } from './blocks/index.js';
import { Button, SectionHeader, Badge } from './design/index.js';
import { IconPlus, IconX, IconChevronLeft } from './design/Icons.jsx';

// Конструктор владельца. Локальный draft → клиентская валидация → publish (PATCH /config).
// Не меняет логику блок-системы, только её UI.
export default function AppBuilder({ sa, tenant, onClose }) {
  const [draft, setDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [err, setErr] = useState(null);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    sa.tenants.getConfig(tenant.slug).then(setDraft);
  }, [sa, tenant.slug]);

  if (!draft) return <p className="sa-muted">Загрузка конструктора…</p>;

  const selected = (draft.blocks || []).find((b) => b.id === selectedId) || null;

  function setBlockSettings(id, settings) {
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) => b.id === id ? { ...b, settings } : b),
    });
  }
  function removeBlock(id) {
    setDraft({ ...draft, blocks: draft.blocks.filter((b) => b.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }
  function moveBlock(id, delta) {
    const idx = draft.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...draft.blocks];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft({ ...draft, blocks: next });
  }
  function addBlock(type) {
    const def = blockDef(type);
    if (!def) return;
    const id = `b_${type}_${Date.now()}`;
    setDraft({
      ...draft,
      blocks: [...(draft.blocks || []), { id, type, settings: { ...def.defaults } }],
    });
    setSelectedId(id);
    setShowPalette(false);
  }
  function setBusiness(field, value) {
    setDraft({ ...draft, business: { ...(draft.business || {}), [field]: value } });
  }
  function setSchedule(field, value) {
    setDraft({ ...draft, data: { ...(draft.data || {}), schedule: { ...((draft.data || {}).schedule || {}), [field]: value } } });
  }
  function setService(idx, field, value) {
    const services = [...((draft.data || {}).services || [])];
    services[idx] = { ...services[idx], [field]: field === 'price' || field === 'duration' ? Number(value) || 0 : value };
    setDraft({ ...draft, data: { ...(draft.data || {}), services } });
  }
  function addService() {
    const services = [...((draft.data || {}).services || []), { name: '', price: 0, duration: 30 }];
    setDraft({ ...draft, data: { ...(draft.data || {}), services } });
  }
  function removeService(idx) {
    const services = [...((draft.data || {}).services || [])];
    services.splice(idx, 1);
    setDraft({ ...draft, data: { ...(draft.data || {}), services } });
  }

  const allGaps = useMemo(() => {
    const out = [];
    for (const b of draft.blocks || []) {
      for (const g of blockGaps(b, draft)) out.push(`${blockDef(b.type)?.label || b.type}: ${g}`);
    }
    return out;
  }, [draft]);

  async function publish() {
    setErr(null);
    if (allGaps.length > 0) { setErr('Сначала почини: ' + allGaps[0]); return; }
    setPublishing(true);
    try {
      const next = await sa.tenants.setConfig(tenant.slug, draft);
      setDraft(next); setSavedAt(Date.now());
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally { setPublishing(false); }
  }

  function onDragStart(id) { setDragId(id); }
  function onDragOver(e) { e.preventDefault(); }
  function onDrop(targetId) {
    if (!dragId || dragId === targetId) return;
    const blocks = [...draft.blocks];
    const from = blocks.findIndex((b) => b.id === dragId);
    const to = blocks.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = blocks.splice(from, 1);
    blocks.splice(to, 0, moved);
    setDraft({ ...draft, blocks });
    setDragId(null);
  }

  const presentTypes = new Set((draft.blocks || []).map((b) => b.type));
  const paletteOptions = allBlockDefs().filter((d) => !presentTypes.has(d.type));

  return (
    <div className="sa-stack">
      <header style={builderHdr}>
        <button onClick={onClose} style={backBtn}>
          <IconChevronLeft size={18} /> назад
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>Конструктор</h2>
          <small className="sa-muted">{tenant.name}</small>
        </div>
        <Button variant="primary" disabled={publishing || allGaps.length > 0} onClick={publish}>
          {publishing ? 'Публикую…' : 'Опубликовать'}
        </Button>
      </header>

      {err && <div style={errBox}>⚠ {err}</div>}
      {savedAt && (
        <Badge variant="success">✓ опубликовано в {new Date(savedAt).toLocaleTimeString()}</Badge>
      )}

      {allGaps.length > 0 && (
        <div style={warningBox}>
          <b>Нужно заполнить:</b>
          <ul style={{ margin: '6px 0 0 20px', padding: 0 }}>
            {allGaps.map((g, i) => <li key={i} style={{ fontSize: 13 }}>{g}</li>)}
          </ul>
        </div>
      )}

      {/* Список блоков */}
      <section>
        <SectionHeader title="Блоки приложения" subtitle="Перетягивай ⋮⋮ или жми ↑↓" />
        <div className="sa-stack">
          {(draft.blocks || []).map((b, idx) => {
            const def = blockDef(b.type);
            const isSel = selectedId === b.id;
            const gaps = blockGaps(b, draft);
            return (
              <div key={b.id}
                   draggable
                   onDragStart={() => onDragStart(b.id)}
                   onDragOver={onDragOver}
                   onDrop={() => onDrop(b.id)}
                   style={{
                     background: isSel ? 'var(--accent-soft)' : 'var(--surface)',
                     border: `1px solid ${isSel ? 'var(--accent)' : gaps.length ? 'var(--warning)' : 'var(--line)'}`,
                     borderRadius: 'var(--radius-card)', padding: 12,
                     display: 'flex', alignItems: 'center', gap: 10,
                     boxShadow: 'var(--shadow-sm)', cursor: 'grab',
                   }}>
                <span style={{ color: 'var(--text-faint)', cursor: 'grab' }}>⋮⋮</span>
                <span style={{ fontSize: 22 }}>{def?.icon || '❓'}</span>
                <button onClick={() => setSelectedId(isSel ? null : b.id)}
                        style={{ flex: 1, background: 'transparent', textAlign: 'left' }}>
                  <div style={{ fontWeight: 500 }}>
                    {def?.label || b.type}
                    {def?.ownerOnly && <small className="sa-faint" style={{ marginLeft: 6 }}>· для владельца</small>}
                  </div>
                  {gaps.length > 0 && <small style={{ color: 'var(--warning)' }}>⚠ {gaps[0]}</small>}
                </button>
                <button onClick={() => moveBlock(b.id, -1)} disabled={idx === 0} style={iconBtn} title="вверх">↑</button>
                <button onClick={() => moveBlock(b.id, 1)} disabled={idx === draft.blocks.length - 1} style={iconBtn} title="вниз">↓</button>
                <button onClick={() => removeBlock(b.id)} style={{ ...iconBtn, color: 'var(--danger)' }} title="удалить"><IconX size={14} /></button>
              </div>
            );
          })}
        </div>

        {paletteOptions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {!showPalette ? (
              <Button variant="secondary" icon={IconPlus} onClick={() => setShowPalette(true)}>
                Добавить блок
              </Button>
            ) : (
              <div style={paletteCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <b>Палитра блоков</b>
                  <button onClick={() => setShowPalette(false)} style={iconBtn}><IconX size={14} /></button>
                </div>
                <div className="sa-stack">
                  {paletteOptions.map((def) => (
                    <button key={def.type} onClick={() => addBlock(def.type)} style={paletteItem}>
                      <span style={{ fontSize: 22 }}>{def.icon}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <b style={{ fontWeight: 500 }}>{def.label}</b>
                        {def.ownerOnly && <small className="sa-faint"> · только владелец</small>}
                      </span>
                      <IconPlus size={16} color="var(--accent)" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {selected && (
        <section>
          <SectionHeader title={`Настройки: ${blockDef(selected.type)?.label}`} />
          <div style={panelCard}>
            {(() => {
              const Editor = blockDef(selected.type)?.EditorPanel;
              return Editor ? <Editor settings={selected.settings || {}}
                                      onChange={(s) => setBlockSettings(selected.id, s)}
                                      data={draft.data} business={draft.business} />
                            : <small className="sa-muted">Нет настроек.</small>;
            })()}
          </div>
        </section>
      )}

      <BusinessEditor draft={draft} setBusiness={setBusiness} setSchedule={setSchedule}
                      setService={setService} addService={addService} removeService={removeService} />

      <section>
        <SectionHeader title="Превью" subtitle="Так это увидят клиенты" />
        <div style={previewCard}>
          <RenderBlocks config={draft} sa={sa} isOwner={true} />
        </div>
      </section>
    </div>
  );
}

function BusinessEditor({ draft, setBusiness, setSchedule, setService, addService, removeService }) {
  const biz = draft.business || {};
  const sch = (draft.data || {}).schedule || {};
  const services = (draft.data || {}).services || [];
  return (
    <section>
      <SectionHeader title="Данные бизнеса" subtitle="Их видят все клиенты" />
      <div style={panelCard}>
        <label style={lbl}>Название</label>
        <input value={biz.name || ''} onChange={(e) => setBusiness('name', e.target.value)} />

        <label style={lbl}>Адрес</label>
        <input value={biz.address || ''} onChange={(e) => setBusiness('address', e.target.value)} placeholder="Бишкек, ул. Манаса 45" />

        <label style={lbl}>Телефон</label>
        <input value={biz.phone || ''} onChange={(e) => setBusiness('phone', e.target.value)} placeholder="+996 ..." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          <div>
            <label style={lbl}>Цвет бренда</label>
            <input type="color" value={biz.color || '#2563eb'} onChange={(e) => setBusiness('color', e.target.value)}
                   style={{ padding: 4, height: 40 }} />
          </div>
          <div>
            <label style={lbl}>Эмодзи</label>
            <input value={biz.emoji || '✂️'} onChange={(e) => setBusiness('emoji', e.target.value)} maxLength={4} />
          </div>
        </div>

        <label style={lbl}>График Пн-Сб (HH:MM-HH:MM)</label>
        <input value={sch.mon_sat || ''} onChange={(e) => setSchedule('mon_sat', e.target.value)} placeholder="10:00-20:00" />

        <label style={lbl}>Воскресенье</label>
        <input value={sch.sun || ''} onChange={(e) => setSchedule('sun', e.target.value)} placeholder="closed или 12:00-18:00" />

        <label style={lbl}>Длительность слота (мин)</label>
        <input type="number" min="5" max="240" value={sch.slot_min ?? 30}
               onChange={(e) => setSchedule('slot_min', Number(e.target.value) || 30)} />

        <label style={lbl}>Услуги</label>
        <div className="sa-stack" style={{ marginTop: 0 }}>
          {services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 36px', gap: 6 }}>
              <input value={s.name} onChange={(e) => setService(i, 'name', e.target.value)} placeholder="Название" />
              <input type="number" value={s.price} onChange={(e) => setService(i, 'price', e.target.value)} placeholder="сом" />
              <input type="number" value={s.duration} onChange={(e) => setService(i, 'duration', e.target.value)} placeholder="мин" />
              <button onClick={() => removeService(i)} style={{ ...iconBtn, color: 'var(--danger)' }}><IconX size={14} /></button>
            </div>
          ))}
          <Button variant="ghost" icon={IconPlus} size="sm" onClick={addService}>добавить услугу</Button>
        </div>
      </div>
    </section>
  );
}

const builderHdr = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '4px 0', marginBottom: 4,
};
const backBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '6px 10px', borderRadius: 8, fontSize: 13,
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--line)',
};
const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--surface)', color: 'var(--text-muted)',
  border: '1px solid var(--line)', fontSize: 14,
};
const panelCard = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', padding: 16,
  boxShadow: 'var(--shadow-sm)',
};
const previewCard = {
  background: 'var(--surface-alt)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', padding: 16,
};
const paletteCard = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', padding: 14,
  boxShadow: 'var(--shadow-sm)',
};
const paletteItem = {
  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
  borderRadius: 'var(--radius-card)', textAlign: 'left',
  background: 'var(--surface-alt)', color: 'var(--text)',
  border: '1px solid var(--line)',
};
const lbl = {
  display: 'block', fontSize: 13, color: 'var(--text-muted)',
  marginTop: 10, marginBottom: 4, fontWeight: 500,
};
const errBox = {
  color: 'var(--danger)', fontSize: 14,
  padding: '8px 12px', background: 'var(--danger-soft)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.18)',
};
const warningBox = {
  background: 'rgba(180,83,9,0.06)',
  border: '1px solid rgba(180,83,9,0.25)',
  borderRadius: 10, padding: 14, color: 'var(--warning)',
};
