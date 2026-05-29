// Пресеты приложений = метаданные template_id, которые выбирает владелец
// при создании бизнеса. Состав блоков задаётся бэкендом (config_schema.PRESETS).
// Здесь — только то что нужно UI: имя, иконка, описание.

export const PRESETS = [
  {
    id: 'barbershop',
    name: 'Барбершоп / Салон',
    tagline: 'Запись, услуги, AI-ассистент',
    icon: '✂️',
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
