# Deployment Plan - TicketFlow

Free-tier, no-expiration stack:

| Piece | Service | Notes |
|---|---|---|
| Frontend (React/Vite) | **Vercel** | already used; set `VITE_SERVER_URL` |
| Backend (Node/Express) | **Render** free web service (or Koyeb) | does not expire; Render sleeps when idle (cold start) |
| Database (PostgreSQL) | **Neon** | free, **does not expire**, Prisma-friendly |
| Background jobs / AI | **Inngest Cloud** | free tier; replaces the local dev server in prod |
| LLM | Gemini API | external, key in env |
| Email | Mailtrap | external, keys in env |

---

## 0. Prerequisite: push the Postgres version

The Mongo->Postgres migration currently lives only in local commits. Push first:

```bash
git push origin main
```

(The old Vercel deploy is still the Mongo version; it updates when the frontend redeploys against the new backend.)

---

## 1. Database - Neon

1. Create a project at neon.tech -> copy the **pooled** connection string.
2. It becomes the backend's `DATABASE_URL`
   (`postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`).
3. Migrations run against it during backend deploy (step 3).

## 2. Inngest Cloud

1. Create an app at inngest.com.
2. Copy the **Event Key** and **Signing Key** -> backend env
   `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`.
3. After the backend is live (step 3), register the sync URL in the Inngest
   dashboard: `https://<backend-host>/api/inngest`.
   The `on-ticket-created` function should then appear in the dashboard.

## 3. Backend - Render (free web service)

- **Root directory:** `ai-ticket-assistant`
- **Build command:** `npm install && npx prisma generate`
- **Start command:** `npx prisma migrate deploy && node index.js`
  (runs pending migrations, then boots - safe to run every deploy)
- **Environment variables:**

  | Key | Value |
  |---|---|
  | `NODE_ENV` | `production`  (flips Inngest client to Cloud mode) |
  | `DATABASE_URL` | Neon pooled URL |
  | `JWT_SECRET` | long random string |
  | `JWT_EXPIRES_IN` | `24h` |
  | `GEMINI_API_KEY` | your key |
  | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Mailtrap creds |
  | `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | from Inngest Cloud |
  | `CORS_ORIGINS` | your Vercel URL (e.g. `https://ticket-flow-one.vercel.app`) |
  | `PORT` | Render sets this automatically; the app already reads it |

- After first deploy, seed an admin once (Render Shell, or run locally against Neon):
  ```bash
  npm run db:seed
  ```

## 4. Frontend - Vercel

- **Root directory:** `ai-ticket-frontend`
- **Env var:** `VITE_SERVER_URL = https://<backend-host>` (no trailing slash)
- Redeploy so the build picks up the new API URL.

## 5. Wire the loop closed

1. Set backend `CORS_ORIGINS` to the exact Vercel URL.
2. Set frontend `VITE_SERVER_URL` to the exact backend URL.
3. In Inngest Cloud, confirm the app synced and `on-ticket-created` is listed.

---

## Smoke test (prod)

1. Sign up -> welcome email lands in Mailtrap.
2. Log in -> dashboard loads.
3. Create a ticket -> within seconds it becomes `IN_PROGRESS` with AI notes +
   an assigned moderator (watch the run in the Inngest Cloud dashboard).
4. Log in as admin (`admin@ticketflow.com`) -> user management works.

---

## Gotchas

- **Cold starts:** Render free sleeps after ~15 min idle; first request after
  that takes ~30-60s. Inngest Cloud is durable and will retry, so async jobs
  still complete. Use Koyeb if you want it warmer.
- **`NODE_ENV=production` is required** - it's what switches the Inngest client
  from the local dev server to Cloud. Miss it and events go nowhere.
- **Neon SSL:** keep `?sslmode=require` in the connection string.
- **Never commit real secrets** - `.env` is gitignored; set everything in the
  host dashboards.
