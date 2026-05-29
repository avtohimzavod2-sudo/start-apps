// Реестр шаблонов платформы. id должен совпадать с ALLOWED_TEMPLATES в бэке.
import MoodJournal from '@templates/mood-journal/index.jsx';
import Barbershop from '@templates/barbershop/index.jsx';

export const TEMPLATES = [
  {
    id: 'barbershop',
    name: 'Барбершоп',
    tagline: 'Запись + AI-ассистент для клиентов',
    icon: '✂️',
    component: Barbershop,
    // Дефолтные данные при создании tenant'а этого типа.
    defaultConfig: {
      master_name: '',
      services: [
        { name: 'Стрижка', price: 400, duration: 30 },
        { name: 'Борода', price: 200, duration: 20 },
        { name: 'Комплекс', price: 550, duration: 45 },
      ],
      schedule: 'Пн-Сб 10:00-20:00',
      address: '',
    },
  },
  {
    id: 'mood-journal',
    name: 'Дневник настроения',
    tagline: 'Заметки и карта настроения',
    icon: '✨',
    component: MoodJournal,
    defaultConfig: {},
  },
];

export function byId(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
