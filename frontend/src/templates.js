// Реестр шаблонов платформы.
// Чтобы добавить новый шаблон: положи его в templates/<id>/, импортируй здесь.
// Платформа не лезет внутрь — только показывает их в лаунчере.

import AtmospheraAI from '@templates/atmosphera-ai/index.jsx';
import HabitsTracker from '@templates/habits-tracker/index.jsx';
import Pomodoro from '@templates/pomodoro/index.jsx';

export const TEMPLATES = [
  {
    id: 'atmosphera-ai',
    name: 'Atmosphera AI',
    tagline: 'Заметки о настроении момента',
    icon: '✨',
    component: AtmospheraAI,
  },
  {
    id: 'habits-tracker',
    name: 'Habits Tracker',
    tagline: 'Дневные галочки и серии',
    icon: '✓',
    component: HabitsTracker,
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    tagline: '25/5 таймер с историей',
    icon: '🍅',
    component: Pomodoro,
  },
];

export function byId(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
