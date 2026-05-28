// Start-Apps SDK — единый объект `sa` с интерфейсом розеток.
// Шаблоны мини-приложений работают только через `window.sa`, не зная,
// чем именно проброшены розетки (HTTP backend, mock, embedded, …).
//
// Контракт: contracts/v1.schema.json

const TOKEN_KEY = '__sa_token__';

export function createSa({ api, fetchImpl = fetch } = {}) {
  if (!api) throw new Error('sa: api base URL is required');

  const getToken = () => globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  const setToken = (t) => {
    if (t) globalThis.localStorage?.setItem(TOKEN_KEY, t);
    else globalThis.localStorage?.removeItem(TOKEN_KEY);
  };

  async function call(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const tok = getToken();
    if (tok) headers.Authorization = `Bearer ${tok}`;
    const res = await fetchImpl(`${api}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`sa: ${res.status} ${text}`);
    }
    return res.status === 204 ? null : res.json();
  }

  const storage = {
    async get(key) {
      try {
        const r = await call(`/sa/storage/get/${encodeURIComponent(key)}`);
        return r.value;
      } catch (e) {
        if (String(e).includes('404')) return null;
        throw e;
      }
    },
    async set(key, value) {
      await call('/sa/storage/set', { method: 'POST', body: { key, value } });
    },
    async del(key) {
      await call(`/sa/storage/del/${encodeURIComponent(key)}`, { method: 'DELETE' });
    },
    async keys() {
      const r = await call('/sa/storage/keys');
      return r.keys;
    },
  };

  const auth = {
    async register(login, password) {
      const r = await call('/sa/auth/register', { method: 'POST', body: { login, password } });
      setToken(r.token);
      return r;
    },
    async login(login, password) {
      const r = await call('/sa/auth/login', { method: 'POST', body: { login, password } });
      setToken(r.token);
      return r;
    },
    async me() {
      return call('/sa/auth/me');
    },
    logout() {
      setToken(null);
    },
    isAuthorized() {
      return Boolean(getToken());
    },
  };

  return { contract: 'v1', storage, auth };
}

export default createSa;
