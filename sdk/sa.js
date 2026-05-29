// Start-Apps SDK — единый объект `sa` с интерфейсом розеток.
// Шаблоны мини-приложений работают только через `sa`, не зная,
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

  async function call(path, { method = 'GET', body, extraHeaders } = {}) {
    const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
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

  function makeStorage(tenantHeaders) {
    return {
      async get(key) {
        try {
          const r = await call(`/sa/storage/get/${encodeURIComponent(key)}`, { extraHeaders: tenantHeaders });
          return r.value;
        } catch (e) {
          if (String(e).includes('404')) return null;
          throw e;
        }
      },
      async set(key, value) {
        await call('/sa/storage/set', { method: 'POST', body: { key, value }, extraHeaders: tenantHeaders });
      },
      async del(key) {
        await call(`/sa/storage/del/${encodeURIComponent(key)}`, { method: 'DELETE', extraHeaders: tenantHeaders });
      },
      async keys() {
        const r = await call('/sa/storage/keys', { extraHeaders: tenantHeaders });
        return r.keys;
      },
    };
  }

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

  const tenants = {
    async list() {
      const r = await call('/sa/tenants');
      return r.tenants;
    },
    async create({ slug, name, color, icon_emoji, template_id, config }) {
      return call('/sa/tenants', { method: 'POST', body: { slug, name, color, icon_emoji, template_id, config } });
    },
    async update(slug, patch) {
      return call(`/sa/tenants/${encodeURIComponent(slug)}`, { method: 'PATCH', body: patch });
    },
    async get(slug) {
      return call(`/sa/tenants/${encodeURIComponent(slug)}`);
    },
    async getConfig(slug) {
      const r = await call(`/sa/tenants/${encodeURIComponent(slug)}/config`);
      return r.config;
    },
    async setConfig(slug, config) {
      const r = await call(`/sa/tenants/${encodeURIComponent(slug)}/config`, { method: 'PATCH', body: { config } });
      return r.config;
    },
    async appointments(slug) {
      const r = await call(`/sa/tenants/${encodeURIComponent(slug)}/appointments`);
      return r.appointments;
    },
    manifestUrl(slug) {
      return `${api}/sa/tenants/${encodeURIComponent(slug)}/manifest.webmanifest`;
    },
  };

  function makeAi(tenantHeaders) {
    return {
      async chat(messages) {
        const r = await call('/sa/ai/chat', {
          method: 'POST',
          body: { messages },
          extraHeaders: tenantHeaders,
        });
        return r.reply;
      },
    };
  }

  function makeBookings(slug) {
    const base = `/sa/tenants/${encodeURIComponent(slug)}/bookings`;
    return {
      async create({ service, price, duration, date, time }) {
        return call(base, {
          method: 'POST',
          body: { service, price, duration, date, time },
        });
      },
      async taken(date) {
        const r = await call(`${base}/taken?date=${encodeURIComponent(date)}`);
        return r.taken;
      },
      async mine() {
        const r = await call(`${base}/mine`);
        return r.bookings;
      },
    };
  }

  function withTenant(slug) {
    if (!slug) throw new Error('sa.withTenant: slug required');
    const headers = { 'X-Tenant-Slug': slug };
    return {
      contract: 'v1',
      tenant: slug,
      storage: makeStorage(headers),
      ai: makeAi(headers),
      bookings: makeBookings(slug),
      auth,
      tenants,
    };
  }

  return {
    contract: 'v1',
    api,
    tenant: null,
    storage: makeStorage(),
    auth,
    tenants,
    withTenant,
  };
}

export default createSa;
