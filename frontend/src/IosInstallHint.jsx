import React, { useEffect, useState } from 'react';

// На iOS Safari нет beforeinstallprompt. Показываем overlay один раз
// с инструкцией добавить иконку на главный экран вручную.
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

  function dismiss() {
    localStorage.setItem(FLAG, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div onClick={dismiss} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
        <h3 style={{ margin: '0 0 8px 0' }}>Поставить на экран Домой</h3>
        <ol style={{ padding: 0, listStyle: 'none', margin: 0 }}>
          <li style={step}>
            <span style={num}>1</span>
            <span>Нажми <span style={iconBox}>⬆️</span> внизу экрана</span>
          </li>
          <li style={step}>
            <span style={num}>2</span>
            <span>Выбери <b>«На экран Домой»</b></span>
          </li>
          <li style={step}>
            <span style={num}>3</span>
            <span>Нажми <b>«Добавить»</b></span>
          </li>
        </ol>
        <button onClick={dismiss} style={btn}>Понятно</button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  zIndex: 9999, padding: 16,
};
const card = {
  background: '#111', borderRadius: 16, padding: 20, maxWidth: 420, width: '100%',
  color: '#fff', textAlign: 'center', border: '1px solid #222',
};
const step = {
  display: 'flex', alignItems: 'center', gap: 12,
  textAlign: 'left', padding: '8px 0',
};
const num = {
  width: 24, height: 24, borderRadius: 12, background: '#6cf', color: '#001',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, flexShrink: 0, fontSize: 13,
};
const iconBox = {
  display: 'inline-block', padding: '0 6px', borderRadius: 4,
  background: '#222', margin: '0 2px',
};
const btn = {
  marginTop: 16, padding: '10px 24px', borderRadius: 8,
  background: '#6cf', border: 0, cursor: 'pointer',
  fontWeight: 600, color: '#001', width: '100%',
};
