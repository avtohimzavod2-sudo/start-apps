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
  const isOwner = user && t.owner_login === user.login;
  const preset = presetById(t.template_id);

  async function remove() {
    if (!window.confirm(`Удалить бизнес «${t.name}»? Все данные пропадут.`)) return;
    setBusy(true);
    try { await sa.tenants.delete(t.slug); await onChanged(); }
    finally { setBusy(false); }
  }

  return (
    <div style={cardWrap}>
      <button onClick={() => onOpen(t.slug)} disabled={busy} style={cardMain}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: t.color || '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0, boxShadow: 'var(--shadow-sm)',
        }}>{t.icon_emoji || '✨'}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </div>
          <small className="sa-muted">
            {preset.icon} {preset.name} · /{t.slug}
          </small>
        </div>
        <span style={{ color: 'var(--text-subtle)', fontSize: 20 }}>→</span>
      </button>

      {isOwner && (
        <div style={cardActions}>
          <button onClick={() => onEdit(t.slug)} disabled={busy} style={editAction}>✏ редактировать</button>
          <button onClick={remove} disabled={busy} style={removeAction} title="удалить">×</button>
        </div>
      )}
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
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
};
const cardMain = {
  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
  padding: 14, background: 'transparent', color: 'var(--text)',
};
const cardActions = {
  display: 'flex', gap: 1, padding: '0 14px 14px',
};
const editAction = {
  flex: 1, padding: '10px 14px', borderRadius: 8,
  background: 'var(--surface-alt)', color: 'var(--text-muted)',
  border: '1px solid var(--border)', fontSize: 13, fontWeight: 500,
  marginRight: 8,
};
const removeAction = {
  width: 38, padding: 10, borderRadius: 8,
  background: 'var(--surface-alt)', color: 'var(--danger)',
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
