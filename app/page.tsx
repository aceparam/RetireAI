"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PiggyBank,
  ArrowRight,
  Calculator,
  Dices,
  Bot,
  Flame,
  Receipt,
  Target,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Onboarding } from "@/components/onboarding";
import { usePlanner } from "@/lib/store";

const FEATURES = [
  { icon: Calculator, title: "Retirement Calculator", desc: "Know exactly when you can retire and how much you'll need." },
  { icon: Flame, title: "FIRE Calculator", desc: "Lean, Regular & Fat FIRE — find your path to independence." },
  { icon: Dices, title: "Monte Carlo", desc: "Run thousands of simulations for your probability of success." },
  { icon: Target, title: "Goal Planning", desc: "Plan education, marriage & home goals alongside retirement." },
  { icon: Receipt, title: "Tax Optimizer", desc: "Old vs New regime, 80C, NPS — keep more of your money." },
  { icon: Bot, title: "AI Coach", desc: "Ask anything and get personalized, quantified advice." },
];

export default function LandingPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const onboarded = usePlanner((s) => s.onboarded);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="gradient-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg">
            <PiggyBank className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">RetireAI</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="py-16 text-center sm:py-24">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-powered retirement planning, built for India
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Retire with <span className="gradient-text">confidence</span>, not guesswork.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Estimate your corpus, stress-test it with Monte Carlo simulations, optimize taxes, and
            get a personalized action plan — all in one beautiful dashboard.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => setShowOnboarding(true)}>
              {mounted && onboarded ? "Continue Planning" : "Start Planning Free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/dashboard")}>
              Explore the Dashboard
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> Private — data stays on your device</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Realistic India-tuned assumptions</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-warning" /> Under 5 minutes to set up</span>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="themed rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition-transform hover:-translate-y-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>RetireAI · Educational planning tool. Not financial advice. Built for India 🇮🇳</p>
      </footer>

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
