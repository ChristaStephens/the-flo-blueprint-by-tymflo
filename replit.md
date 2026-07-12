# The Flo Blueprint™

TymFlo's premium Business Intelligence Assessment Platform — a SaaS-style lead capture app for conferences and events. Flow: Landing → 7-question Assessment → Results Dashboard → Clerk Auth → Executive Report → $197 Executive Debrief purchase → Focus selection → TidyCal booking → Booking confirmation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/flo-blueprint run dev` — run the frontend (auto-port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (`lib/db/src/schema/leads.ts`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Playfair Display (headings/serif), Inter (UI/sans)

## Where things live

- `artifacts/flo-blueprint/` — React + Vite frontend, served at `/`
- `artifacts/api-server/` — Express API, served at `/api`
- `lib/db/src/schema/leads.ts` — Drizzle leads table schema
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `artifacts/flo-blueprint/src/lib/scoring.ts` — 7-category scoring engine
- `artifacts/flo-blueprint/src/lib/profiles.ts` — 6 Flo Blueprint profiles + `determineProfile`
- `artifacts/flo-blueprint/src/lib/state.ts` — localStorage state management
- `artifacts/flo-blueprint/src/pages/` — LandingPage, AssessmentPage, DashboardPage, ReportPage, DebriefFocusPage, DebriefScheduledPage

## Architecture decisions

- State stored in `localStorage` key `flo_blueprint_state`; survives page reload. Browser restores to the correct step automatically.
- Lead submission is gracefully degraded: if the API call fails, the user still proceeds to the Report page.
- Google Sheets sync is fire-and-forget via `GOOGLE_APPS_SCRIPT_URL` env var on the API server. Non-fatal if it fails.
- QR/UTM tracking is read from URL params on load and persisted to state: `?event=`, `?qr=`, `?campaign=`, `?utm_source=`, `?utm_medium=`, `?utm_campaign=`
- Report page CTA uses `VITE_CALENDLY_URL` env var for the "Build My Flo Plan" scheduling link.
- Executive Debrief funnel: ReportPage → Stripe checkout (`POST /api/checkout/debrief`) → `/debrief/focus` (verify payment, select focus) → TidyCal → `/debrief/scheduled`. Selected focus saved to localStorage + DB.
- Debrief checkout auto-creates the Stripe product/price on first use if not found (no manual Stripe setup required for the $197 debrief).

## Product

Landing → 7-question business assessment → instant Results Dashboard (health score gauge, category bars, Flo Blueprint profile) → gated Executive Report (full consulting-grade PDF-printable report with prioritized recommendations) → $197 Executive Debrief purchase → Focus selection (4 cards) → TidyCal booking → Booking confirmation.

## Brand

- Primary Purple: `#463176`
- Tangerine: `#F69679`
- Background: warm off-white `hsl(60 14% 98%)`
- Fonts: Playfair Display (serif headings), Inter (sans UI)
- Border radius: `0` (sharp corners, premium consulting aesthetic)
- WCAG 2.2 AA compliant — skip links, ARIA roles, focus rings on all interactive elements

## User preferences

- No AI-generated aesthetic — premium consulting look
- No emojis in the UI
- Brand colors applied via CSS variables in `index.css`

## Environment Variables

- `DATABASE_URL` — Postgres connection (auto-provided by Replit)
- `SESSION_SECRET` — Express session secret
- `GOOGLE_APPS_SCRIPT_URL` — (optional) Google Apps Script Web App URL for Sheets sync
- `VITE_CALENDLY_URL` — (optional) Calendly URL for legacy "Build My Flo Plan" link

### Service card scheduling links (all optional)

These control the "Schedule Your Session" button in the post-purchase success banner. The per-service vars take priority; `VITE_SERVICE_SCHEDULING_URL` / `SERVICE_SCHEDULING_URL` is the shared fallback for all three cards.

Frontend (`VITE_` prefix — shown in the success banner):
- `VITE_SERVICE_SCHEDULING_URL` — shared TidyCal/Calendly URL for all service card buyers
- `VITE_EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL` — override for Executive Growth Strategy Session buyers
- `VITE_MARKETING_SYSTEMS_REVIEW_SCHEDULING_URL` — override for Marketing Systems Review buyers
- `VITE_AI_WORKFLOW_ACCELERATOR_SCHEDULING_URL` — override for AI Workflow Accelerator buyers

Backend (server-side — used in confirmation emails):
- `SERVICE_SCHEDULING_URL` — shared fallback for all service confirmation emails
- `EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL` — override for Executive Growth Strategy emails
- `MARKETING_SYSTEMS_REVIEW_SCHEDULING_URL` — override for Marketing Systems Review emails
- `AI_WORKFLOW_ACCELERATOR_SCHEDULING_URL` — override for AI Workflow Accelerator emails

### Executive Debrief event configuration (all optional, VITE_ prefix for frontend)

- `VITE_EXECUTIVE_DEBRIEF_EVENT_NAME` — shows an "Exclusive [Name] Offer" badge on the report page
- `VITE_EXECUTIVE_DEBRIEF_PRICE` — price display string (default `$197`)
- `VITE_EXECUTIVE_DEBRIEF_EXPIRES` — expiration date shown in badge (e.g. `December 31, 2026`)
- `VITE_EXECUTIVE_DEBRIEF_TIDYCAL_URL` — TidyCal booking URL (default: `https://tidycal.com/tymflo-christa/the-flo-blueprint-executive-debrief`)
- `VITE_EXECUTIVE_DEBRIEF_CAMPAIGN` — campaign tag for tracking

### Service card pricing (all optional, server-side only — set BEFORE first use)

These control the price the Stripe product is created with on first checkout. If you set them after the product already exists in Stripe, the server will warn in logs, archive the old price, and create a new one at the configured amount.

- `EXECUTIVE_GROWTH_STRATEGY_PRICE_CENTS` — price in cents for Executive Growth Strategy Session (default: `99700` = $997)
- `MARKETING_SYSTEMS_REVIEW_PRICE_CENTS` — price in cents for Marketing Systems Review (default: `69700` = $697)
- `AI_WORKFLOW_ACCELERATOR_PRICE_CENTS` — price in cents for AI Workflow Accelerator (default: `49700` = $497)

## Google Sheets Integration

The backend posts lead data to a Google Apps Script Web App URL when `GOOGLE_APPS_SCRIPT_URL` is set. The target sheet ID is `1g44nX38VA5P3RUqdYJgW0jjAtxLulLQNNBSDcJhlusLg`.

To set up:
1. Open the Google Sheet
2. Extensions → Apps Script
3. Deploy a Web App that accepts POST requests and appends rows
4. Copy the Web App URL into the `GOOGLE_APPS_SCRIPT_URL` environment secret

## Admin Interface

Internal-only admin view at `/admin` (Christa only). Features: lead list with filters, per-lead detail with pre-call briefing card, debrief summary form (Draft→Finalized→Sent), PDF print, after-debrief service recommendation.

### Admin setup
- Set `ADMIN_EMAILS` env var (comma-separated emails) to grant admin access, e.g. `christa@tymflo.com`
- Admin auth uses Clerk session + server-side email allowlist check
- `/admin` and `/admin/leads/:id` are protected: unauthenticated users are redirected to `/sign-in`, unauthorized users get a 403

### Admin DB columns added
- `debrief_summary_status` — Draft / In Review / Finalized / Sent
- `debrief_summary_data` — JSONB with all summary form fields
- `debrief_summary_sent_at` — timestamp when finalized
- `internal_notes` — private notes (not visible to client)
- `debrief_recommended_service` — post-debrief service recommendation
- `recommendation_data` — JSONB with recommendation details (reason, amount, links, follow-up date)

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after any schema change (dev only)
- Do NOT run `pnpm run dev` at workspace root — use workflow restarts
- Admin routes require `ADMIN_EMAILS` env var to be set AND `CLERK_SECRET_KEY` to be available (the Replit Clerk integration sets this automatically)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
