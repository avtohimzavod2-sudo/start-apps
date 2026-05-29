// Общие стили блоков — чтобы блоки выглядели единообразно
// и не приходилось копипастить css в каждый компонент.

export const ui = {
  section: { marginBottom: 24 },
  h2: { marginTop: 0, marginBottom: 12, fontSize: 20 },
  muted: { opacity: 0.55 },
  row: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
    alignItems: 'center', padding: '10px 12px', background: '#111', borderRadius: 8,
  },
  card: { background: '#111', borderRadius: 12, padding: 16 },
  primary: {
    padding: '10px 16px', borderRadius: 8, background: '#6cf',
    border: 0, cursor: 'pointer', color: '#001', fontWeight: 600, fontSize: 14,
  },
  ghost: {
    padding: '8px 12px', borderRadius: 8, background: 'transparent',
    border: '1px solid #333', cursor: 'pointer', color: '#fff', fontSize: 13,
  },
  danger: {
    padding: '6px 12px', borderRadius: 8, background: 'transparent',
    border: '1px solid #f66', color: '#f66', cursor: 'pointer', fontSize: 13,
  },
  input: {
    padding: 10, borderRadius: 8, border: '1px solid #333',
    background: '#0a0a14', color: '#fff', fontSize: 14, width: '100%', boxSizing: 'border-box',
  },
  lbl: { display: 'block', fontSize: 13, opacity: 0.6, marginTop: 8, marginBottom: 4 },
  pill: (active) => ({
    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${active ? '#6cf' : '#333'}`,
    background: active ? '#6cf' : 'transparent',
    color: active ? '#001' : '#fff', fontSize: 13,
  }),
  slot: (active, isTaken) => ({
    padding: '8px 12px', borderRadius: 8,
    cursor: isTaken ? 'not-allowed' : 'pointer',
    border: `1px solid ${active ? '#6cf' : isTaken ? '#222' : '#333'}`,
    background: active ? '#6cf' : isTaken ? '#1a1a1a' : 'transparent',
    color: active ? '#001' : isTaken ? '#555' : '#fff',
    fontSize: 13,
    textDecoration: isTaken ? 'line-through' : 'none',
  }),
  pickRow: (active) => ({
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
    alignItems: 'center', padding: '10px 12px', borderRadius: 8,
    background: active ? '#1a2a3a' : '#111',
    border: `1px solid ${active ? '#6cf' : '#222'}`,
    color: '#fff', cursor: 'pointer', textAlign: 'left',
  }),
  bubble: (role) => ({
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? '#6cf' : '#222',
    color: role === 'user' ? '#001' : '#fff',
    padding: '8px 12px', borderRadius: 12, maxWidth: '80%',
    whiteSpace: 'pre-wrap', fontSize: 14,
  }),
};

export function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeStatusBishkek(scheduleObj) {
  // schedule = { mon_sat: "HH:MM-HH:MM", sun: "closed"|"HH:MM-HH:MM", slot_min, raw? }
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
