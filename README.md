# RetireAI — Comprehensive Retirement Planning Platform 🇮🇳

A modern, responsive retirement-planning web app that helps users estimate, track,
and optimize their retirement readiness. Built for India, with realistic financial
math, rich data visualization, and an AI-powered coaching layer.

> **When can I retire? · How much will I need? · Am I on track? · What should I do next?**

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8) ![Recharts](https://img.shields.io/badge/Recharts-2-22c55e)

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

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

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

## 🔌 Extending to a Full Backend

The app is frontend-complete with a **backend-ready data layer**: all state flows
through the Zustand store (`lib/store.ts`) behind a small, swappable interface.
To productionize per the original spec:

- **Auth (OAuth / Google):** add `next-auth` with the Google provider; gate the
  `(app)` route group behind a session check.
- **Database (PostgreSQL):** replace the `persist` middleware with API calls to a
  **NestJS** service exposing `ProfileInputs`, `Scenario`, and `Goal` resources
  (the types in `lib/types.ts` map 1:1 to tables).
- **Generative AI Coach:** route the user's question + a serialized profile summary
  through an API route to the **Claude API**; the rule-based answers in `coach.ts`
  make a strong grounding context and offline fallback.
- **Live market data:** the calculation inputs (expected returns, holdings) can be
  pre-filled from a portfolio/market data provider.

**Hosting:** deploy the frontend to Vercel; host the NestJS API + Postgres on
AWS/Azure.

---

## ⚠️ Disclaimer

RetireAI is an **educational planning tool**, not financial advice. Projections are
estimates based on the assumptions you provide and do not guarantee future returns.
Consult a SEBI-registered advisor before making investment decisions.
