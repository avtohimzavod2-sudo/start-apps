// Реестр шаблонов платформы.
// Чтобы добавить новый шаблон: положи его в templates/<id>/, добавь в templates.meta.js,
// импортируй компонент здесь.

import AtmospheraAI from '@templates/atmosphera-ai/index.jsx';
import HabitsTracker from '@templates/habits-tracker/index.jsx';
import Pomodoro from '@templates/pomodoro/index.jsx';
import { TEMPLATES_META } from './templates.meta.js';

const COMPONENTS = {
  'atmosphera-ai': AtmospheraAI,
  'habits-tracker': HabitsTracker,
  'pomodoro': Pomodoro,
};

export const TEMPLATES = TEMPLATES_META.map((m) => ({
  ...m,
  component: COMPONENTS[m.id],
}));

export function byId(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
