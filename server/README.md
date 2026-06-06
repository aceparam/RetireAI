# RetireAI API (NestJS + PostgreSQL + Google OAuth)

The backend for RetireAI. Handles Google sign-in, issues JWTs, and persists each
user's financial profile and saved scenarios in PostgreSQL.

## Stack

- **NestJS 10** (Express) · **TypeORM** · **PostgreSQL**
- **Passport** — `passport-google-oauth20` (login) + `passport-jwt` (API auth)
- **@nestjs/jwt** for token issuance · **class-validator** for DTO validation

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/health` | — | Liveness probe |
| `GET` | `/auth/google` | — | Begin Google OAuth (302 → Google) |
| `GET` | `/auth/google/callback` | — | OAuth return → mints JWT → redirects to `FRONTEND_URL/auth/callback?token=…` |
| `GET` | `/auth/me` | JWT | Current user |
| `GET` | `/profile` | JWT | The user's financial profile (or `null`) |
| `PUT` | `/profile` | JWT | Upsert the financial profile |
| `GET` | `/scenarios` | JWT | List saved scenarios |
| `POST` | `/scenarios` | JWT | Save a scenario |
| `DELETE` | `/scenarios/:id` | JWT | Delete a scenario |
| `GET` | `/coach/status` | JWT | Whether the Claude-powered coach is configured |
| `POST` | `/coach` | JWT | Ask the AI coach (grounded in the user's plan) |

## Data model

- **users** — `id`, `googleId` (unique), `email` (unique), `name`, `avatarUrl`
- **financial_profiles** — one per user; full `ProfileInputs` as `jsonb` + a few
  denormalized columns (`currentAge`, `retirementAge`, `persona`)
- **scenarios** — many per user; `name` + `ProfileInputs` snapshot as `jsonb`

## Setup

1. **Database** — point `DATABASE_URL` at any PostgreSQL 14+ instance.

   ```bash
   createdb retireai   # or use a managed Postgres (RDS, Azure, Supabase, …)
   ```

2. **Google OAuth credentials** — in the
   [Google Cloud Console](https://console.cloud.google.com) → *APIs & Services →
   Credentials* → *Create OAuth client ID (Web application)*. Set the authorized
   redirect URI to:

   ```
   http://localhost:4000/auth/google/callback        # dev
   https://api.yourdomain.com/auth/google/callback   # prod
   ```

3. **Env** — copy and fill:

   ```bash
   cp .env.example .env
   ```

4. **Run**

   ```bash
   npm install
   npm run start:dev      # http://localhost:4000
   ```

   With `DB_SYNCHRONIZE=true` (dev) TypeORM auto-creates tables. In production set
   it to `false` and use migrations.

## AI Coach (Claude)

The `/coach` endpoint calls the **Claude API** (`claude-opus-4-8` by default) via
the official `@anthropic-ai/sdk`, passing the user's precomputed plan figures as
grounding context so answers stay consistent with the dashboard. It uses adaptive
thinking at `medium` effort.

- Set `ANTHROPIC_API_KEY` (from [console.anthropic.com](https://console.anthropic.com))
  to enable it; override the model with `COACH_MODEL`.
- When the key is **unset**, `/coach` returns `503` and the frontend transparently
  falls back to the built-in offline rule-based coach.
- The endpoint is JWT-protected so the API key is only ever used for signed-in users.

## Production notes

- Set a long random `JWT_SECRET`; turn `DB_SYNCHRONIZE=false`.
- Set `DB_SSL=true` for managed Postgres that requires TLS.
- Deploy behind HTTPS; the OAuth callback URL must match exactly.
