"use client";

import * as React from "react";
import { GitCompareArrows, Trash2, FolderOpen, Download, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeading, Badge, Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/field";
import { MultiLineChart, ComparisonBarChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import { projectRetirement, scoreBand } from "@/lib/finance";
import { formatINR } from "@/lib/format";
import { ProfileInputs } from "@/lib/types";

export default function ScenariosPage() {
  const { profile } = useResults();
  const { scenarios, loadScenario, deleteScenario, setProfile } = usePlanner();

  const [ages, setAges] = React.useState<[number, number, number]>([
    Math.max(profile.currentAge + 1, 55),
    60,
    65,
  ]);

  // What-if overlays applied to all three scenarios
  const [whatIf, setWhatIf] = React.useState({ inflationDelta: 0, returnDelta: 0, sipDelta: 0 });

  const scenarioResults = React.useMemo(() => {
    return ages.map((age, idx) => {
      const p: ProfileInputs = {
        ...profile,
        retirementAge: age,
        inflation: profile.inflation + whatIf.inflationDelta,
        preRetirementReturn: profile.preRetirementReturn + whatIf.returnDelta,
        monthlyInvestment: Math.max(0, profile.monthlyInvestment + whatIf.sipDelta),
      };
      const r = projectRetirement(p);
      return { label: `Retire @ ${age}`, age, result: r, color: ["#6366f1", "#22c55e", "#f59e0b"][idx] };
    });
  }, [profile, ages, whatIf]);

  const barData = scenarioResults.map((s) => ({
    name: s.label,
    "Projected Corpus": Math.round(s.result.projectedCorpus),
    "Required Corpus": Math.round(s.result.requiredCorpus),
  }));

  // Net worth trajectory overlay
  const maxLen = Math.max(...scenarioResults.map((s) => s.result.projection.length));
  const trajectory = Array.from({ length: maxLen }, (_, i) => {
    const row: any = { age: profile.currentAge + i };
    scenarioResults.forEach((s) => {
      row[s.label] = s.result.projection[i]?.corpus ?? null;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Scenario Comparison"
        description="Compare retirement strategies side by side, then stress-test them with what-if levers."
        icon={<GitCompareArrows className="h-5 w-5" />}
        action={
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        }
      />

      {/* Scenario ages */}
      <Card>
        <CardHeader>
          <CardTitle>Retirement Age Scenarios</CardTitle>
          <CardDescription>Adjust each scenario's retirement age</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {ages.map((age, i) => (
              <NumberField
                key={i}
                label={`Scenario ${String.fromCharCode(65 + i)}`}
                value={age}
                onChange={(v) => setAges((prev) => prev.map((a, idx) => (idx === i ? v : a)) as [number, number, number])}
                min={Math.max(profile.currentAge + 1, 45)}
                max={75}
                slider
                suffix="yrs"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      <div className="grid gap-4 md:grid-cols-3">
        {scenarioResults.map((s) => {
          const band = scoreBand(s.result.readinessScore);
          const onTrack = s.result.surplus >= 0;
          return (
            <Card key={s.label} className="overflow-hidden">
              <div className="h-1.5" style={{ background: s.color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{s.label}</CardTitle>
                  <Badge tone={band.tone}>{s.result.readinessScore}/100</Badge>
                </div>
                <CardDescription>{s.result.yearsToRetire} yrs to retire · {s.result.yearsInRetirement} yrs in retirement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <CompareRow label="Projected corpus" value={formatINR(s.result.projectedCorpus)} bold />
                <CompareRow label="Required corpus" value={formatINR(s.result.requiredCorpus)} />
                <CompareRow label={onTrack ? "Surplus" : "Shortfall"} value={formatINR(Math.abs(s.result.surplus))} tone={onTrack ? "success" : "danger"} />
                <CompareRow label="Monthly income" value={formatINR(s.result.expenseAtRetirement / 12)} />
                <CompareRow label="Success rate" value={`${s.result.successProbability}%`} tone={s.result.successProbability >= 75 ? "success" : s.result.successProbability >= 50 ? "warning" : "danger"} />
                <Button variant="outline" size="sm" className="w-full" onClick={() => setProfile({ retirementAge: s.age })}>
                  Use this age
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What-if */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /> What-If Analysis</CardTitle>
          <CardDescription>Apply shocks to all scenarios above instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label="Inflation shift" value={whatIf.inflationDelta} onChange={(v) => setWhatIf((w) => ({ ...w, inflationDelta: v }))} min={-3} max={6} step={0.5} slider suffix="%" hint={`Effective: ${(profile.inflation + whatIf.inflationDelta).toFixed(1)}%`} />
            <NumberField label="Return shift" value={whatIf.returnDelta} onChange={(v) => setWhatIf((w) => ({ ...w, returnDelta: v }))} min={-5} max={4} step={0.5} slider suffix="%" hint={`Effective: ${(profile.preRetirementReturn + whatIf.returnDelta).toFixed(1)}%`} />
            <NumberField label="Extra monthly SIP" value={whatIf.sipDelta} onChange={(v) => setWhatIf((w) => ({ ...w, sipDelta: v }))} min={-20000} max={100000} step={5000} slider prefix="₹" hint={`Effective: ${formatINR(profile.monthlyInvestment + whatIf.sipDelta)}`} />
          </div>
          {(whatIf.inflationDelta || whatIf.returnDelta || whatIf.sipDelta) !== 0 && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setWhatIf({ inflationDelta: 0, returnDelta: 0, sipDelta: 0 })}>
              Reset what-if
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Corpus at Retirement</CardTitle>
            <CardDescription>Projected vs required across scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart
              data={barData}
              bars={[
                { key: "Projected Corpus", name: "Projected", color: "#6366f1" },
                { key: "Required Corpus", name: "Required", color: "#f59e0b" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trajectory</CardTitle>
            <CardDescription>Corpus growth path per scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={trajectory}
              lines={scenarioResults.map((s) => ({ key: s.label, name: s.label, color: s.color }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Saved scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Saved Scenarios</CardTitle>
          <CardDescription>Snapshots you saved from the calculator</CardDescription>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <p className="rounded-xl bg-secondary/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No saved scenarios yet. Use “Save scenario” on the Calculator to snapshot your plan.
            </p>
          ) : (
            <div className="space-y-2">
              {scenarios.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{sc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Retire @ {sc.profile.retirementAge} · SIP {formatINR(sc.profile.monthlyInvestment)} · saved {new Date(sc.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => loadScenario(sc.id)}>Load</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteScenario(sc.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompareRow({ label, value, tone, bold }: { label: string; value: string; tone?: "success" | "danger" | "warning"; bold?: boolean }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "text-base font-bold" : "font-medium"} ${toneClass}`}>{value}</span>
    </div>
  );
}
