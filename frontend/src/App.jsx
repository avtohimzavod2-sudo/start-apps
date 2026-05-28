import React, { useEffect, useState } from 'react';
import InstallButton from './InstallButton.jsx';
import ShareButton from './ShareButton.jsx';
import AuthForm from './AuthForm.jsx';
import Launcher from './Launcher.jsx';
import { byId } from './templates.js';

// URL ↔ openId:
//  - ?app=<id>           прямая ссылка на шаблон
//  - /                   лаунчер
// browser back/forward работает за счёт popstate + pushState

function appFromUrl() {
  return new URLSearchParams(window.location.search).get('app');
}

export default function App({ sa }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [openId, setOpenId] = useState(appFromUrl());

  useEffect(() => {
    (async () => {
      if (sa.auth.isAuthorized()) {
        try { setUser(await sa.auth.me()); } catch { sa.auth.logout(); }
      }
      setReady(true);
    })();
  }, [sa]);

  // browser back/forward — синк URL → state
  useEffect(() => {
    const onPop = () => setOpenId(appFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function openTemplate(id) {
    if (openId === id) return;
    window.history.pushState({}, '', `?app=${encodeURIComponent(id)}`);
    setOpenId(id);
  }

  function closeTemplate() {
    if (window.history.state && window.history.length > 1) {
      window.history.back();
    } else {
      window.history.pushState({}, '', window.location.pathname);
      setOpenId(null);
    }
  }

  function logout() {
    sa.auth.logout();
    setUser(null);
    setOpenId(null);
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (!ready) return <div style={{ padding: 24 }}>Загрузка…</div>;

  const opened = openId ? byId(openId) : null;
  const Template = opened?.component;
  const shareUrl = opened ? `${window.location.origin}/?app=${encodeURIComponent(opened.id)}` : null;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#0a0a14', color: '#fff' }}>
      <header style={{ padding: '12px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong>Start-Apps · contract {sa.contract}</strong>
          {opened && (
            <>
              <button onClick={closeTemplate} style={{ background: 'transparent', color: '#6cf', border: '1px solid #6cf', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                ← к приложениям
              </button>
              {user && <ShareButton title={opened.name} url={shareUrl} />}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span>{user.login}</span>
              <button onClick={logout} style={{ background: 'transparent', color: '#f66', border: '1px solid #f66', padding: '4px 10px', borderRadius: 8, cursor: 'pointer' }}>выйти</button>
            </>
          ) : (
            <span style={{ opacity: 0.6 }}>гость</span>
          )}
          <InstallButton />
        </div>
      </header>
      <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {!user ? (
          <AuthForm sa={sa} onAuth={setUser} />
        ) : Template ? (
          <Template sa={sa} />
        ) : opened ? (
          <p style={{ opacity: 0.6 }}>Шаблон <code>{openId}</code> не найден. <button onClick={closeTemplate} style={{ color: '#6cf', background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline' }}>к приложениям</button></p>
        ) : (
          <Launcher onOpen={openTemplate} />
        )}
      </main>
    </div>
  );
}
