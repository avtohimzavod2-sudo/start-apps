import React, { useState } from 'react';

// Простая форма «либо вход, либо регистрация» — обе кнопки рядом,
// один и тот же набор полей. После успеха вызывает onAuth(user).
export default function AuthForm({ sa, onAuth }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(kind) {
    if (!login.trim() || !password) {
      setError('логин и пароль обязательны');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sa.auth[kind](login.trim(), password);
      const user = await sa.auth.me();
      onAuth(user);
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes('409')) setError('такой логин уже занят');
      else if (msg.includes('401')) setError('неверный логин или пароль');
      else setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const input = {
    width: '100%', padding: 10, borderRadius: 8,
    border: '1px solid #333', background: '#111', color: '#fff', boxSizing: 'border-box',
  };
  const btn = (primary) => ({
    flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
    border: primary ? 0 : '1px solid #6cf',
    background: primary ? '#6cf' : 'transparent',
    color: primary ? '#001' : '#6cf', fontWeight: 600,
  });

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 20, background: '#111', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>Войти</h2>
      <p style={{ opacity: 0.6, marginTop: 0 }}>Заметки привяжутся к твоему аккаунту.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input style={input} placeholder="логин" value={login}
               onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        <input style={input} placeholder="пароль" type="password" value={password}
               onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <div style={{ color: '#f66', fontSize: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={btn(true)}  disabled={busy} onClick={() => submit('login')}>Войти</button>
          <button style={btn(false)} disabled={busy} onClick={() => submit('register')}>Регистрация</button>
        </div>
      </div>
    </div>
  );
}
