import React, { useEffect, useState } from 'react';
import { PRESETS, presetById } from './presets.js';
import { Button, SectionHeader, Badge } from './design/index.js';
import { IconPlus, IconEdit, IconX, IconChevronRight, IconArrowRight } from './design/Icons.jsx';

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
      <SectionHeader
        title="Мои бизнесы"
        subtitle={`Привет, ${user?.login}. Каждый бизнес — приложение с иконкой на телефоне клиентов.`}
      />

      {!open ? (
        <button onClick={() => setOpen(true)} style={addCard}>
          <span style={addCardIcon}><IconPlus size={18} /></span>
          <span>Создать новый бизнес</span>
          <IconArrowRight size={18} color="var(--accent)" />
        </button>
      ) : (
        <CreateForm sa={sa} onCancel={() => setOpen(false)}
          onCreated={(t) => { setOpen(false); reload(); onEdit(t.slug); }} />
      )}

      {loading ? (
        <p className="sa-muted">Загрузка…</p>
      ) : list.length === 0 ? (
        <div style={emptyCard}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <h3 style={{ marginBottom: 4 }}>Пока ни одного бизнеса</h3>
          <small className="sa-muted">Создай первый — займёт минуту.</small>
        </div>
      ) : (
        <div style={grid}>
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
    <div style={formCard} className="sa-appear">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Новый бизнес</h2>
        <button onClick={onCancel} style={closeBtn}><IconX size={18} /></button>
      </div>

      {/* Превью иконки */}
      <div style={previewRow}>
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, flexShrink: 0, boxShadow: `0 6px 18px ${color}55`,
        }}>{iconEmoji}</div>
        <small className="sa-muted" style={{ flex: 1 }}>
          Так появится иконка на телефоне клиента при установке.
        </small>
      </div>

      <label style={lbl}>Тип приложения</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => setTemplateId(p.id)} style={presetBtn(templateId === p.id)}>
            <span style={{ fontSize: 24 }}>{p.icon}</span>
            <span style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1, minWidth: 0 }}>
              <b style={{ fontWeight: 500 }}>{p.name}</b>
              <small className="sa-muted">{p.tagline}</small>
            </span>
            {templateId === p.id && <Badge variant="info">выбрано</Badge>}
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
        <small className="sa-faint" style={{ display: 'block', marginTop: 4 }}>
          {window.location.origin}/app/<b style={{ color: 'var(--accent)' }}>{slug}</b>
        </small>
      )}

      <label style={lbl}>Цвет бренда</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PALETTE.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={`Цвет ${c}`}
                  style={{
                    width: 36, height: 36, borderRadius: 10, background: c,
                    border: color === c ? '3px solid var(--text)' : '1px solid var(--line)',
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
            border: `1px solid ${iconEmoji === e ? 'var(--accent)' : 'var(--line)'}`,
          }}>{e}</button>
        ))}
      </div>

      {error && <div style={errBox}>⚠ {error}</div>}

      <div style={{ marginTop: 18 }}>
        <Button variant="primary" size="lg" block disabled={creating} onClick={create}>
          {creating ? 'Создаю…' : 'Создать и настроить'}
        </Button>
      </div>
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
    try { await sa.tenants.delete(t.slug); await onChanged(); } finally { setBusy(false); }
  }
  function handleEdit(e) { e.stopPropagation(); onEdit(t.slug); }

  return (
    <div onClick={() => !busy && onOpen(t.slug)}
         onMouseEnter={() => setHover(true)}
         onMouseLeave={() => setHover(false)}
         style={{
           ...cardWrap,
           transform: hover ? 'translateY(-2px)' : 'none',
           boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
         }}>
      {/* Цветная шапка-баннер */}
      <div style={{
        height: 70, background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', position: 'relative',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, fontSize: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.35)',
          backdropFilter: 'blur(6px)',
        }}>{t.icon_emoji || '✨'}</div>
        <Badge variant="info" style={{ background: 'rgba(255,255,255,0.85)' }}>
          {preset.icon} {preset.name}
        </Badge>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {t.name}
        </div>
        <small className="sa-faint">/{t.slug}</small>

        {isOwner && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={handleEdit} disabled={busy} style={editBtn}>
              <IconEdit size={13} /> Ред.
            </button>
            <button onClick={remove} disabled={busy} style={delBtn} title="удалить">
              <IconX size={14} />
            </button>
            <button onClick={() => onOpen(t.slug)} style={openBtn}>
              Открыть <IconChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const addCard = {
  display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12,
  padding: '16px 18px', borderRadius: 'var(--radius-card)',
  background: 'var(--surface)', color: 'var(--text)',
  border: `1px dashed var(--accent)`,
  fontSize: 15, fontWeight: 500, cursor: 'pointer',
};
const addCardIcon = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--accent-soft)', color: 'var(--accent)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const grid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12,
};
const cardWrap = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', overflow: 'hidden', cursor: 'pointer',
  transition: 'transform 150ms ease, box-shadow 150ms ease',
};
const editBtn = {
  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  background: 'var(--surface-alt)', color: 'var(--text-muted)',
  border: '1px solid var(--line)',
};
const delBtn = {
  width: 30, padding: 8, borderRadius: 8,
  background: 'var(--surface-alt)', color: 'var(--danger)',
  border: '1px solid var(--line)',
};
const openBtn = {
  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
  background: 'var(--accent)', color: 'var(--accent-text)', border: 0,
};
const emptyCard = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-card)', padding: '40px 20px', textAlign: 'center',
};
const formCard = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow)',
};
const previewRow = {
  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
  padding: 14, background: 'var(--surface-alt)', borderRadius: 'var(--radius-card)',
};
const presetBtn = (active) => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: 14,
  borderRadius: 'var(--radius-card)', textAlign: 'left',
  background: active ? 'var(--accent-soft)' : 'var(--surface)',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
  color: 'var(--text)',
});
const closeBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--surface-alt)', color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const lbl = {
  display: 'block', fontSize: 13, color: 'var(--text-muted)',
  marginTop: 14, marginBottom: 6, fontWeight: 500,
};
const errBox = {
  color: 'var(--danger)', fontSize: 13, marginTop: 12,
  padding: '8px 12px', background: 'var(--danger-soft)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.18)',
};
