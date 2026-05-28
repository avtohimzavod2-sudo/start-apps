# Start-Apps

Платформа быстрого запуска мини-приложений. Архитектура «розеток»: backend предоставляет
типизированные интерфейсы (storage, auth), frontend подключается к ним через единый JS-SDK
объект `sa`. Шаблоны — это PWA, которые получают доступ к платформе через `window.sa`.

## Структура

```
start-apps/
├── backend/          # FastAPI: розетки sa.storage и sa.auth
├── frontend/         # React + Vite: оболочка с PWA-оживителем и инжектом sa
├── sdk/              # sa.js — единый интерфейс розеток для шаблонов
├── contracts/        # JSON-схема контракта v1
├── templates/        # Шаблоны мини-приложений
│   └── atmosphera-ai/
└── docker-compose.yml
```

## Запуск

```
docker compose up --build
```

- backend → http://localhost:8000 (docs: `/docs`)
- frontend → http://localhost:5173
