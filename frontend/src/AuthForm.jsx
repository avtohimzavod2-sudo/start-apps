import React, { useState } from 'react';

export default function AuthForm({ sa, onAuth }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(kind) {
    if (!login.trim() || !password) {
      setError('Логин и пароль обязательны');
      return;
    }
    setBusy(true); setError(null);
    try {
      await sa.auth[kind](login.trim(), password);
      onAuth(await sa.auth.me());
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes('409')) setError('Такой логин уже занят');
      else if (msg.includes('401')) setError('Неверный логин или пароль');
      else setError(msg.replace(/^sa:\s*/, ''));
    } finally { setBusy(false); }
  }

  return (
    <div style={wrap}>
      <div style={logo}>
        <div style={logoDot} />
      </div>
      <h1 style={{ marginBottom: 6, textAlign: 'center' }}>Добро пожаловать</h1>
      <p className="sa-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
        Войди или зарегистрируйся — это бесплатно.
      </p>

      <div style={card}>
        <label style={lbl}>Логин</label>
        <input value={login} onChange={(e) => setLogin(e.target.value)}
               autoComplete="username" placeholder="например, almaz" />

        <label style={lbl}>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
               autoComplete="current-password" placeholder="минимум 6 символов" />

        {error && <div style={err}>⚠ {error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => submit('login')} disabled={busy} style={btnPrimary}>
            {busy ? 'Минуту…' : 'Войти'}
          </button>
          <button onClick={() => submit('register')} disabled={busy} style={btnSecondary}>
            Регистрация
          </button>
        </div>
      </div>
    </div>
  );
}

const wrap = { maxWidth: 380, margin: '40px auto' };
const logo = {
  display: 'flex', justifyContent: 'center', marginBottom: 24,
};
const logoDot = {
  width: 56, height: 56, borderRadius: 14,
  background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 50%, white))',
  boxShadow: 'var(--shadow)',
};
const card = {
  background: 'var(--surface)', border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)', padding: 24,
  boxShadow: 'var(--shadow)',
};
const lbl = {
  display: 'block', fontSize: 13, color: 'var(--text-muted)',
  marginTop: 12, marginBottom: 6, fontWeight: 500,
};
const err = {
  color: 'var(--danger)', fontSize: 14, marginTop: 12,
  padding: '8px 12px', background: 'rgba(220,38,38,0.06)',
  borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
};
const btnPrimary = {
  flex: 1, padding: '12px 16px', borderRadius: 10,
  background: 'var(--accent)', color: 'var(--accent-text)',
  fontWeight: 600, fontSize: 15,
};
const btnSecondary = {
  flex: 1, padding: '12px 16px', borderRadius: 10,
  background: 'var(--surface)', color: 'var(--accent)',
  border: '1px solid var(--line-strong)', fontWeight: 500, fontSize: 15,
};
