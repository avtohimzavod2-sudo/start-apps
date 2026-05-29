// Тонкие хелперы блоков. Стилей здесь по минимуму — основная палитра
// и компоненты живут в `frontend/src/design/`.

export const ui = {
  section: { marginBottom: 28 },
  lbl: {
    display: 'block', fontSize: 13, color: 'var(--text-muted)',
    marginTop: 10, marginBottom: 6, fontWeight: 500,
  },
  slot: (active, isTaken) => ({
    padding: '10px 12px', borderRadius: 'var(--radius-btn)',
    cursor: isTaken ? 'not-allowed' : 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : isTaken ? 'var(--surface-alt)' : 'var(--surface)',
    color: active ? 'var(--accent-text)' : isTaken ? 'var(--text-faint)' : 'var(--text)',
    fontSize: 13, fontWeight: 500,
    textDecoration: isTaken ? 'line-through' : 'none',
  }),
};

export function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

export function prettyDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
  } catch { return iso; }
}
