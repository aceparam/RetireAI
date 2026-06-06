"use client";

import * as React from "react";
import { Calculator, TrendingDown, Sparkles, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GrowthAreaChart, DrawdownChart } from "@/components/charts";
import { useResults } from "@/lib/use-results";
import { usePlanner } from "@/lib/store";
import { scoreBand } from "@/lib/finance";
import { formatINR, formatYears, formatPercent } from "@/lib/format";

export default function CalculatorPage() {
  const { profile, result } = useResults();
  const { setProfile, loadPersona, saveScenario } = usePlanner();
  const [tab, setTab] = React.useState("growth");
  const band = scoreBand(result.readinessScore);
  const onTrack = result.surplus >= 0;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Retirement Calculator"
        description="Adjust any input and watch your projection update instantly. When can you retire, and how much will you need?"
        icon={<Calculator className="h-5 w-5" />}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => loadPersona(profile.persona === "custom" ? "midCareer" : profile.persona)}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={() => saveScenario(`Snapshot @ ${new Date().toLocaleDateString("en-IN")}`)}>
              <Save className="h-4 w-4" /> Save scenario
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Inputs */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Your Inputs</CardTitle>
            <CardDescription>Everything recalculates live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Current age" value={profile.currentAge} onChange={(v) => setProfile({ currentAge: v })} min={18} max={70} slider suffix="yr" />
              <NumberField label="Retire at" value={profile.retirementAge} onChange={(v) => setProfile({ retirementAge: v })} min={40} max={75} slider suffix="yr" />
            </div>
            <NumberField label="Life expectancy" value={profile.lifeExpectancy} onChange={(v) => setProfile({ lifeExpectancy: v })} min={70} max={100} slider suffix="yr" />
            <NumberField label="Annual expenses (today)" value={profile.annualExpenses} onChange={(v) => setProfile({ annualExpenses: v })} prefix="₹" format="inr" />
            <NumberField label="Monthly investment" value={profile.monthlyInvestment} onChange={(v) => setProfile({ monthlyInvestment: v })} prefix="₹" format="inr" />
            <NumberField label="Annual SIP step-up" value={profile.sipStepUp} onChange={(v) => setProfile({ sipStepUp: v })} min={0} max={20} step={1} slider suffix="%" hint="Increase SIP each year with your salary." />

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assumptions</p>
              <div className="space-y-4">
                <NumberField label="Inflation" value={profile.inflation} onChange={(v) => setProfile({ inflation: v })} min={3} max={12} step={0.5} slider suffix="%" />
                <NumberField label="Pre-retirement return" value={profile.preRetirementReturn} onChange={(v) => setProfile({ preRetirementReturn: v })} min={5} max={16} step={0.5} slider suffix="%" />
                <NumberField label="Post-retirement return" value={profile.postRetirementReturn} onChange={(v) => setProfile({ postRetirementReturn: v })} min={4} max={12} step={0.5} slider suffix="%" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outputs */}
        <div className="space-y-6">
          {/* Headline verdict */}
          <Card className={onTrack ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <p className="text-sm text-muted-foreground">Verdict</p>
                <p className="mt-1 text-2xl font-bold">
                  {onTrack ? (
                    <span className="text-success">You're on track to retire at {profile.retirementAge} 🎉</span>
                  ) : (
                    <span className="text-warning">Shortfall of {formatINR(Math.abs(result.surplus))}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatYears(result.yearsToRetire)} to retirement · {result.yearsInRetirement} years in retirement
                </p>
              </div>
              <div className="text-right">
                <Badge tone={band.tone}>{band.label} · {result.readinessScore}/100</Badge>
                <p className="mt-2 text-sm text-muted-foreground">Success: {formatPercent(result.successProbability, 0)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key numbers */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Required Corpus" value={formatINR(result.requiredCorpus)} sub={`at age ${profile.retirementAge}`} tone="primary" />
            <Stat label="Projected Corpus" value={formatINR(result.projectedCorpus)} sub="from current plan" />
            <Stat
              label={onTrack ? "Surplus" : "Shortfall"}
              value={formatINR(Math.abs(result.surplus))}
              tone={onTrack ? "success" : "danger"}
            />
            <Stat label="Expense at Retirement" value={formatINR(result.expenseAtRetirement)} sub="per year (inflated)" />
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Projection</CardTitle>
                    <CardDescription>Corpus growth & retirement drawdown</CardDescription>
                  </div>
                  <TabsList>
                    <TabsTrigger value="growth">Accumulation</TabsTrigger>
                    <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsContent value="growth">
                  <GrowthAreaChart data={result.projection} />
                </TabsContent>
                <TabsContent value="drawdown">
                  {result.depletionAge && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                      <TrendingDown className="h-4 w-4" />
                      Corpus is projected to deplete around age {result.depletionAge} (before life expectancy {profile.lifeExpectancy}).
                    </div>
                  )}
                  <DrawdownChart data={result.drawdown} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Fix-it nudge */}
          {!onTrack && result.additionalMonthlySip > 0 && (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Close the gap</p>
                    <p className="text-sm text-muted-foreground">
                      Increase your monthly SIP by about {formatINR(result.additionalMonthlySip)} to fully fund retirement.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setProfile({ monthlyInvestment: Math.round((profile.monthlyInvestment + result.additionalMonthlySip) / 500) * 500 })}>
                  Apply +{formatINR(result.additionalMonthlySip)}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
