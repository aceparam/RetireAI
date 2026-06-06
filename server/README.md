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

## Production notes

- Set a long random `JWT_SECRET`; turn `DB_SYNCHRONIZE=false`.
- Set `DB_SSL=true` for managed Postgres that requires TLS.
- Deploy behind HTTPS; the OAuth callback URL must match exactly.
