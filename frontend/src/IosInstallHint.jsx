import React, { useEffect, useState } from 'react';

const FLAG = '__sa_ios_hint_dismissed__';

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  return isIos && isSafari && !isStandalone;
}

export default function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(FLAG)) return;
    if (!isIosSafari()) return;
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() { localStorage.setItem(FLAG, '1'); setShow(false); }

  if (!show) return null;

  return (
    <div onClick={dismiss} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={iconBig}>📱</div>
        <h3 style={{ marginBottom: 8 }}>Поставить на главный экран</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
          Запускай как обычное приложение — без браузера.
        </p>
        <ol style={{ padding: 0, listStyle: 'none', margin: 0 }}>
          <li style={step}><span style={num}>1</span><span>Нажми <span style={iconBox}>⬆️</span> внизу экрана</span></li>
          <li style={step}><span style={num}>2</span><span>Выбери <b>«На экран Домой»</b></span></li>
          <li style={step}><span style={num}>3</span><span>Нажми <b>«Добавить»</b></span></li>
        </ol>
        <button onClick={dismiss} style={btn}>Понятно</button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,15,16,0.45)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  zIndex: 9999, padding: 16,
};
const card = {
  background: 'var(--surface)', borderRadius: 16, padding: 24,
  maxWidth: 420, width: '100%', textAlign: 'center',
  boxShadow: 'var(--shadow-lg)',
};
const iconBig = { fontSize: 40, marginBottom: 12 };
const step = {
  display: 'flex', alignItems: 'center', gap: 12,
  textAlign: 'left', padding: '10px 0', fontSize: 15,
};
const num = {
  width: 26, height: 26, borderRadius: '50%',
  background: 'var(--accent)', color: 'var(--accent-text)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, flexShrink: 0, fontSize: 13,
};
const iconBox = {
  display: 'inline-block', padding: '1px 6px', borderRadius: 4,
  background: 'var(--surface-alt)', border: '1px solid var(--border)',
};
const btn = {
  marginTop: 20, padding: '12px 24px', borderRadius: 10,
  background: 'var(--accent)', color: 'var(--accent-text)',
  fontWeight: 600, width: '100%',
};
