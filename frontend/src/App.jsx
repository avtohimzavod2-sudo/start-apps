import React, { useEffect, useMemo, useState } from 'react';
import InstallButton from './InstallButton.jsx';
import ShareButton from './ShareButton.jsx';
import AuthForm from './AuthForm.jsx';
import MyTenants from './MyTenants.jsx';
import MoodJournal from '@templates/mood-journal/index.jsx';

// URL модель:
//   /                    — дашборд владельца (список бизнесов + создание)
//   /app/<slug>          — клиентское приложение бизнеса <slug>
// Каждый бизнес — изолированное пространство данных. Клиенты регистрируются
// один раз на платформе, но их данные привязаны к конкретному бизнесу.

function slugFromUrl() {
  const m = window.location.pathname.match(/^\/app\/([a-z0-9-]+)\/?$/i);
  return m ? m[1].toLowerCase() : null;
}

export default function App({ sa }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [slug, setSlug] = useState(slugFromUrl());
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
    const onPop = () => setSlug(slugFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Подгружаем инфо о тенанте когда меняется slug или появляется юзер.
  useEffect(() => {
    if (!slug || !user) { setTenant(null); setTenantError(null); return; }
    setTenantError(null);
    sa.tenants.get(slug)
      .then(setTenant)
      .catch((e) => setTenantError(String(e).includes('404') ? 'Бизнес не найден' : 'Ошибка загрузки'));
  }, [slug, user, sa]);

  // Подмена PWA-манифеста и theme-color под открытый бизнес.
  // Установленная иконка получит имя/цвет/эмодзи конкретного tenant'а.
  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (slug && tenant && link) {
      link.setAttribute('href', sa.tenants.manifestUrl(slug));
      document.title = tenant.name;
      if (themeMeta) themeMeta.setAttribute('content', tenant.color || '#0a0a14');
    } else if (link) {
      link.setAttribute('href', '/manifest.webmanifest');
      document.title = 'Start-Apps';
      if (themeMeta) themeMeta.setAttribute('content', '#0a0a14');
    }
  }, [slug, tenant, sa]);

  function openTenant(s) {
    window.history.pushState({}, '', `/app/${s}`);
    setSlug(s);
  }

  function goHome() {
    window.history.pushState({}, '', '/');
    setSlug(null);
  }

  function logout() {
    sa.auth.logout();
    setUser(null);
  }

  const scopedSa = useMemo(() => (slug ? sa.withTenant(slug) : sa), [sa, slug]);
  const shareUrl = slug ? `${window.location.origin}/app/${slug}` : null;

  if (!ready) return <div style={{ padding: 24 }}>Загрузка…</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#0a0a14', color: '#fff' }}>
      <header style={hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ cursor: 'pointer' }} onClick={goHome}>Start-Apps</strong>
          {tenant && (
            <>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{tenant.name}</span>
              {user && tenant.owner_login === user.login && (
                <ShareButton title={tenant.name} url={shareUrl} />
              )}
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
            {slug && (
              <div style={hint}>
                Это страница бизнеса <code>/{slug}</code>. Зарегистрируйся или войди — твои данные привяжутся к этому бизнесу.
              </div>
            )}
            <AuthForm sa={sa} onAuth={setUser} />
          </>
        ) : slug ? (
          tenantError ? (
            <p style={{ opacity: 0.6 }}>
              {tenantError}. <button onClick={goHome} style={linkBtn}>← к моим бизнесам</button>
            </p>
          ) : tenant ? (
            <MoodJournal sa={scopedSa} />
          ) : (
            <p style={{ opacity: 0.6 }}>загрузка бизнеса…</p>
          )
        ) : (
          <MyTenants sa={sa} onOpen={openTenant} />
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
const linkBtn = {
  color: '#6cf', background: 'transparent', border: 0,
  cursor: 'pointer', textDecoration: 'underline',
};
const hint = {
  background: '#1a1a2a', padding: 12, borderRadius: 8,
  marginBottom: 16, fontSize: 14, opacity: 0.9,
};
