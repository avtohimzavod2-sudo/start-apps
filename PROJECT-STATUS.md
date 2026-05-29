# Start-Apps — Project Status

## URLs
- Frontend: https://sa-frontend-djk8.onrender.com
- Backend: https://sa-backend-yj5r.onrender.com
- Repo: github.com/avtohimzavod2-sudo/start-apps

## Stack
- Backend: FastAPI + SQLAlchemy 2.0 + Postgres (Docker on Render)
- Frontend: React 18 + Vite 5 (Static on Render)
- Deploy: auto from git push to main via render.yaml Blueprint

## Done
- Multi-tenant: tenants(id, slug UNIQUE, name, owner_login, 
  color, icon_emoji, template_id, config)
- Storage scoped by (tenant_id, user_login, key) via X-Tenant-Slug header
- URL /  = owner dashboard, /app/<slug> = client app
- Per-tenant branding: /sa/tenants/{slug}/manifest.webmanifest
  SVG icon (color + emoji), PWA installs with tenant name/color
- iOS install hint: overlay with Share → Add to Home Screen
- Barbershop template (4 screens):
  - Home: open/closed status, services with prices in KGS
  - Booking: service → date → time → confirm
  - AI chat: claude-sonnet-4-6, system prompt from tenant.config,
    Russian language, Kyrgyz on request
  - Management (owner only): today bookings, weekly stats, 
    service CRUD
- Slot protection: bookings(tenant_id, date, time) UNIQUE
  Double booking physically impossible, 409 on race condition

## SDK
sa.auth
sa.tenants.{list, create, get, update, getConfig, setConfig, 
            appointments, manifestUrl}
sa.withTenant(slug) → {storage, ai, bookings}
sa.bookings.{create, taken(date), mine}
SA_ANTHROPIC_API_KEY in Render env vars

## Open (not done)
- Booking cancellation/reschedule by client
- Edit tenant name/color/emoji after creation
- Owner notifications on new booking (deferred)
- Template code isolation (shared JS context)
- Render free tier: backend sleeps after 15min, first request ~30s
- Real iOS test (no device)
- No CI/tests

## Rules (never break)
- UI language: Russian, prices in KGS (som)
- No Twilio, no SMS
- Do NOT mention Atmosphera AI (separate product)
- No WhatsApp integration until explicitly requested
- Templates only via sa.* sockets
- No localStorage in templates
- Notifications deferred to later phase
