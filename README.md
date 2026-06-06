# RetireAI — Comprehensive Retirement Planning Platform 🇮🇳

A modern, responsive retirement-planning web app that helps users estimate, track,
and optimize their retirement readiness. Built for India, with realistic financial
math, rich data visualization, and an AI-powered coaching layer.

> **When can I retire? · How much will I need? · Am I on track? · What should I do next?**

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8) ![Recharts](https://img.shields.io/badge/Recharts-2-22c55e)

## ▶️ Try it instantly

[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-151515?logo=codesandbox&logoColor=white)](https://codesandbox.io/p/github/aceparam/RetireAI/main)
&nbsp;
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-1389FD?logo=stackblitz&logoColor=white)](https://stackblitz.com/github/aceparam/RetireAI/tree/main)

**One click → live app.** CodeSandbox spins up a cloud VM, runs `npm install`
then `npm run dev` (configured in [`.codesandbox/tasks.json`](./.codesandbox/tasks.json)),
and opens the preview on port 3000. The app is **offline-first** — every
calculator, dashboard, chart, and the rule-based AI coach work with no backend
or sign-in. (Google sign-in, cloud sync, and the Claude-powered coach are
optional — see the backend setup below.)

> Importing a **private** repo? CodeSandbox/StackBlitz will ask you to authorize
> their GitHub app first (you own the repo, so one approval is all it takes).

---

## ✨ Features

| # | Module | What it does |
|---|--------|--------------|
| 1 | **Retirement Calculator** | Required corpus, future value, readiness score, surplus/shortfall, success probability — with live what-if inputs and accumulation/drawdown charts. |
| 2 | **Financial Health Dashboard** | Net worth, asset allocation, historical trend, readiness gauge with factor breakdown, and top actions. |
| 3 | **FIRE Calculator** | Lean / Regular / Fat FIRE numbers, years to financial independence, required monthly savings, progress charts. |
| 4 | **Portfolio Analyzer** | Asset & liability editor, allocation pie, diversification & risk scoring, blended return/volatility, recommendations. |
| 5 | **Monte Carlo Simulation** | 500–10,000 randomized return paths → success probability, median/best/worst, confidence-band fan chart, outcome histogram. |
| 6 | **Goal-Based Planning** | Education, marriage, house, travel, emergency goals — inflation-adjusted targets, funding gaps, and impact on retirement. |
| 7 | **Retirement Income Planner** | Pension, rental, dividends, SWP, annuity → monthly income, corpus depletion forecast, tax-adjusted cash flow. |
| 8 | **Tax Optimizer (India)** | Old vs New regime comparison (FY 2025-26), 80C / NPS / 80D / 24(b), capital-gains (LTCG) estimate, tax-saving tips. |
| 9 | **AI Retirement Coach** | Natural-language Q&A grounded in your real plan, plus a prioritized, quantified action plan. |
| 10 | **Scenario Comparison** | Compare retirement ages side-by-side, stress-test with what-if levers, save/load snapshots, export PDF. |

**Advanced:** What-If analysis · Retirement Readiness Score (0–100, color-coded) ·
AI Recommendations Engine with estimated impact · Sankey-style net-worth flows ·
mobile-first responsive design · dark mode · guided onboarding (< 5 min) ·
PDF export (print) · localStorage persistence.

---

## 🧮 The Financial Engine

All calculations live in [`lib/`](./lib) and are pure, typed, and unit-testable:

- **`finance.ts`** — corpus projection (monthly compounding + annual SIP step-up),
  required-corpus via present value of a growing annuity-due (real-rate discounting),
  drawdown timeline with depletion detection, multi-factor readiness score, and
  blended portfolio return/volatility.
- **`montecarlo.ts`** — Box–Muller normal sampling across accumulation +
  decumulation phases, percentile bands, and outcome histogram.
- **`tax.ts`** — India Old/New regime slabs (FY 2025-26), 87A rebate, cess,
  LTCG, and personalized saving tips.
- **`fire.ts`** — Lean/Regular/Fat FIRE numbers and time-to-FI solver.
- **`recommendations.ts`** — rule-based, prioritized, quantified action plan.
- **`coach.ts`** — intent-detecting natural-language coach (offline & private).

India-tuned default assumptions (equity ~12%, EPF 8.25%, PPF 7.1%, inflation 6%)
live in `ASSET_CLASSES`. Amounts are formatted in lakh/crore via `format.ts`.

---

## 🛠 Tech Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** + ShadCN-style component primitives (`components/ui`)
- **Recharts** + custom SVG gauge for visualizations
- **Zustand** (persisted to `localStorage`) for state
- **next-themes** for dark mode · **lucide-react** icons

---

## 🚀 Getting Started

### Frontend (runs standalone, offline-first)

```bash
npm install
npm run dev        # http://localhost:3000
```

The app is fully usable with **no backend** — all state persists to
`localStorage`. To enable Google sign-in and cloud sync, set the API URL:

```bash
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend (optional — Google OAuth + PostgreSQL persistence)

```bash
cd server
cp .env.example .env               # fill in Google OAuth creds + DATABASE_URL
npm install
npm run start:dev                  # http://localhost:4000
```

See [`server/README.md`](./server/README.md) for the full API reference and
Google Cloud setup. With both running, click **Sign in with Google** in the app:
your profile and saved scenarios sync to Postgres across devices.

Other frontend scripts:

```bash
npm run build      # production build
npm start          # serve production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

---

## 🗺 Project Structure

```
app/
  layout.tsx            # root layout + theme provider
  page.tsx              # landing + guided onboarding
  (app)/                # authenticated app shell (sidebar nav)
    dashboard/  calculator/  fire/  monte-carlo/  portfolio/
    goals/  income/  tax/  scenarios/  coach/
components/
  ui/                   # Card, Button, Input, Slider, Tabs, Field, …
  charts/               # Recharts wrappers + ScoreGauge
  layout/               # app shell + nav
  onboarding.tsx        # 3-step wizard
lib/                    # the financial engine (see above) + store
```

---

## 🔐 Authentication & Cloud Sync

Google sign-in and persistence are implemented in the [`server/`](./server)
**NestJS + PostgreSQL** API and wired into the frontend:

- **Google OAuth** is owned by the backend (`passport-google-oauth20`). The
  frontend redirects to `GET /auth/google`; after consent, the API mints a **JWT**
  and bounces back to `/auth/callback?token=…`.
- The **JWT** is stored client-side (`lib/auth.ts`) and sent as a Bearer token by
  the API client (`lib/api.ts`).
- **`SyncProvider`** (`components/sync-provider.tsx`) reconciles local ⇄ remote
  state: on sign-in it pulls your saved profile & scenarios (or seeds them from
  local), then debounces profile pushes and mirrors scenario create/delete.
- **Offline-first:** auth is *additive*. With no `NEXT_PUBLIC_API_URL` set, the
  app runs entirely on `localStorage` and the sign-in UI is hidden.

The TypeScript types in `lib/types.ts` map 1:1 to the API DTOs and TypeORM
entities, so `ProfileInputs` / `Scenario` flow through unchanged.

## 🤖 AI Coach (Claude)

The AI Coach is wired to the **Claude API** (`claude-opus-4-8`) through the NestJS
`/coach` endpoint:

- The frontend sends the question plus a **compact, precomputed snapshot of your
  plan** (required vs projected corpus, readiness, success probability, gap, etc.)
  as grounding context — so Claude's advice is always consistent with the numbers
  on your dashboard. Built with the official `@anthropic-ai/sdk` using adaptive
  thinking.
- **Graceful degradation:** when you're signed in *and* `ANTHROPIC_API_KEY` is set,
  the coach is Claude-powered; otherwise it transparently falls back to the
  built-in **offline rule-based engine** (`lib/coach.ts`). The chat works either way.
- Enable it by setting `ANTHROPIC_API_KEY` on the API (see `server/README.md`).

### Still on the roadmap

- **Streaming coach replies** (SSE) for token-by-token output.
- **Live market data:** pre-fill expected returns & holdings from a market-data
  provider.

**Hosting:** deploy the frontend to Vercel; host the NestJS API + Postgres on
AWS/Azure (set `DB_SSL=true`, `DB_SYNCHRONIZE=false`, and use migrations).

---

## ⚠️ Disclaimer

RetireAI is an **educational planning tool**, not financial advice. Projections are
estimates based on the assumptions you provide and do not guarantee future returns.
Consult a SEBI-registered advisor before making investment decisions.
