import React, { useMemo, useState } from 'react';
import { ServiceCard, SectionHeader, CategoryChips } from '../design/index.js';
import { ui } from './ui.js';

// Список услуг как WB-витрина: чипы-категории (по длительности), сетка карточек.
// Категории генерим из самих услуг — без полей в config (не меняем контракт).
export function Services({ settings, data }) {
  const services = data?.services || [];
  const categories = useMemo(() => {
    const tags = [{ id: 'all', label: 'Все' }];
    if (services.some((s) => s.duration && s.duration <= 30)) tags.push({ id: 'fast', label: 'До 30 мин' });
    if (services.some((s) => s.duration && s.duration > 30)) tags.push({ id: 'long', label: 'Больше 30 мин' });
    return tags;
  }, [services]);
  const [cat, setCat] = useState('all');

  const filtered = services.filter((s) => {
    if (cat === 'fast') return s.duration && s.duration <= 30;
    if (cat === 'long') return s.duration && s.duration > 30;
    return true;
  });

  return (
    <div style={ui.section}>
      <SectionHeader
        title={settings?.title || 'Услуги'}
        subtitle={services.length ? `${services.length} ${plural(services.length, ['услуга', 'услуги', 'услуг'])}` : null}
      />
      {services.length === 0 ? (
        <p className="sa-muted">Услуги пока не настроены.</p>
      ) : (
        <>
          {categories.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <CategoryChips items={categories} active={cat} onSelect={setCat} />
            </div>
          )}
          <div style={grid}>
            {filtered.map((s, i) => (
              <ServiceCard key={i} service={s} cta="Записаться"
                onPick={() => scrollToBooking()} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function scrollToBooking() {
  // Если в приложении есть блок booking — скроллим к нему.
  const el = document.querySelector('[id^="block-"][id*="booking"]');
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function plural(n, [one, few, many]) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if ([2, 3, 4].includes(n10) && ![12, 13, 14].includes(n100)) return few;
  return many;
}

export function ServicesEditor({ settings, onChange }) {
  return (
    <div>
      <label style={ui.lbl}>Заголовок раздела</label>
      <input value={settings?.title || ''}
             onChange={(e) => onChange({ ...settings, title: e.target.value })}
             placeholder="Услуги" />
    </div>
  );
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
};
