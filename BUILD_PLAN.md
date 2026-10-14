# WhatsApp Management Dashboard — Build Plan

Internal business/management dashboard for a Meta WhatsApp Business number.
Full-stack: Next.js + TypeScript + Tailwind, local PostgreSQL, ChromaDB (RAG over PDFs),
Meta WhatsApp Cloud API + webhooks.

> Sources of truth:
> - `whatapp-md.md` — full product specification (25 sections).
> - `whatapp-desgin/stitch_whatsapp_business_operations_dashboard/` — 4 Stitch screens (`code.html` + `screen.png`) and `DESIGN.md`.

---

## 1. Decisions (locked)

| Topic | Decision |
|-------|----------|
| Scope | Frontend + data/auth/backend (full stack). |
| Navigation shell | Desktop left rail (`lg+`) **and** mobile bottom tab bar; shared header. |
| Design tokens | Authoritative set = the `tailwind.config` inside the `code.html` files (M3 green palette), **not** the `#059669` prose in `DESIGN.md`. |
| Undesigned pages | Designed in the same visual system as they are built (contacts, templates, users, logs, settings). |
| Pages to deliver | All 4 designed screens + the rest of `whatapp-md.md` §21. |

---

## 2. Existing inputs

### 2.1 Screens (Stitch export)

| Folder | Route | Contents |
|--------|-------|----------|
| `dashboard_overview` | `/dashboard` | Health card (phone, quality, tier, webhook latency, Chroma sync), 2x2 metric bento (unread 18, conversations 3492, contacts 14,820, indexed PDFs 42/184,200 chunks), quick dispatch grid, 24h traffic sparkline, recent inquiries (Marcus Vance, Devon Lane, Aria Montgomery, Tariq Al-Mansoor), audit timeline, footer. |
| `whatsapp_inbox` | `/dashboard/inbox` | Search + filter pills, thread header (Dr. Sarah Lin, +1 555 839-2041), 24h Meta care window, in/out chat bubbles + PDF attach card, ChromaDB "AI Suggested Vector Match" card, composer with `/rag` mode + char counter, attachment drawer, HSM template modal, typing indicator. |
| `whatsapp_connection_management` | `/dashboard/whatsapp` | Connection status card (Acme Global Ops), Phone Number ID / WABA ID / Graph version, webhook ingress URL, credential form (phone, phone number ID, WABA ID, permanent token w/ reveal), validate-handshake, disconnect modal. |
| `pdf_management_chromadb_rag` | `/dashboard/documents` | Docs/chunks/HNSW metrics, upload dropzone, 6-stage pipeline stepper (Validate→Storage→Metadata→Extract→Embed→ChromaDB), RAG semantic query + synthesized answer + citations, document registry cards with indexing progress, delete/details modals, toasts. |

### 2.2 Navigation (from the Stitch drawer)

- Dashboard — pill `Live`
- WhatsApp — pill `Online`
- Inbox — pill `14`
- Contacts — pill `2.8k`
- Documents / PDFs — pill `ChromaDB`
- Message Templates — pill `HSM`
- Users & Roles — pill `RBAC`
- Activity Logs — pill `Audit`
- Settings — pill `Config`

Header: "WABA Ops Portal" / "v20.0 Core", notifications badge (3), profile
"Elena Rostova · Super Admin Tier 3 · erostova@meta-waba.internal".
Footer: "Internal Business Portal - Meta Cloud API v20.0 - PostgreSQL & ChromaDB Integrated".

Mobile bottom tab bar: Dashboard / Inbox / Documents / WhatsApp / Menu(drawer).

### 2.3 Design system tokens (from `code.html` `tailwind.config`)

**Colors (Material 3 — green):**

| Token | Hex |
|-------|-----|
| primary | `#006948` |
| on-primary | `#ffffff` |
| primary-container | `#00855d` |
| on-primary-container | `#f5fff7` |
| secondary | `#006b5f` |
| on-secondary | `#ffffff` |
| secondary-container | `#8cf1e1` |
| on-secondary-container | `#006f64` |
| tertiary | `#006b2e` |
| tertiary-container | `#00873c` |
| error | `#ba1a1a` |
| error-container | `#ffdad6` |
| on-error-container | `#93000a` |
| background / surface | `#faf8ff` |
| on-surface | `#131b2e` |
| on-surface-variant | `#3d4a42` |
| outline | `#6d7a72` |
| outline-variant | `#bccac0` |
| surface-container-lowest | `#ffffff` |
| surface-container-low | `#f2f3ff` |
| surface-container | `#eaedff` |
| surface-container-high | `#e2e7ff` |
| surface-container-highest | `#dae2fd` |
| surface-dim | `#d2d9f4` |
| inverse-surface | `#283044` |
| inverse-on-surface | `#eef0ff` |
| primary-fixed-dim / tertiary-fixed-dim | `#68dba9` / `#3de273` |

**Radius (note: overrides Tailwind defaults):** `DEFAULT 0.125rem`, `lg 0.25rem`, `xl 0.5rem`, `full 0.75rem`.

**Typography:** Inter (400/500/600/700) + custom scale classes:
`headline-sm` 14/20 600, `headline-md` 16/24 600, `body-md` 14/20 400, `body-sm` 12/16 400,
`label-sm` 11/14 600 (uppercase tracking), `mono-data` 12/16 500.
Use `tabular-nums` for metrics/counters/timestamps.

**Spacing tokens:** `space-xxs .125rem`, `space-xs .25rem`, `space-sm .5rem`, `space-md .75rem`,
`space-lg 1rem`, `space-xl 1.5rem`, `space-2xl 2rem`, plus `margin*` and `gutter*`.

**Icons:** Material Symbols Outlined.

---

## 3. Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + local PostgreSQL
- Auth.js (credentials) + scrypt password hashing (Node `crypto`, no native deps)
- ChromaDB (vector store) + embedding model (OpenAI-compatible, configurable)
- Local private filesystem for PDFs
- Meta WhatsApp Cloud API + Meta Webhooks

---

## 4. Phases

### Phase 1 — Scaffold & design system
- `create-next-app` (TS, Tailwind, ESLint, App Router).
- Encode §2.3 tokens in `tailwind.config.ts`; load Inter + Material Symbols in root layout.
- `components/ui/`: `Card` (48px header + divider), `Button` (primary/subtle/destructive/icon-32),
  `Badge`/`StatusChip` (connected/syncing/disconnected), `Input` (36px), `Modal`, `Toast`,
  `ProgressBar`, `Avatar`, `Icon`.
- `ConsoleShell` layout: fixed 260px left rail at `lg+`, fixed bottom tab bar under `lg`,
  shared header. Single responsive component.

### Phase 2 — Port the 4 designed screens
- `/dashboard`, `/dashboard/inbox`, `/dashboard/whatsapp`, `/dashboard/documents`.
- Exact-copy React ports with all prototype interactivity preserved:
  composer auto-grow + `/rag` badge + char counter, attachment drawer, HSM modal,
  token reveal, validate-handshake, disconnect/delete/details modals, toasts,
  typing indicator, SVG sparkline.
- Seed with the prototype mock data so UI matches the PNGs before wiring real data.

### Phase 3 — Prisma schema + seed
- Tables: `profiles, roles, permissions, role_permissions, whatsapp_accounts, contacts,
  conversations, messages, documents, message_templates, notifications, activity_logs`.
- Relationships per `whatapp-md.md` §18.
- Seed roles/permissions from the §6 RBAC matrix.

### Phase 4 — Auth + RBAC
- Auth.js credentials provider, scrypt hashes, HTTP-only same-site cookie sessions.
- `src/proxy.ts` (Next 16's renamed middleware) guards `/dashboard/*`.
- `requirePermission()` server helper enforced in every route handler / server action
  (security must not rely on hidden UI buttons).

### Phase 5 — Meta WhatsApp Cloud API
- Server-only API client (tokens never reach the browser).
- Add-number form (WhatsApp screen), server-side credential validation, connection states
  (Connected / Disconnected / Connecting / Error), disconnect (confirm + RBAC + audit log).
- Webhook: `GET` verify token + `POST` with `X-Hub-Signature-256` validation → persist messages.

### Phase 6 — Inbox / contacts / templates / notifications / audit
- Wire the inbox to real conversations/messages; send text + supported media.
- Contacts CRUD (§9); templates with `{{n}}` placeholders (§12); notifications (§13);
  activity-log timeline (§14). Design the undesigned pages in the same system.

### Phase 7 — Documents + RAG
- Private `storage/documents/` (outside `public/`), authenticated permission-checked streaming route.
- Metadata in PostgreSQL; 6-stage pipeline: validate → store → metadata → extract (pdf/OCR) →
  chunk → embed → ChromaDB.
- RAG query with source citations (doc + page/chunk). Delete prunes vectors.

### Phase 8 — Hardening
- HTTPS, Zod input validation, rate limiting, error boundaries, tests,
  backups of PostgreSQL + the storage directory.

---

## 5. Environment variables

```
DATABASE_URL              # PostgreSQL (Prisma)
AUTH_SESSION_SECRET       # Auth.js session signing
ADMIN_NAME                # Seed admin (npm run db:seed)
ADMIN_EMAIL
ADMIN_PASSWORD
CHROMA_URL                # ChromaDB RAG service
LLM_API_KEY               # OpenAI-compatible embeddings + LLM
LLM_BASE_URL
LLM_MODEL
EMBEDDING_MODEL
CHROMA_COLLECTION
META_APP_SECRET           # Webhook POST signature verification
META_WEBHOOK_VERIFY_TOKEN # Webhook GET handshake (self-created)
META_GRAPH_VERSION        # Optional, defaults to v20.0
```

WhatsApp connection credentials (Phone Number ID, WABA ID, permanent access token) are **not** env
vars — they are entered on the dashboard WhatsApp page and stored in PostgreSQL. See
[META_SETUP.md](./META_SETUP.md).

Secrets stay server-side only; never committed or shipped to the browser.

---

## 6. Open defaults (assumed unless changed)

- PostgreSQL via local `DATABASE_URL`.
- Embeddings via an OpenAI-compatible `EMBEDDING_MODEL`.
- Desktop content is a max-width centered column (prototypes are mobile-first) until
  desktop reference PNGs are supplied.

---

## 7. Progress

- [x] Phase 1 — Scaffold & design system
- [x] Phase 2 — Port the 4 designed screens
- [x] Phase 3 — Prisma schema + seed *(schema pushed to local PostgreSQL `waba_portal`, seeded)*
- [x] Phase 4 — Auth + RBAC *(credentials + scrypt, `proxy` route guard, `requirePermission`; login verified against the seeded DB)*
- [x] Phase 5 — Meta WhatsApp Cloud API *(server-only Graph client, add-number form + handshake, connection states, RBAC-guarded connect/disconnect with audit logs, webhook GET verify + signed POST → persists messages; dev placeholders for `META_APP_SECRET`/`META_WEBHOOK_VERIFY_TOKEN`)*
- [x] Phase 6 — Inbox / contacts / templates / notifications / audit *(inbox backed by real conversations/messages with RBAC-guarded send + 24h care window; contacts & templates & users CRUD; notifications inbox + live header bell count; activity-log timeline; `/dashboard/settings`; all pages permission-gated server-side)*
- [x] Phase 7 — Documents + RAG *(private `storage/documents/` + authenticated streaming route `/api/documents/[id]`; 6-stage ingestion pipeline → text extraction via `unpdf` → chunking → OpenAI-compatible embeddings → ChromaDB upsert; RAG query with source citations and vector pruning on delete; `documents-console` data-driven. Live embed/index/query require a running ChromaDB + `LLM_API_KEY` — surfaces "not configured" states otherwise.)*
- [x] Phase 8 — Hardening *(Postgres rate limiting + guards; security headers; Vitest unit tests; tsc/lint/build/tests green.)*
