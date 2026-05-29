import React, { useEffect, useMemo, useState } from 'react';
import InstallButton from './InstallButton.jsx';
import ShareButton from './ShareButton.jsx';
import AuthForm from './AuthForm.jsx';
import MyTenants from './MyTenants.jsx';
import IosInstallHint from './IosInstallHint.jsx';
import AppRuntime from './AppRuntime.jsx';
import AppBuilder from './AppBuilder.jsx';

// URL модель:
//   /                       — дашборд владельца
//   /app/<slug>             — клиентское приложение (рантайм блоков)
//   /app/<slug>/edit        — конструктор владельца

function parseUrl() {
  const m = window.location.pathname.match(/^\/app\/([a-z0-9-]+)(?:\/(edit))?\/?$/i);
  if (!m) return { slug: null, mode: 'home' };
  return { slug: m[1].toLowerCase(), mode: m[2] === 'edit' ? 'edit' : 'view' };
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

  // Подмена PWA-манифеста под открытый бизнес.
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (route.slug && tenant && link) {
      link.setAttribute('href', sa.tenants.manifestUrl(route.slug));
      document.title = tenant.name;
      if (themeMeta) themeMeta.setAttribute('content', tenant.color || '#0a0a14');
    } else if (link) {
      link.setAttribute('href', '/manifest.webmanifest');
      document.title = 'Start-Apps';
      if (themeMeta) themeMeta.setAttribute('content', '#0a0a14');
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

  if (!ready) return <div style={{ padding: 24 }}>Загрузка…</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#0a0a14', color: '#fff' }}>
      <IosInstallHint />
      <header style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ cursor: 'pointer' }} onClick={goHome}>Start-Apps</strong>
          {tenant && (
            <>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{tenant.name}</span>
              {isOwner && route.mode === 'view' && (
                <button onClick={() => editTenant(route.slug)} style={btnLink}>✏ редактировать</button>
              )}
              {isOwner && route.mode === 'edit' && (
                <button onClick={() => openTenant(route.slug)} style={btnLink}>👁 просмотр</button>
              )}
              {user && route.mode === 'view' && <ShareButton title={tenant.name} url={shareUrl} />}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ opacity: 0.7 }}>{user.login}</span>
              <button onClick={logout} style={btnDanger}>выйти</button>
            </>
          ) : (
            <span style={{ opacity: 0.6 }}>гость</span>
          )}
          <InstallButton />
        </div>
      </header>

      <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
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
            <p style={{ opacity: 0.6 }}>
              {tenantError}. <button onClick={goHome} style={linkBtn}>← к моим бизнесам</button>
            </p>
          ) : tenant ? (
            route.mode === 'edit' && isOwner
              ? <AppBuilder sa={scopedSa} tenant={tenant} onClose={() => openTenant(route.slug)} />
              : <AppRuntime sa={scopedSa} tenant={tenant} isOwner={isOwner} />
          ) : (
            <p style={{ opacity: 0.6 }}>загрузка бизнеса…</p>
          )
        ) : (
          <MyTenants sa={sa} onOpen={openTenant} onEdit={editTenant} user={user} />
        )}
      </main>
    </div>
  );
}

const hdr = {
  padding: '12px 20px', borderBottom: '1px solid #222',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: 12, flexWrap: 'wrap',
};
const btnDanger = {
  background: 'transparent', color: '#f66', border: '1px solid #f66',
  padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
};
const btnLink = {
  background: 'transparent', color: '#6cf', border: '1px solid #6cf',
  padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
};
const linkBtn = {
  color: '#6cf', background: 'transparent', border: 0,
  cursor: 'pointer', textDecoration: 'underline',
};
const hint = {
  background: '#1a1a2a', padding: 12, borderRadius: 8,
  marginBottom: 16, fontSize: 14, opacity: 0.9,
};
