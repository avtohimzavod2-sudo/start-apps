import React, { useEffect, useState } from 'react';
import { PRESETS, presetById } from './presets.js';

const PALETTE = ['#2563eb', '#dc2626', '#d97706', '#16a34a', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];
const EMOJI_PRESET = ['✂️', '☕', '🍔', '💇', '💅', '🛒', '📚', '🎵', '🏋️', '🌸', '🍕', '🚗'];

export default function MyTenants({ sa, onOpen, onEdit, user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function reload() {
    setLoading(true);
    try { setList(await sa.tenants.list()); } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  return (
    <section className="sa-stack">
      <header style={{ marginBottom: 4 }}>
        <h1>Мои бизнесы</h1>
        <p className="sa-muted" style={{ marginTop: 4 }}>
          Каждый бизнес — отдельное PWA-приложение с иконкой на телефоне клиентов.
        </p>
      </header>

      {!open ? (
        <button onClick={() => setOpen(true)} style={addCard}>
          <span style={addCardPlus}>+</span>
          <span>Создать новый бизнес</span>
        </button>
      ) : (
        <CreateForm sa={sa} onCancel={() => setOpen(false)} onCreated={(t) => { setOpen(false); reload(); onEdit(t.slug); }} />
      )}

      <div style={{ height: 8 }} />

      {loading ? (
        <p className="sa-muted">Загрузка…</p>
      ) : list.length === 0 ? (
        <div className="sa-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <p style={{ marginBottom: 4 }}>Пока ни одного бизнеса</p>
          <p className="sa-muted" style={{ fontSize: 14 }}>Создай первый — займёт минуту.</p>
        </div>
      ) : (
        <div className="sa-stack">
          {list.map((t) => (
            <TenantCard key={t.id} t={t} onOpen={onOpen} onEdit={onEdit} onChanged={reload} sa={sa} user={user} />
          ))}
        </div>
      )}
    </section>
  );
}

function CreateForm({ sa, onCancel, onCreated }) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [iconEmoji, setIconEmoji] = useState(EMOJI_PRESET[0]);
  const [templateId, setTemplateId] = useState(PRESETS[0].id);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function create() {
    setError(null);
    const s = slug.trim().toLowerCase();
    const n = name.trim();
    if (!s || !n) { setError('Заполни имя и URL'); return; }
    setCreating(true);
    try {
      const t = await sa.tenants.create({ slug: s, name: n, color, icon_emoji: iconEmoji, template_id: templateId });
      onCreated(t);
    } catch (e) {
      setError(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally { setCreating(false); }
  }

  return (
    <div className="sa-card sa-appear">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Новый бизнес</h3>
        <button onClick={onCancel} style={ghostBtn}>отменить</button>
      </div>

      {/* Превью иконки */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, flexShrink: 0, boxShadow: 'var(--shadow)',
        }}>{iconEmoji}</div>
        <div className="sa-muted" style={{ fontSize: 13 }}>
          Такая иконка появится на телефоне клиента при установке.
        </div>
      </div>

      <label style={lbl}>Тип приложения</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => setTemplateId(p.id)} style={presetBtn(templateId === p.id)}>
            <span style={{ fontSize: 24 }}>{p.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <b>{p.name}</b>
              <small className="sa-muted">{p.tagline}</small>
            </span>
          </button>
        ))}
      </div>

      <label style={lbl}>Название бизнеса</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Барбер Алмаз" />

      <label style={lbl}>URL для клиентов</label>
      <input value={slug}
             onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
             placeholder="barber-almaz" />
      {slug && (
        <small className="sa-subtle" style={{ display: 'block', marginTop: 4 }}>
          {window.location.origin}/app/<b style={{ color: 'var(--accent)' }}>{slug}</b>
        </small>
      )}

      <label style={lbl}>Цвет бренда</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PALETTE.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`Цвет ${c}`}
                  style={{
                    width: 36, height: 36, borderRadius: 10, background: c,
                    border: color === c ? '3px solid var(--text)' : '1px solid var(--border)',
                    transition: 'transform 100ms',
                    transform: color === c ? 'scale(1.05)' : 'scale(1)',
                  }} />
        ))}
      </div>

      <label style={lbl}>Иконка</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EMOJI_PRESET.map((e) => (
          <button key={e} onClick={() => setIconEmoji(e)} style={{
            width: 40, height: 40, borderRadius: 10, fontSize: 22,
            background: iconEmoji === e ? 'var(--accent-soft)' : 'var(--surface)',
            border: `1px solid ${iconEmoji === e ? 'var(--accent)' : 'var(--border)'}`,
          }}>{e}</button>
        ))}
      </div>

      {error && <div style={errBox}>⚠ {error}</div>}

      <button onClick={create} disabled={creating} style={{ ...btnPrimary, width: '100%', marginTop: 20 }}>
        {creating ? 'Создаю…' : 'Создать и настроить'}
      </button>
    </div>
  );
}

function TenantCard({ t, onOpen, onEdit, onChanged, sa, user }) {
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const isOwner = user && t.owner_login === user.login;
  const preset = presetById(t.template_id);
  const color = t.color || '#2563eb';

  async function remove(e) {
    e.stopPropagation();
    if (!window.confirm(`Удалить «${t.name}»? Данные пропадут.`)) return;
    setBusy(true);
    try { await sa.tenants.delete(t.slug); await onChanged(); }
    finally { setBusy(false); }
  }

  function handleEdit(e) { e.stopPropagation(); onEdit(t.slug); }

  return (
    <div onClick={() => !busy && onOpen(t.slug)}
         onMouseEnter={() => setHover(true)}
         onMouseLeave={() => setHover(false)}
         style={{ ...cardWrap, transform: hover ? 'translateY(-2px)' : 'none',
                  boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                  borderColor: hover ? color : 'var(--border)' }}>
      <div style={{ ...cardStripe, background: color }} />
      <div style={cardBody}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, flexShrink: 0, boxShadow: `0 4px 12px ${color}33`,
        }}>{t.icon_emoji || '✨'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={presetBadge}>{preset.icon} {preset.name}</span>
            <small className="sa-subtle">/{t.slug}</small>
          </div>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleEdit} disabled={busy} style={editIcon} title="редактировать">✏</button>
            <button onClick={remove} disabled={busy} style={removeIcon} title="удалить">×</button>
          </div>
        )}
        <span style={{
          color: hover ? color : 'var(--text-subtle)',
          fontSize: 22, transition: 'all 120ms',
          transform: hover ? 'translateX(2px)' : 'none',
        }}>→</span>
      </div>
    </div>
  );
}

const addCard = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  padding: 18, borderRadius: 14,
  background: 'var(--surface)', color: 'var(--accent)',
  border: '2px dashed var(--border-strong)',
  fontSize: 15, fontWeight: 500,
};
const addCardPlus = {
  width: 28, height: 28, borderRadius: 8,
  background: 'var(--accent-soft)', color: 'var(--accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, fontWeight: 600,
};
const cardWrap = {
  position: 'relative',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
  transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
};
const cardStripe = {
  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
};
const cardBody = {
  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
  padding: '18px 20px 18px 22px',
};
const presetBadge = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500,
  background: 'var(--surface-alt)', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
const editIcon = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--surface)', color: 'var(--text-muted)',
  border: '1px solid var(--border)', fontSize: 13,
};
const removeIcon = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--surface)', color: 'var(--danger)',
  border: '1px solid var(--border)', fontSize: 18, lineHeight: 1,
};
const lbl = {
  display: 'block', fontSize: 13, color: 'var(--text-muted)',
  marginTop: 14, marginBottom: 6, fontWeight: 500,
};
const presetBtn = (active) => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
  borderRadius: 12, textAlign: 'left',
  background: active ? 'var(--accent-soft)' : 'var(--surface)',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
  color: 'var(--text)', transition: 'all 120ms',
});
const ghostBtn = {
  padding: '6px 10px', borderRadius: 8, fontSize: 13,
  color: 'var(--text-muted)', background: 'transparent',
  border: '1px solid var(--border)',
};
const btnPrimary = {
  padding: '12px 18px', borderRadius: 10,
  background: 'var(--accent)', color: 'var(--accent-text)',
  fontWeight: 600, fontSize: 15,
};
const errBox = {
  color: 'var(--danger)', fontSize: 14, marginTop: 14,
  padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
};
