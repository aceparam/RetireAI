"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, ArrowLeft, Check, Rocket, Users, Briefcase, Anchor } from "lucide-react";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/input";
import { NumberField } from "./ui/field";
import { usePlanner, PERSONA_PRESETS } from "@/lib/store";
import { cn } from "@/lib/utils";

const PERSONAS = [
  { key: "young" as const, icon: Users, title: "Young Professional", age: "25–35", desc: "Early career, SIP investor, wants financial independence." },
  { key: "midCareer" as const, icon: Briefcase, title: "Mid-Career", age: "35–50", desc: "Family responsibilities, multiple investments, building corpus." },
  { key: "preRetiree" as const, icon: Anchor, title: "Pre-Retiree", age: "50–65", desc: "Near retirement, wealth preservation, withdrawal planning." },
];

export function Onboarding({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { profile, setProfile, loadPersona, setOnboarded } = usePlanner();
  const [step, setStep] = React.useState(0);

  const finish = () => {
    setOnboarded(true);
    router.push("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl animate-slide-up sm:p-8">
        <button className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-accent" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-secondary")} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold">Which best describes you?</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll tailor starting assumptions to your life stage. You can change everything later.</p>
            <div className="mt-5 space-y-3">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const active = profile.persona === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => loadPersona(p.key)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50 hover:bg-accent",
                    )}
                  >
                    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{p.title}</p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{p.age}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                    {active && <Check className="h-5 w-5 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold">The essentials</h2>
            <p className="mt-1 text-sm text-muted-foreground">A few numbers to project your retirement. Pre-filled with sensible defaults.</p>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Your name (optional)</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="e.g. Siddhartha" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NumberField label="Current age" value={profile.currentAge} onChange={(v) => setProfile({ currentAge: v })} min={18} max={70} slider suffix="yrs" />
                <NumberField label="Retirement age" value={profile.retirementAge} onChange={(v) => setProfile({ retirementAge: v })} min={40} max={75} slider suffix="yrs" />
              </div>
              <NumberField label="Annual expenses (today)" value={profile.annualExpenses} onChange={(v) => setProfile({ annualExpenses: v })} prefix="₹" format="inr" />
              <NumberField label="Monthly investment (SIP)" value={profile.monthlyInvestment} onChange={(v) => setProfile({ monthlyInvestment: v })} prefix="₹" format="inr" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold">Assumptions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fine-tune the economic assumptions behind your plan.</p>
            <div className="mt-5 space-y-4">
              <NumberField label="Expected inflation" value={profile.inflation} onChange={(v) => setProfile({ inflation: v })} min={3} max={12} step={0.5} slider suffix="%" />
              <NumberField label="Pre-retirement return" value={profile.preRetirementReturn} onChange={(v) => setProfile({ preRetirementReturn: v })} min={5} max={16} step={0.5} slider suffix="%" hint="Expected annual return while you're investing." />
              <NumberField label="Post-retirement return" value={profile.postRetirementReturn} onChange={(v) => setProfile({ postRetirementReturn: v })} min={4} max={12} step={0.5} slider suffix="%" hint="Return on your corpus during retirement." />
              <NumberField label="Life expectancy" value={profile.lifeExpectancy} onChange={(v) => setProfile({ lifeExpectancy: v })} min={70} max={100} slider suffix="yrs" />
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-7 flex items-center justify-between">
          <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
            {step === 0 ? "Cancel" : <><ArrowLeft className="h-4 w-4" /> Back</>}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish}>
              <Rocket className="h-4 w-4" /> See my plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export { PERSONA_PRESETS };
