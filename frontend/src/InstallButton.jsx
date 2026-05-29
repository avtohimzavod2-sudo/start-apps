import React, { useEffect, useState } from 'react';

// Универсальная кнопка установки PWA.
// Стратегия по платформам:
//  - Chrome/Edge/Samsung Chrome (Android, desktop): ловим `beforeinstallprompt`,
//    кнопка вызывает системный prompt — установка в один тап.
//  - iOS Safari: события нет, prompt API закрыт. Показываем кнопку с инструкцией
//    «Поделиться → На экран Домой».
//  - Samsung Internet, Firefox Android и пр. без beforeinstallprompt: показываем
//    кнопку с короткой инструкцией про меню «Добавить страницу к → Главный экран».
//  - In-app webview (Telegram, WhatsApp): просим открыть в системном браузере.
//  - Уже установлено (standalone): кнопка скрыта.

function detectPlatform() {
  const ua = navigator.userAgent;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (standalone) return 'installed';

  const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  if (isIOS) return 'ios';

  // распространённые in-app webview
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

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHint('Установлено — найди иконку «Start-Apps» на рабочем столе.');
    };
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
    if (platform === 'ios') {
      setHint('Safari → кнопка «Поделиться» снизу → «На экран „Домой"».');
      return;
    }
    if (platform === 'samsung') {
      setHint('Меню (☰ или ⋮) → «Добавить страницу к» → «Главный экран».');
      return;
    }
    if (platform === 'firefox-android') {
      setHint('Меню (⋮) → «Установить» / «Add to Home screen».');
      return;
    }
    if (platform === 'webview') {
      setHint('Открой эту ссылку в Chrome или Safari — внутри мессенджера установка недоступна.');
      return;
    }
    setHint('Меню браузера → «Установить приложение» или «Добавить на главный экран».');
  }

  const label = deferred ? 'Установить' : 'Поставить иконкой';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={onClick}
        style={{
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px solid #6cf',
          background: deferred ? '#6cf' : 'transparent',
          color: deferred ? '#001' : '#6cf',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ⬇ {label}
      </button>
      {hint && (
        <small style={{ maxWidth: 260, textAlign: 'right', opacity: 0.75, lineHeight: 1.35 }}>
          {hint}
        </small>
      )}
    </div>
  );
}
