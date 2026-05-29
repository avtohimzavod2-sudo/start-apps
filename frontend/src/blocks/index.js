// Реестр блоков платформы. Один рантайм — много конфигов.
// Новый блок = новая запись здесь + файл с компонентом и EditorPanel.

import { Services, ServicesEditor } from './Services.jsx';
import { Booking, BookingEditor } from './Booking.jsx';
import { AiAssistant, AiAssistantEditor } from './AiAssistant.jsx';
import { Contacts, ContactsEditor } from './Contacts.jsx';
import { OwnerPanel, OwnerPanelEditor } from './OwnerPanel.jsx';

export const BLOCK_REGISTRY = {
  services: {
    type: 'services',
    label: 'Услуги и цены',
    icon: '💰',
    component: Services,
    EditorPanel: ServicesEditor,
    defaults: { title: 'Наши услуги' },
    reads: ['data.services'],
    writes: [],
    dependsOn: ['data.services'],
    ownerOnly: false,
  },
  booking: {
    type: 'booking',
    label: 'Запись на услугу',
    icon: '📅',
    component: Booking,
    EditorPanel: BookingEditor,
    defaults: { days_ahead: 7 },
    reads: ['data.services', 'data.schedule'],
    writes: ['sa.bookings'],
    dependsOn: ['data.services', 'data.schedule'],
    ownerOnly: false,
  },
  ai_assistant: {
    type: 'ai_assistant',
    label: 'AI-ассистент',
    icon: '💬',
    component: AiAssistant,
    EditorPanel: AiAssistantEditor,
    defaults: { greeting: 'Привет! Помогу записаться или ответить на вопросы.' },
    reads: ['business', 'data'],
    writes: ['sa.storage.ai_chat'],
    dependsOn: [],
    ownerOnly: false,
  },
  contacts: {
    type: 'contacts',
    label: 'Контакты',
    icon: '📍',
    component: Contacts,
    EditorPanel: ContactsEditor,
    defaults: {},
    reads: ['business'],
    writes: [],
    dependsOn: [],
    ownerOnly: false,
  },
  owner_panel: {
    type: 'owner_panel',
    label: 'Управление (владелец)',
    icon: '⚙️',
    component: OwnerPanel,
    EditorPanel: OwnerPanelEditor,
    defaults: {},
    reads: ['sa.tenants.appointments'],
    writes: [],
    dependsOn: [],
    ownerOnly: true,
  },
};

export function blockDef(type) {
  return BLOCK_REGISTRY[type] || null;
}

export function allBlockDefs() {
  return Object.values(BLOCK_REGISTRY);
}

// Проверка зависимостей блока по текущим data/business — для guardrails в конструкторе.
// Возвращает массив строк с описаниями пробелов; пустой массив = всё ок.
export function blockGaps(block, config) {
  const def = blockDef(block.type);
  if (!def) return [`Неизвестный блок: ${block.type}`];
  const gaps = [];
  for (const dep of def.dependsOn || []) {
    const [root, key] = dep.split('.');
    const val = config?.[root]?.[key];
    const empty = val == null
      || (Array.isArray(val) && val.length === 0)
      || (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0);
    if (empty) gaps.push(`${dep} не заполнено`);
  }
  return gaps;
}
