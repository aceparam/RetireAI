"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge, Progress } from "@/components/ui/misc";
import { NumberField } from "@/components/ui/field";
import { MultiLineChart, ComparisonBarChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import { computeFire, fireProgressPath, FIRE_MULTIPLIERS, FireType } from "@/lib/fire";
import { formatINR, formatYears } from "@/lib/format";

export default function FirePage() {
  const { profile } = useResults();
  const { setProfile } = usePlanner();
  const [swr, setSwr] = React.useState(4);
  const [type, setType] = React.useState<FireType>("regular");

  const fireResults = React.useMemo(
    () => (["lean", "regular", "fat"] as FireType[]).map((t) => computeFire(profile, t, swr)),
    [profile, swr],
  );
  const selected = fireResults.find((f) => f.type === type)!;
  const path = React.useMemo(() => fireProgressPath(profile, selected.fireNumber), [profile, selected.fireNumber]);

  const compareData = fireResults.map((f) => ({
    name: FIRE_MULTIPLIERS[f.type].label,
    "FIRE Number": Math.round(f.fireNumber),
    "Current Corpus": Math.round(f.currentCorpus),
  }));

  return (
    <div className="space-y-6">
      <SectionHeading
        title="FIRE Calculator"
        description="Financial Independence, Retire Early. Compare Lean, Regular & Fat FIRE and see how many years until you're free."
        icon={<Flame className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
            <CardDescription>Safe withdrawal rate & savings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <NumberField label="Annual expenses (today)" value={profile.annualExpenses} onChange={(v) => setProfile({ annualExpenses: v })} prefix="₹" format="inr" />
            <NumberField label="Monthly investment" value={profile.monthlyInvestment} onChange={(v) => setProfile({ monthlyInvestment: v })} prefix="₹" format="inr" />
            <NumberField label="Safe withdrawal rate" value={swr} onChange={setSwr} min={2.5} max={6} step={0.25} slider suffix="%" hint="4% is the classic 'Trinity study' rule." />
            <NumberField label="Expected return" value={profile.preRetirementReturn} onChange={(v) => setProfile({ preRetirementReturn: v })} min={6} max={16} step={0.5} slider suffix="%" />
            <NumberField label="SIP step-up" value={profile.sipStepUp} onChange={(v) => setProfile({ sipStepUp: v })} min={0} max={20} slider suffix="%" />

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">FIRE Type</p>
              <div className="grid grid-cols-3 gap-2">
                {(["lean", "regular", "fat"] as FireType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-xl border p-2 text-xs font-medium transition-all ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                  >
                    {FIRE_MULTIPLIERS[t].label.replace(" FIRE", "")}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{FIRE_MULTIPLIERS[type].description}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="FIRE Number" value={formatINR(selected.fireNumber)} tone="primary" sub={`${FIRE_MULTIPLIERS[type].label}`} />
            <Stat label="Years to FI" value={formatYears(selected.yearsToFire)} sub={selected.yearsToFire === Infinity ? "increase savings" : "at current pace"} tone={selected.yearsToFire <= 15 ? "success" : "warning"} />
            <Stat label="Required Monthly Savings" value={formatINR(selected.requiredMonthlySavings)} sub={`to FIRE by age ${profile.retirementAge}`} />
            <Stat label="Progress" value={`${selected.progressPercent.toFixed(0)}%`} sub="of FIRE number" tone={selected.progressPercent >= 50 ? "success" : "default"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progress to {FIRE_MULTIPLIERS[type].label}</CardTitle>
              <CardDescription>{formatINR(selected.currentCorpus)} of {formatINR(selected.fireNumber)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={selected.progressPercent} tone={selected.progressPercent >= 75 ? "success" : "primary"} className="h-3" />
              <div className="mt-6">
                <MultiLineChart
                  data={path}
                  lines={[
                    { key: "corpus", name: "Projected Corpus", color: "#6366f1" },
                    { key: "target", name: "FIRE Number", color: "#f59e0b" },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lean vs Regular vs Fat FIRE</CardTitle>
              <CardDescription>How lifestyle changes your target</CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonBarChart
                data={compareData}
                bars={[
                  { key: "FIRE Number", name: "FIRE Number", color: "#6366f1" },
                  { key: "Current Corpus", name: "Current Corpus", color: "#22c55e" },
                ]}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {fireResults.map((f) => (
                  <div key={f.type} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: FIRE_MULTIPLIERS[f.type].color }}>
                        {FIRE_MULTIPLIERS[f.type].label}
                      </span>
                      <Badge tone={f.yearsToFire <= 15 ? "success" : "warning"}>{formatYears(f.yearsToFire)}</Badge>
                    </div>
                    <p className="mt-2 text-lg font-bold">{formatINR(f.fireNumber)}</p>
                    <p className="text-xs text-muted-foreground">{formatINR(f.annualSpending)}/yr spend</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
