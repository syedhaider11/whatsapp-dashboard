# Meta WhatsApp Cloud API — Setup Guide

How to connect your own Meta for Developers WhatsApp account to this dashboard.

> **About this project:** Next.js + Prisma + **local PostgreSQL** (not Supabase), and it reads
> secrets from a single **`.env`** file (not `.env.local`).

This app already ships the full integration: a server-only Graph API client, a connection form on
the **WhatsApp** page, and a webhook endpoint. You only need to supply your own Meta values.

---

## 1. What values you need, and where each one goes

There are **two kinds** of values. Only the webhook values live in `.env`; the connection values are
entered in the dashboard and stored in the database.

| Value | Where it goes | Where it comes from |
|-------|---------------|---------------------|
| `META_APP_SECRET` | `.env` | Meta → App settings → Basic → App secret |
| `META_WEBHOOK_VERIFY_TOKEN` | `.env` | **You create this yourself** |
| `META_GRAPH_VERSION` | `.env` (optional) | Defaults to `v20.0` |
| Phone Number ID | Dashboard → WhatsApp page | Meta → WhatsApp → API Setup |
| WABA ID (WhatsApp Business Account ID) | Dashboard → WhatsApp page | Meta → WhatsApp → API Setup |
| Access Token (permanent) | Dashboard → WhatsApp page | Meta → Business settings → System users |
| Callback URL | Meta → WhatsApp → Configuration | `https://<your-public-url>/api/webhooks/whatsapp` |

Only `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` and `META_GRAPH_VERSION` are read from `.env`.
The Phone Number ID, WABA ID and access token are **not** env vars in this project — they are typed
into the **WhatsApp** page and saved in PostgreSQL (the `WhatsAppAccount` table).

---

## 2. Get the values from Meta, one by one

### Step 1 — Create / open your Meta app
1. Go to <https://developers.facebook.com/apps>.
2. **Create App** → choose the **WhatsApp** use case → **Start using the API**.
3. This opens the **WhatsApp → API Setup** panel.

### Step 2 — Phone Number ID and WABA ID
On **WhatsApp → API Setup**, next to your sender ("From") number:
- **Phone Number ID** — a long number such as `106540352242922`. This is Meta's ID for the number,
  **not** the phone number itself.
- **WhatsApp Business Account ID (WABA ID)** — shown as "WhatsApp Business Account ID".

Copy both; you will paste them into the dashboard's WhatsApp page.

### Step 3 — Access token
- **Quick test:** click **Generate access token** on the API Setup panel. This token expires in ~24h;
  fine for a first test only.
- **Permanent (recommended):**
  1. Open **Business settings → Users → System users**.
  2. **Add** a system user.
  3. **Assign Assets** → select your app (**Full control / Manage app**) and your WhatsApp account
     (**Full control / Manage WhatsApp Business accounts**).
  4. **Generate token** with permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
     - `business_management`
  5. Copy the token (it does not expire).

### Step 4 — App Secret → `.env`
1. App dashboard → **App settings → Basic**.
2. **App secret** → **Show** (confirm your identity if asked) → copy.
3. Add to `.env`:
   ```env
   META_APP_SECRET="<your app secret>"
   ```

### Step 5 — Webhook Verify Token → `.env` and Meta
This token is **not provided by Meta** — you invent any string and use the *same* value in both
places.
1. Add to `.env`:
   ```env
   META_WEBHOOK_VERIFY_TOKEN="<any random string you choose>"
   ```
2. Paste the identical string into Meta's webhook "Verify token" field (Step 6).

---

## 3. Register the webhook with Meta

The webhook endpoint already exists at `src/app/api/webhooks/whatsapp/route.ts`:

- `GET` → validates `hub.verify_token` against `META_WEBHOOK_VERIFY_TOKEN`.
- `POST` → validates the `X-Hub-Signature-256` header against `META_APP_SECRET`, then stores messages.

To register it:
1. Meta → **WhatsApp → Configuration** → **Webhook → Edit**.
2. **Callback URL:** `https://<your-public-url>/api/webhooks/whatsapp`
3. **Verify token:** the exact value of `META_WEBHOOK_VERIFY_TOKEN`.
4. **Verify and save**.
5. Subscribe to the **`messages`** webhook field (covers incoming messages and delivery statuses).

---

## 4. Local development (public HTTPS tunnel)

Meta cannot deliver webhooks to `http://localhost:3000`. For local testing, expose your server with a
tunnel and use the tunnel URL as the Callback URL. Examples:

```powershell
# ngrok
ngrok http 3000

# Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000
```

Then set the Callback URL to:

```
https://<your-tunnel-domain>/api/webhooks/whatsapp
```

---

## 5. Connect from the dashboard

1. Start the app: `npm run dev`.
2. Sign in, open **WhatsApp** in the sidebar.
3. Enter **Phone Number ID**, **WABA ID** and the **permanent access token**, then **Validate** and
   **Connect**. The app calls the Graph API to verify the credentials before saving them.
4. The Overview page and inbox will start reflecting your real account and messages.

Sending messages works without a webhook. **Receiving** messages requires the webhook (Steps 3
and 4) to be reachable over public HTTPS.

---

## 6. Required permissions

| Permission | Purpose |
|------------|---------|
| `whatsapp_business_messaging` | Send and receive WhatsApp messages |
| `whatsapp_business_management` | Manage WABA resources (templates, phone numbers) |
| `business_management` | System-user token generation |

---

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Webhook POST returns `401 Invalid signature` | `META_APP_SECRET` is wrong or belongs to another app |
| Webhook verification fails in Meta | Verify token in Meta ≠ `META_WEBHOOK_VERIFY_TOKEN` |
| `Validate` fails on the WhatsApp page | Bad Phone Number ID / WABA ID / access token, or the token lacks permissions |
| Connection works but no inbound messages | Webhook URL not public HTTPS, or `messages` field not subscribed |
| Token stops working after ~24h | You used the temporary token — create a permanent system-user token (Step 3) |

---

## 8. Security

- Never commit `.env`; it is already git-ignored. Share values only with authorized personnel.
- Keep the App Secret and access token server-side. This project never exposes them to the browser —
  the token is entered over the server action and stored in PostgreSQL.
- Rotate the access token and App Secret if they are ever exposed.

---

## Reference: exact env keys used by this project

```env
# Webhook verification (required for receiving messages)
META_APP_SECRET=""
META_WEBHOOK_VERIFY_TOKEN=""

# Optional — defaults to v20.0
META_GRAPH_VERSION="v20.0"
```
