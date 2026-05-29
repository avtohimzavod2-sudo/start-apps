// Стилевые токены и общие хелперы блоков. Светлая премиум-палитра.
// CSS-переменные (см. index.css) — единый источник правды для цветов.

const t = (n) => `var(--${n})`;

export const ui = {
  // Карточка/секция
  section: { marginBottom: 28 },
  h2: { marginTop: 0, marginBottom: 12 },
  muted: { color: t('text-muted') },

  // Строки/карточки
  card: {
    background: t('surface'), border: `1px solid ${t('border')}`,
    borderRadius: t('radius'), padding: 20, boxShadow: t('shadow-sm'),
  },
  row: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
    alignItems: 'center', padding: '12px 14px',
    background: t('surface'), border: `1px solid ${t('border')}`,
    borderRadius: t('radius-sm'),
  },

  // Кнопки
  primary: {
    padding: '12px 18px', borderRadius: t('radius-sm'),
    background: t('accent'), color: t('accent-text'),
    fontWeight: 600, fontSize: 14, lineHeight: 1,
    transition: 'transform 80ms ease, filter 120ms ease',
  },
  secondary: {
    padding: '10px 16px', borderRadius: t('radius-sm'),
    background: t('surface'), color: t('accent'),
    border: `1px solid ${t('border-strong')}`,
    fontWeight: 500, fontSize: 14,
  },
  ghost: {
    padding: '8px 12px', borderRadius: t('radius-sm'),
    background: 'transparent', color: t('text-muted'),
    border: `1px solid ${t('border')}`,
    fontSize: 13,
  },
  danger: {
    padding: '8px 14px', borderRadius: t('radius-sm'),
    background: 'transparent', color: t('danger'),
    border: `1px solid ${t('border')}`,
    fontSize: 13,
  },

  // Формы
  input: {
    padding: '10px 12px', borderRadius: t('radius-sm'),
    border: `1px solid ${t('border')}`,
    background: t('surface'), color: t('text'),
    fontSize: 15, width: '100%', boxSizing: 'border-box',
  },
  lbl: {
    display: 'block', fontSize: 13, color: t('text-muted'),
    marginTop: 10, marginBottom: 6, fontWeight: 500,
  },

  // Слоты времени / даты / выбор
  pill: (active) => ({
    padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
    border: `1px solid ${active ? t('accent') : t('border-strong')}`,
    background: active ? t('accent') : t('surface'),
    color: active ? t('accent-text') : t('text'),
    transition: 'all 120ms ease',
  }),
  slot: (active, isTaken) => ({
    padding: '10px 12px', borderRadius: t('radius-sm'),
    cursor: isTaken ? 'not-allowed' : 'pointer',
    border: `1px solid ${active ? t('accent') : t('border')}`,
    background: active ? t('accent') : isTaken ? t('surface-alt') : t('surface'),
    color: active ? t('accent-text') : isTaken ? t('text-subtle') : t('text'),
    fontSize: 13, fontWeight: 500,
    textDecoration: isTaken ? 'line-through' : 'none',
  }),

  // Карточка-выбор (услуга и т.п.)
  pickRow: (active) => ({
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14,
    alignItems: 'center', padding: '14px 16px',
    borderRadius: t('radius'),
    background: active ? `var(--accent-soft)` : t('surface'),
    border: `1px solid ${active ? t('accent') : t('border')}`,
    color: t('text'), cursor: 'pointer', textAlign: 'left',
    transition: 'all 120ms ease',
  }),

  // Чат-бабл
  bubble: (role) => ({
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? t('accent') : t('surface-alt'),
    color: role === 'user' ? t('accent-text') : t('text'),
    padding: '10px 14px', borderRadius: 14, maxWidth: '85%',
    whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.4,
    border: role === 'user' ? 'none' : `1px solid ${t('border')}`,
  }),
};

export function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeStatusBishkek(scheduleObj) {
  if (!scheduleObj || typeof scheduleObj !== 'object') return { open: false, hours: '' };
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bishkek',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const wk = parts.find((p) => p.type === 'weekday')?.value || '';
  const hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const cur = hh * 60 + mm;
  const isSun = wk === 'Sun';
  const todayStr = isSun ? scheduleObj.sun : scheduleObj.mon_sat;
  if (!todayStr || todayStr === 'closed') return { open: false, hours: scheduleObj.mon_sat || '' };
  const m = String(todayStr).match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return { open: false, hours: todayStr };
  const from = Number(m[1]) * 60 + Number(m[2]);
  const to = Number(m[3]) * 60 + Number(m[4]);
  return { open: cur >= from && cur < to, hours: todayStr };
}

export function generateTimes(scheduleObj) {
  const todayStr = scheduleObj?.mon_sat || '10:00-20:00';
  const slot = Number(scheduleObj?.slot_min || 30);
  const m = String(todayStr).match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return [];
  const from = Number(m[1]) * 60 + Number(m[2]);
  const to = Number(m[3]) * 60 + Number(m[4]);
  const out = [];
  for (let t = from; t + slot <= to; t += slot) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

// Форматирует дату YYYY-MM-DD как "29 мая, чт"
export function prettyDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
  } catch { return iso; }
}
