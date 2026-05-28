import React, { useEffect, useMemo, useState } from 'react';

// Шаблон работает только через sa — про бэкенд ничего не знает.
// Структура данных: { habits: [{ id, name, ticks: { 'YYYY-MM-DD': true } }] }

const today = () => new Date().toISOString().slice(0, 10);

function weekDays(weekOffset = 0) {
  const base = new Date();
  base.setDate(base.getDate() - base.getDay() + 1 + weekOffset * 7); // понедельник
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      key: d.toISOString().slice(0, 10),
      label: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i],
      day: d.getDate(),
      isToday: d.toISOString().slice(0, 10) === today(),
    };
  });
}

export default function HabitsTracker({ sa }) {
  const [habits, setHabits] = useState([]);
  const [draft, setDraft] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sa.storage.get('habits').then((v) => {
      setHabits(Array.isArray(v) ? v : []);
      setLoading(false);
    });
  }, [sa]);

  const days = useMemo(() => weekDays(weekOffset), [weekOffset]);

  async function save(next) {
    setHabits(next);
    await sa.storage.set('habits', next);
  }

  async function add() {
    const name = draft.trim();
    if (!name) return;
    setDraft('');
    await save([...habits, { id: Date.now(), name, ticks: {} }]);
  }

  async function toggleTick(habitId, dayKey) {
    const next = habits.map((h) => {
      if (h.id !== habitId) return h;
      const ticks = { ...h.ticks };
      if (ticks[dayKey]) delete ticks[dayKey];
      else ticks[dayKey] = true;
      return { ...h, ticks };
    });
    await save(next);
  }

  async function remove(habitId) {
    await save(habits.filter((h) => h.id !== habitId));
  }

  if (loading) return <div style={{ opacity: 0.6 }}>Загрузка привычек…</div>;

  const streak = (h) => {
    let n = 0;
    const d = new Date();
    for (;;) {
      const k = d.toISOString().slice(0, 10);
      if (!h.ticks[k]) break;
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Habits Tracker</h1>
      <p style={{ opacity: 0.7 }}>Каждый день — галочка. Через <code>sa.storage</code>, ключ <code>habits</code>.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="новая привычка (бег, чтение, вода…)"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
        />
        <button onClick={add} style={{ padding: '10px 16px', borderRadius: 8, background: '#6cf', border: 0, cursor: 'pointer', fontWeight: 600 }}>+</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => setWeekOffset((w) => w - 1)} style={navBtn}>← неделя</button>
        <span style={{ opacity: 0.6, fontSize: 14 }}>
          {weekOffset === 0 ? 'эта неделя' : weekOffset > 0 ? `+${weekOffset} нед` : `${weekOffset} нед`}
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)} style={navBtn}>неделя →</button>
      </div>

      {habits.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: 40 }}>Пока пусто. Добавь первую привычку выше.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {habits.map((h) => (
            <div key={h.id} style={{ background: '#111', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{h.name}</strong>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ opacity: 0.6, fontSize: 13 }}>серия: {streak(h)}🔥</span>
                  <button onClick={() => remove(h.id)} style={{ background: 'transparent', color: '#f66', border: 0, cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {days.map((d) => {
                  const on = !!h.ticks[d.key];
                  return (
                    <button
                      key={d.key}
                      onClick={() => toggleTick(h.id, d.key)}
                      style={{
                        padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                        border: d.isToday ? '2px solid #6cf' : '1px solid #333',
                        background: on ? '#6cf' : '#0a0a14',
                        color: on ? '#001' : '#fff',
                        fontWeight: on ? 600 : 400,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <small style={{ fontSize: 10, opacity: 0.7 }}>{d.label}</small>
                      <span>{on ? '✓' : d.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const navBtn = {
  background: 'transparent', color: '#6cf', border: '1px solid #6cf',
  padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
};
