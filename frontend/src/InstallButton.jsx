import React, { useEffect, useState } from 'react';

function detectPlatform() {
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (standalone) return 'installed';
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  if (isIOS) return 'ios';
  if (/FBAN|FBAV|Instagram|Line\/|Twitter|TelegramBot|; wv\)/i.test(ua)) return 'webview';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Firefox/i.test(ua) && /Android/i.test(ua)) return 'firefox-android';
  return 'generic';
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);
  const [platform, setPlatform] = useState('generic');
  const [hint, setHint] = useState(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setDeferred(null); setHint('Готово — ищи иконку на главном экране.'); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (platform === 'installed') return null;

  async function onClick() {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setDeferred(null);
      return;
    }
    if (platform === 'ios')          setHint('Safari → «Поделиться» снизу → «На экран „Домой"».');
    else if (platform === 'samsung') setHint('Меню (☰ или ⋮) → «Добавить страницу к» → «Главный экран».');
    else if (platform === 'firefox-android') setHint('Меню (⋮) → «Установить».');
    else if (platform === 'webview') setHint('Открой ссылку в Chrome или Safari.');
    else setHint('Меню браузера → «Установить приложение».');
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button onClick={onClick} style={deferred ? primary : ghost}>
        ⬇ Установить
      </button>
      {hint && (
        <small style={{ maxWidth: 260, textAlign: 'right', color: 'var(--text-muted)', lineHeight: 1.35 }}>
          {hint}
        </small>
      )}
    </div>
  );
}

const primary = {
  padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
  background: 'var(--accent)', color: 'var(--accent-text)',
};
const ghost = {
  padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
  background: 'var(--surface)', color: 'var(--accent)',
  border: '1px solid var(--border-strong)',
};
