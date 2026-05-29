import React, { useEffect, useState } from 'react';

// Дашборд владельца: список бизнесов которые он создал + форма создания.
// Каждый «бизнес» — это tenant со своим пространством данных.
export default function MyTenants({ sa, onOpen }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
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
      const t = await sa.tenants.create(s, n);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            <button
              key={t.id}
              onClick={() => onOpen(t.slug)}
              style={cardStyle}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{t.name}</strong>
                <span style={{ opacity: 0.5, fontSize: 13 }}>/{t.slug}</span>
              </div>
              <small style={{ opacity: 0.5 }}>создан {new Date(t.created_at).toLocaleDateString()}</small>
            </button>
          ))}
        </div>
      )}
    </section>
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

const cardStyle = {
  textAlign: 'left', background: '#111', border: '1px solid #222',
  borderRadius: 10, padding: 14, cursor: 'pointer', color: '#fff',
  display: 'flex', flexDirection: 'column', gap: 4,
};
