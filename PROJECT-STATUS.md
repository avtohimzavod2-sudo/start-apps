# Start-Apps — Project Status

**Repo:** github.com/avtohimzavod2-sudo/start-apps
**Прод фронт:** https://sa-frontend-djk8.onrender.com
**Прод бэк:** https://sa-backend-yj5r.onrender.com
**Деплой:** Render Blueprint (`render.yaml`) — фронт (Static), бэк (Docker), Postgres (free tier)

---

## ЗАДАЧА 1: MULTI-TENANT ✅

- БД: `tenants(id, slug UNIQUE, name, owner_login, color, icon_emoji, template_id, config, created_at)`, `tenant_kv(tenant_id, user_login, key, value)` — PK тройной
- Storage scoped по (tenant_id, user_login, key) — каждый клиент бизнеса видит только свои данные внутри tenant'а
- Router `/sa/tenants`: POST (create), GET (my list), GET /{slug}, PATCH /{slug} (owner only)
- Storage все запросы требуют header `X-Tenant-Slug`
- SDK: `sa.tenants.{list,create,get,update,getConfig,setConfig,appointments,manifestUrl}`, `sa.withTenant(slug)` → scoped instance
- URL: `/` = дашборд владельца «Мои бизнесы», `/app/<slug>` = клиентское приложение
- Проверено: 2 тенанта (barber-almaz, cafe-romashka), данные изолированы, инкогнито-юзер видит пустое пространство

## ЗАДАЧА 2: PER-TENANT BRANDING ✅

- Tenant: `color` (hex) + `icon_emoji`
- Бэк: GET `/sa/tenants/{slug}/manifest.webmanifest` — генерит JSON-манифест с SVG-data-URI иконкой (квадрат цвета + эмодзи)
- Фронт: при открытии `/app/<slug>` подменяется `<link rel="manifest">` на бэкендовый URL + title + theme-color meta
- Форма создания: палитра из 8 цветов + 12 пресет-эмодзи, live-превью иконки
- Карточки в «Мои бизнесы» показывают цветной бейдж
- ALTER TABLE миграция при старте (каждый ALTER в своей транзакции — Postgres-safe)

## ЗАДАЧА 3: iOS INSTALL HINT ✅

- Компонент `IosInstallHint.jsx`: detect iOS Safari через UA + проверка standalone
- Overlay с 3 шагами (Share → На экран Домой → Добавить)
- Dismiss-флаг в localStorage (`__sa_ios_hint_dismissed__`), показ один раз
- Появляется через 1.5с после загрузки

## ЗАДАЧА 4: BARBERSHOP TEMPLATE + AI ✅

- БД: `Tenant.template_id` (по-умолчанию `mood-journal`, выбор при создании), `Tenant.config` (JSON: услуги, цены, график, мастер, адрес)
- Шаблон `templates/barbershop/index.jsx` — 4 экрана (Главная, Запись, AI-чат, Управление)
  - **Главная:** статус «открыто/закрыто» (вычисляется из графика), список услуг с ценами в сомах, кнопки «Записаться» и «Спросить AI», список моих записей
  - **Запись:** услуга → дата (7 дней) → время (10:00–20:00 шаг 30 мин) → подтверждение, пишется в `sa.storage` под ключом `appointments`
  - **AI-чат:** диалог с ассистентом, история в `sa.storage.ai_chat`, видна каждому клиенту своя
  - **Управление (только владелец):** записи сегодня, недельная статистика (кол-во + выручка), редактор данных бизнеса (мастер, график, адрес, услуги — CRUD)
- Розетка `sa.ai.chat(messages)` — POST `/sa/ai/chat`, бэк подмешивает системный промпт из `tenant.config`, вызывает `claude-sonnet-4-6` через Anthropic API
- Системный промпт: «Ты — AI-ассистент барбершопа N в Бишкеке, отвечай ТОЛЬКО про этот бизнес, по-русски (кыргызский по запросу), кратко, цены в сомах»
- `GET /sa/tenants/{slug}/appointments` — сводный список записей всех клиентов (только владелец)
- `GET/PATCH /sa/tenants/{slug}/config` — публичные настройки бизнеса (read: any auth, write: owner only)
- Env: `SA_ANTHROPIC_API_KEY` (sync:false в render.yaml, задан в Render Dashboard вручную)

---

## ШАБЛОНЫ В РЕЕСТРЕ

| id | name | назначение |
|---|---|---|
| `barbershop` | Барбершоп | Запись + AI-ассистент для клиентов (полноценный бизнес-шаблон) |
| `mood-journal` | Дневник настроения | Заметки + карта настроения (демо-шаблон) |

## РОЗЕТКИ SDK (`window.sa`)

- `sa.auth.{register, login, me, logout, isAuthorized}` — JWT + pbkdf2_sha256
- `sa.tenants.{list, create, get, update, getConfig, setConfig, appointments, manifestUrl}`
- `sa.withTenant(slug)` → scoped: `{storage, ai, auth, tenants}`
- `sa.storage.{get, set, del, keys}` — per (tenant, user, key)
- `sa.ai.chat(messages)` — proxy к Claude через бэк

## АРХИТЕКТУРНЫЕ РЕШЕНИЯ

- Stack: FastAPI + SQLAlchemy 2.0 + Postgres / React 18 + Vite 5
- Шаблоны работают ТОЛЬКО через `sa.*`, прямого доступа к БД нет
- Auth: JWT в localStorage, header Authorization: Bearer
- Tenant resolution: header `X-Tenant-Slug` (не path param — сохраняет /sa/storage/* совместимым)
- PWA: per-tenant манифест с SVG-data-URI иконкой, отдаётся бэком (CORS открыт)
- Конфиг бизнеса видим всем клиентам (для AI-промпта и UI), редактирует только владелец

---

## ОТКРЫТЫЕ ВОПРОСЫ

- **Конфликты слотов:** два клиента могут забукать одно время — нет проверки
- **Уведомления владельцу:** клиент записался → владелец узнаёт только зайдя в Управление. Нет WhatsApp/email/push
- **Customer-side cancel/reschedule:** клиент не может отменить запись
- **Tenant edit UI:** PATCH endpoint есть, формы редактирования (name/color/emoji) нет
- **Изоляция кода шаблонов:** общий JS-контекст, шаблон теоретически читает чужой токен из localStorage
- **SW network-first:** реального оффлайна нет
- **CI/тесты:** отсутствуют
- **Render free tier:** бэк засыпает через 15 мин простоя, первый запрос ~30с
- **iOS install hint:** реальный тест на iPhone не делался (нет устройства)

## ИДЁТ СЕЙЧАС

- Регистрация в Twilio для WhatsApp-уведомлений владельцу при новой записи (Задача из выбора A/B/C — пользователь выбрал B)
