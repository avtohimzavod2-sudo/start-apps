import React, { useEffect, useMemo, useState } from 'react';
import { RenderBlocks } from './AppRuntime.jsx';
import { BLOCK_REGISTRY, allBlockDefs, blockDef, blockGaps } from './blocks/index.js';
import { ui } from './blocks/ui.js';

// Конструктор владельца. Работает с локальным draft конфига, публикует через PATCH /config.
// DnD — native HTML5 для desktop + кнопки ↑↓ для мобайла. Без внешних зависимостей.
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

  if (!draft) return <p style={{ opacity: 0.6 }}>Загрузка конструктора…</p>;

  const selected = (draft.blocks || []).find((b) => b.id === selectedId) || null;

  function patchBlock(id, patch) {
    setDraft({
      ...draft,
      blocks: draft.blocks.map((b) => b.id === id ? { ...b, ...patch, settings: { ...(b.settings || {}), ...(patch.settings || {}) } } : b),
    });
  }
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

  // Подсветка проблем во всём приложении: соберём пробелы по всем блокам.
  const allGaps = useMemo(() => {
    const out = [];
    for (const b of draft.blocks || []) {
      for (const g of blockGaps(b, draft)) out.push(`${blockDef(b.type)?.label || b.type}: ${g}`);
    }
    return out;
  }, [draft]);

  async function publish() {
    setErr(null);
    if (allGaps.length > 0) {
      setErr('Сначала почини: ' + allGaps[0]);
      return;
    }
    setPublishing(true);
    try {
      const next = await sa.tenants.setConfig(tenant.slug, draft);
      setDraft(next);
      setSavedAt(Date.now());
    } catch (e) {
      setErr(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally {
      setPublishing(false);
    }
  }

  // DnD handlers
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onClose} style={ui.ghost}>← назад</button>
        <h2 style={{ ...ui.h2, marginBottom: 0, flex: 1 }}>Конструктор: {tenant.name}</h2>
        <button onClick={publish} disabled={publishing || allGaps.length > 0}
                style={{ ...ui.primary, opacity: (publishing || allGaps.length > 0) ? 0.4 : 1 }}>
          {publishing ? 'публикую…' : 'Опубликовать'}
        </button>
        {savedAt && <small style={{ opacity: 0.6 }}>✓ {new Date(savedAt).toLocaleTimeString()}</small>}
      </header>

      {err && (
        <div style={{ color: 'var(--danger)', fontSize: 14,
                      padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
                      borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>⚠ {err}</div>
      )}
      {allGaps.length > 0 && (
        <div style={{ background: 'rgba(180,83,9,0.06)',
                      border: '1px solid rgba(180,83,9,0.25)',
                      borderRadius: 10, padding: 14, color: 'var(--warning)' }}>
          <b>Нужно заполнить:</b>
          <ul style={{ margin: '6px 0 0 20px', padding: 0 }}>
            {allGaps.map((g, i) => <li key={i} style={{ fontSize: 13 }}>{g}</li>)}
          </ul>
        </div>
      )}

      <section>
        <h3>Блоки приложения</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                     border: `1px solid ${isSel ? 'var(--accent)' : gaps.length ? 'var(--warning)' : 'var(--border)'}`,
                     borderRadius: 12, padding: 12,
                     display: 'flex', alignItems: 'center', gap: 10,
                     cursor: 'grab', boxShadow: 'var(--shadow-sm)',
                   }}>
                <span style={{ color: 'var(--text-subtle)', cursor: 'grab' }}>⋮⋮</span>
                <span style={{ fontSize: 22 }}>{def?.icon || '❓'}</span>
                <button onClick={() => setSelectedId(isSel ? null : b.id)}
                        style={{ flex: 1, background: 'transparent', textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {def?.label || b.type}
                    {def?.ownerOnly && <small className="sa-subtle" style={{ fontWeight: 400, marginLeft: 6 }}>· для владельца</small>}
                  </div>
                  {gaps.length > 0 && <small style={{ color: 'var(--warning)' }}>⚠ {gaps[0]}</small>}
                </button>
                <button onClick={() => moveBlock(b.id, -1)} disabled={idx === 0} style={iconBtn} title="вверх">↑</button>
                <button onClick={() => moveBlock(b.id, 1)} disabled={idx === draft.blocks.length - 1} style={iconBtn} title="вниз">↓</button>
                <button onClick={() => removeBlock(b.id)} style={{ ...iconBtn, color: 'var(--danger)' }} title="удалить">×</button>
              </div>
            );
          })}
        </div>

        {paletteOptions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {!showPalette ? (
              <button onClick={() => setShowPalette(true)} style={ui.ghost}>+ добавить блок</button>
            ) : (
              <div style={{ ...ui.card, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <b>Палитра</b>
                  <button onClick={() => setShowPalette(false)} style={ui.ghost}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {paletteOptions.map((def) => (
                    <button key={def.type} onClick={() => addBlock(def.type)}
                            style={{ ...ui.pickRow(false), gridTemplateColumns: 'auto 1fr auto' }}>
                      <span style={{ fontSize: 22 }}>{def.icon}</span>
                      <span><b>{def.label}</b>{def.ownerOnly && <small className="sa-subtle"> · только владелец</small>}</span>
                      <span style={{ color: 'var(--accent)' }}>+</span>
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
          <h3>Настройки блока «{blockDef(selected.type)?.label}»</h3>
          <div style={ui.card}>
            {(() => {
              const Editor = blockDef(selected.type)?.EditorPanel;
              return Editor ? <Editor settings={selected.settings || {}}
                                      onChange={(s) => setBlockSettings(selected.id, s)}
                                      data={draft.data} business={draft.business} />
                            : <small style={ui.muted}>Нет настроек.</small>;
            })()}
          </div>
        </section>
      )}

      <BusinessEditor draft={draft} setBusiness={setBusiness} setSchedule={setSchedule}
                      setService={setService} addService={addService} removeService={removeService} />

      <section>
        <h3>Превью</h3>
        <div style={{ ...ui.card, padding: 16 }}>
          <RenderBlocks config={draft} sa={sa} isOwner={true} />
        </div>
      </section>
    </div>
  );
}

const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--surface)', color: 'var(--text-muted)',
  border: '1px solid var(--border)', fontSize: 14,
};

function BusinessEditor({ draft, setBusiness, setSchedule, setService, addService, removeService }) {
  const biz = draft.business || {};
  const sch = (draft.data || {}).schedule || {};
  const services = (draft.data || {}).services || [];
  return (
    <section>
      <h3>Данные бизнеса</h3>
      <div style={{ ...ui.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={ui.lbl}>Название</label>
        <input value={biz.name || ''} onChange={(e) => setBusiness('name', e.target.value)} style={ui.input} />

        <label style={ui.lbl}>Адрес</label>
        <input value={biz.address || ''} onChange={(e) => setBusiness('address', e.target.value)}
               placeholder="Бишкек, ул. Манаса 45" style={ui.input} />

        <label style={ui.lbl}>Телефон</label>
        <input value={biz.phone || ''} onChange={(e) => setBusiness('phone', e.target.value)}
               placeholder="+996 ..." style={ui.input} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={ui.lbl}>Цвет</label>
            <input type="color" value={biz.color || '#6cf'} onChange={(e) => setBusiness('color', e.target.value)}
                   style={{ ...ui.input, padding: 4, height: 38 }} />
          </div>
          <div>
            <label style={ui.lbl}>Эмодзи</label>
            <input value={biz.emoji || '✂️'} onChange={(e) => setBusiness('emoji', e.target.value)}
                   maxLength={4} style={ui.input} />
          </div>
        </div>

        <label style={ui.lbl}>График Пн-Сб (HH:MM-HH:MM)</label>
        <input value={sch.mon_sat || ''} onChange={(e) => setSchedule('mon_sat', e.target.value)}
               placeholder="10:00-20:00" style={ui.input} />

        <label style={ui.lbl}>Воскресенье</label>
        <input value={sch.sun || ''} onChange={(e) => setSchedule('sun', e.target.value)}
               placeholder="closed или 12:00-18:00" style={ui.input} />

        <label style={ui.lbl}>Длительность слота (мин)</label>
        <input type="number" min="5" max="240" value={sch.slot_min ?? 30}
               onChange={(e) => setSchedule('slot_min', Number(e.target.value) || 30)} style={ui.input} />

        <label style={ui.lbl}>Услуги (название, цена в сомах, длительность в мин)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 30px', gap: 6 }}>
              <input value={s.name} onChange={(e) => setService(i, 'name', e.target.value)} placeholder="Название" style={ui.input} />
              <input type="number" value={s.price} onChange={(e) => setService(i, 'price', e.target.value)} placeholder="сом" style={ui.input} />
              <input type="number" value={s.duration} onChange={(e) => setService(i, 'duration', e.target.value)} placeholder="мин" style={ui.input} />
              <button onClick={() => removeService(i)} style={ui.danger}>×</button>
            </div>
          ))}
          <button onClick={addService} style={ui.ghost}>+ услуга</button>
        </div>
      </div>
    </section>
  );
}
