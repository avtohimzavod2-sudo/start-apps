import React, { useEffect, useState } from 'react';
import { TEMPLATES } from './templates.js';

// Дашборд владельца: список бизнесов которые он создал + форма создания.
// Каждый «бизнес» — это tenant со своим пространством данных.
const PALETTE = ['#6cf', '#f66', '#fc6', '#9f6', '#c9f', '#fa8', '#6fc', '#f9c'];
const EMOJI_PRESET = ['✂️', '☕', '🍔', '💇', '💅', '🛒', '📚', '🎵', '🏋️', '🌸', '🍕', '🚗'];

export default function MyTenants({ sa, onOpen }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [iconEmoji, setIconEmoji] = useState(EMOJI_PRESET[0]);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setList(await sa.tenants.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  async function create() {
    setError(null);
    const s = slug.trim().toLowerCase();
    const n = name.trim();
    if (!s || !n) { setError('заполни оба поля'); return; }
    setCreating(true);
    try {
      const tpl = TEMPLATES.find((x) => x.id === templateId);
      const t = await sa.tenants.create({
        slug: s, name: n, color, icon_emoji: iconEmoji,
        template_id: templateId,
        config: tpl?.defaultConfig || {},
      });
      setSlug(''); setName('');
      await reload();
      onOpen(t.slug);
    } catch (e) {
      setError(String(e).replace(/^Error:\s*sa:\s*/, ''));
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Мои бизнесы</h1>
      <p style={{ opacity: 0.7 }}>
        Каждый бизнес — отдельное приложение со своим URL и своими клиентами.
        Поделись ссылкой с клиентами — они смогут зарегистрироваться и пользоваться.
      </p>

      <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Создать бизнес</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12, background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, flexShrink: 0,
          }}>{iconEmoji}</div>
          <div style={{ opacity: 0.6, fontSize: 13 }}>Так будет выглядеть иконка приложения на телефоне клиента.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ ...lblStyle, marginTop: 0 }}>Тип приложения</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setTemplateId(tpl.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: templateId === tpl.id ? '#1a2a3a' : '#0a0a14',
                  border: `1px solid ${templateId === tpl.id ? '#6cf' : '#333'}`,
                  color: '#fff',
                }}
              >
                <span style={{ fontSize: 22 }}>{tpl.icon}</span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <b>{tpl.name}</b>
                  <small style={{ opacity: 0.6 }}>{tpl.tagline}</small>
                </span>
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (Барбер Алмаз)"
            style={inputStyle}
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="URL (barber-almaz) — латиница, цифры, дефис"
            style={inputStyle}
          />

          <label style={lblStyle}>Цвет</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: 8, background: c,
                border: color === c ? '3px solid #fff' : '1px solid #333',
                cursor: 'pointer',
              }} />
            ))}
          </div>

          <label style={lblStyle}>Иконка</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EMOJI_PRESET.map((e) => (
              <button key={e} onClick={() => setIconEmoji(e)} style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 20,
                background: iconEmoji === e ? '#222' : '#0a0a14',
                border: iconEmoji === e ? '2px solid #6cf' : '1px solid #333',
                cursor: 'pointer', color: '#fff',
              }}>{e}</button>
            ))}
          </div>

          <button onClick={create} disabled={creating} style={btnPrimary}>
            {creating ? 'создаю…' : 'Создать'}
          </button>
          {error && <div style={{ color: '#f66', fontSize: 14 }}>⚠ {error}</div>}
          {slug && (
            <small style={{ opacity: 0.5 }}>
              URL клиентам: {window.location.origin}/app/{slug}
            </small>
          )}
        </div>
      </div>

      <h3>Существующие</h3>
      {loading ? (
        <p style={{ opacity: 0.5 }}>загрузка…</p>
      ) : list.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Пока ни одного. Создай первый выше.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((t) => (
            <TenantCard key={t.id} t={t} onOpen={onOpen} onChanged={reload} sa={sa} />
          ))}
        </div>
      )}
    </section>
  );
}

function TenantCard({ t, onOpen, onChanged, sa }) {
  const [busy, setBusy] = useState(false);
  const currentTpl = TEMPLATES.find((x) => x.id === t.template_id);

  async function changeTemplate(newId) {
    if (newId === t.template_id) return;
    setBusy(true);
    try {
      await sa.tenants.update(t.slug, { template_id: newId });
      await onChanged();
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Удалить бизнес «${t.name}» и все его данные? Отменить нельзя.`)) return;
    setBusy(true);
    try {
      await sa.tenants.delete(t.slug);
      await onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, background: t.color || '#6cf',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>{t.icon_emoji || '✨'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</strong>
            <span style={{ opacity: 0.5, fontSize: 13 }}>/{t.slug}</span>
          </div>
          <small style={{ opacity: 0.5 }}>
            тип: {currentTpl?.name || t.template_id} · создан {new Date(t.created_at).toLocaleDateString()}
          </small>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={() => onOpen(t.slug)} disabled={busy} style={btnOpen}>открыть →</button>
        <select
          value={t.template_id}
          onChange={(e) => changeTemplate(e.target.value)}
          disabled={busy}
          style={selectStyle}
          title="сменить тип приложения"
        >
          {TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>{tpl.icon} {tpl.name}</option>
          ))}
        </select>
        <button onClick={remove} disabled={busy} style={btnDanger} title="удалить бизнес">×</button>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 10, borderRadius: 8, border: '1px solid #333',
  background: '#0a0a14', color: '#fff', fontSize: 14,
};

const btnPrimary = {
  padding: '10px 16px', borderRadius: 8, background: '#6cf',
  border: 0, cursor: 'pointer', fontWeight: 600, color: '#001',
};

const lblStyle = { fontSize: 13, opacity: 0.6, marginTop: 8 };

const btnOpen = {
  flex: 1, padding: '6px 12px', borderRadius: 8, background: '#6cf',
  border: 0, cursor: 'pointer', color: '#001', fontWeight: 600, fontSize: 13,
};
const selectStyle = {
  padding: '6px 10px', borderRadius: 8, background: '#0a0a14',
  border: '1px solid #333', color: '#fff', fontSize: 13, cursor: 'pointer',
};
const btnDanger = {
  padding: '6px 12px', borderRadius: 8, background: 'transparent',
  border: '1px solid #f66', color: '#f66', cursor: 'pointer', fontSize: 16, lineHeight: 1,
};
