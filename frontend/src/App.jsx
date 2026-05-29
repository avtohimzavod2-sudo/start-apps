import React, { useEffect, useMemo, useState } from 'react';
import InstallButton from './InstallButton.jsx';
import ShareButton from './ShareButton.jsx';
import AuthForm from './AuthForm.jsx';
import MyTenants from './MyTenants.jsx';
import IosInstallHint from './IosInstallHint.jsx';
import AppRuntime from './AppRuntime.jsx';
import AppBuilder from './AppBuilder.jsx';

function parseUrl() {
  const m = window.location.pathname.match(/^\/app\/([a-z0-9-]+)(?:\/(edit))?\/?$/i);
  if (!m) return { slug: null, mode: 'home' };
  return { slug: m[1].toLowerCase(), mode: m[2] === 'edit' ? 'edit' : 'view' };
}

// hex → rgba for accent-soft mixing
function softColor(hex, alpha = 0.08) {
  const m = /^#?([\da-f]{6})$/i.exec(hex);
  if (!m) return `rgba(37, 99, 235, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function App({ sa }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(parseUrl());
  const [tenant, setTenant] = useState(null);
  const [tenantError, setTenantError] = useState(null);

  useEffect(() => {
    (async () => {
      if (sa.auth.isAuthorized()) {
        try { setUser(await sa.auth.me()); } catch { sa.auth.logout(); }
      }
      setReady(true);
    })();
  }, [sa]);

  useEffect(() => {
    const onPop = () => setRoute(parseUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!route.slug || !user) { setTenant(null); setTenantError(null); return; }
    setTenantError(null);
    sa.tenants.get(route.slug)
      .then(setTenant)
      .catch((e) => setTenantError(String(e).includes('404') ? 'Бизнес не найден' : 'Ошибка загрузки'));
  }, [route.slug, user, sa]);

  // Брендинг: PWA-манифест, title, theme-color и --accent под цвет бизнеса.
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const root = document.documentElement;
    if (route.slug && tenant) {
      if (link) link.setAttribute('href', sa.tenants.manifestUrl(route.slug));
      document.title = tenant.name;
      const color = tenant.color || '#2563eb';
      if (themeMeta) themeMeta.setAttribute('content', color);
      root.style.setProperty('--accent', color);
      root.style.setProperty('--accent-soft', softColor(color, 0.10));
    } else {
      if (link) link.setAttribute('href', '/manifest.webmanifest');
      document.title = 'Start-Apps';
      if (themeMeta) themeMeta.setAttribute('content', '#fafaf7');
      root.style.setProperty('--accent', '#2563eb');
      root.style.setProperty('--accent-soft', softColor('#2563eb', 0.10));
    }
  }, [route.slug, tenant, sa]);

  function openTenant(slug) {
    window.history.pushState({}, '', `/app/${slug}`);
    setRoute({ slug, mode: 'view' });
  }
  function editTenant(slug) {
    window.history.pushState({}, '', `/app/${slug}/edit`);
    setRoute({ slug, mode: 'edit' });
  }
  function goHome() {
    window.history.pushState({}, '', '/');
    setRoute({ slug: null, mode: 'home' });
  }
  function logout() {
    sa.auth.logout();
    setUser(null);
  }

  const scopedSa = useMemo(() => (route.slug ? sa.withTenant(route.slug) : sa), [sa, route.slug]);
  const shareUrl = route.slug ? `${window.location.origin}/app/${route.slug}` : null;
  const isOwner = !!(user && tenant && tenant.owner_login === user.login);

  if (!ready) return <div className="sa-container"><p className="sa-muted">Загрузка…</p></div>;

  return (
    <div>
      <IosInstallHint />
      <header style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={goHome} style={brandBtn}>
            <span style={brandDot} />
            <span style={{ fontWeight: 600 }}>Start-Apps</span>
          </button>
          {tenant && (
            <>
              <span style={crumb}>/</span>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{tenant.name}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tenant && isOwner && route.mode === 'view' && (
            <button onClick={() => editTenant(route.slug)} style={editBtn}>✏ редактировать</button>
          )}
          {tenant && isOwner && route.mode === 'edit' && (
            <button onClick={() => openTenant(route.slug)} style={editBtn}>👁 просмотр</button>
          )}
          {tenant && user && route.mode === 'view' && <ShareButton title={tenant.name} url={shareUrl} />}
          {user ? (
            <>
              <span className="sa-muted" style={{ fontSize: 14 }}>{user.login}</span>
              <button onClick={logout} style={logoutBtn} title="выйти">↪</button>
            </>
          ) : (
            <span className="sa-subtle" style={{ fontSize: 14 }}>гость</span>
          )}
          <InstallButton />
        </div>
      </header>

      <main className="sa-container sa-appear">
        {!user ? (
          <>
            {route.slug && (
              <div style={hint}>
                Это страница бизнеса <code>/{route.slug}</code>. Зарегистрируйся или войди — твои данные привяжутся к этому бизнесу.
              </div>
            )}
            <AuthForm sa={sa} onAuth={setUser} />
          </>
        ) : route.slug ? (
          tenantError ? (
            <p className="sa-muted">
              {tenantError}. <button onClick={goHome} style={linkBtn}>← к моим бизнесам</button>
            </p>
          ) : tenant ? (
            route.mode === 'edit' && isOwner
              ? <AppBuilder sa={scopedSa} tenant={tenant} onClose={() => openTenant(route.slug)} />
              : <AppRuntime sa={scopedSa} tenant={tenant} isOwner={isOwner} />
          ) : (
            <p className="sa-muted">загрузка бизнеса…</p>
          )
        ) : (
          <MyTenants sa={sa} onOpen={openTenant} onEdit={editTenant} user={user} />
        )}
      </main>
    </div>
  );
}

const hdr = {
  position: 'sticky', top: 0, zIndex: 50,
  padding: '12px 20px',
  background: 'rgba(250, 250, 247, 0.85)',
  backdropFilter: 'saturate(180%) blur(10px)',
  borderBottom: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: 12, flexWrap: 'wrap',
};
const brandBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '4px 6px', borderRadius: 8, cursor: 'pointer',
  color: 'var(--text)', background: 'transparent',
};
const brandDot = {
  width: 18, height: 18, borderRadius: 5,
  background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 50%, white))',
  boxShadow: 'var(--shadow-sm)',
};
const crumb = { color: 'var(--text-subtle)' };
const editBtn = {
  padding: '6px 12px', borderRadius: 8,
  background: 'transparent', color: 'var(--accent)',
  border: '1px solid var(--border-strong)', fontSize: 13, fontWeight: 500,
};
const logoutBtn = {
  width: 32, height: 32, borderRadius: 8, fontSize: 16,
  color: 'var(--text-muted)', background: 'transparent',
  border: '1px solid var(--border)',
};
const linkBtn = {
  color: 'var(--accent)', background: 'transparent', border: 0,
  cursor: 'pointer', textDecoration: 'underline', font: 'inherit',
};
const hint = {
  background: 'var(--accent-soft)', padding: '12px 16px',
  borderRadius: 10, marginBottom: 16, fontSize: 14,
  border: '1px solid var(--border)',
};
