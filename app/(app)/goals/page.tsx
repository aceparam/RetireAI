"use client";

import * as React from "react";
import { Target, Plus, Trash2, GraduationCap, Heart, Home, Plane, ShieldCheck, Car, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge, Progress } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { ComparisonBarChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import { CURRENT_YEAR, futureValue, sipFactor } from "@/lib/finance";
import { Goal } from "@/lib/types";
import { formatINR } from "@/lib/format";

const GOAL_TYPES = [
  { value: "education", label: "Child Education", icon: GraduationCap },
  { value: "marriage", label: "Marriage", icon: Heart },
  { value: "house", label: "House Purchase", icon: Home },
  { value: "travel", label: "International Travel", icon: Plane },
  { value: "emergency", label: "Emergency Fund", icon: ShieldCheck },
  { value: "vehicle", label: "Vehicle", icon: Car },
  { value: "other", label: "Other", icon: Gift },
] as const;

function goalIcon(type: Goal["type"]) {
  return GOAL_TYPES.find((g) => g.value === type)?.icon ?? Gift;
}

export default function GoalsPage() {
  const { profile } = useResults();
  const { addGoal, updateGoal, removeGoal } = usePlanner();

  const computed = profile.goals.map((g) => {
    const years = Math.max(0, g.targetYear - CURRENT_YEAR);
    const futureTarget = g.inflateToTarget ? futureValue(g.targetAmount, profile.inflation, years) : g.targetAmount;
    const fvOfSaved = futureValue(g.currentSaved, profile.preRetirementReturn, years);
    const gap = Math.max(0, futureTarget - fvOfSaved);
    const factor = sipFactor(profile.preRetirementReturn, Math.max(1, years));
    const monthlySip = factor > 0 ? gap / factor : 0;
    const progress = futureTarget > 0 ? Math.min(100, (fvOfSaved / futureTarget) * 100) : 0;
    return { goal: g, years, futureTarget, fvOfSaved, gap, monthlySip, progress };
  });

  const totalFutureCost = computed.reduce((s, c) => s + c.futureTarget, 0);
  const totalMonthlySip = computed.reduce((s, c) => s + c.monthlySip, 0);
  const totalGap = computed.reduce((s, c) => s + c.gap, 0);

  // Impact on retirement: monthly goal SIPs compete with retirement SIP.
  const retirementImpact = totalMonthlySip;
  const impactPct = profile.monthlyInvestment > 0 ? (retirementImpact / (profile.monthlyInvestment + retirementImpact)) * 100 : 0;

  const chartData = computed.map((c) => ({
    name: c.goal.name.length > 12 ? c.goal.name.slice(0, 11) + "…" : c.goal.name,
    Target: Math.round(c.futureTarget),
    Saved: Math.round(c.fvOfSaved),
  }));

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Goal-Based Planning"
        description="Plan life's big expenses — education, marriage, a home — and see how they impact your retirement savings."
        icon={<Target className="h-5 w-5" />}
        action={
          <Button size="sm" onClick={() => addGoal({ name: "New Goal", type: "other", targetAmount: 1000000, targetYear: CURRENT_YEAR + 5, currentSaved: 0, priority: "medium", inflateToTarget: true })}>
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Goals" value={profile.goals.length} sub="active" />
        <Stat label="Future Cost" value={formatINR(totalFutureCost)} tone="primary" sub="inflation-adjusted" />
        <Stat label="Funding Gap" value={formatINR(totalGap)} tone={totalGap > 0 ? "warning" : "success"} />
        <Stat label="Monthly SIP Needed" value={formatINR(totalMonthlySip)} sub="for all goals" />
      </div>

      {profile.goals.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-semibold">Impact on retirement</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Funding these goals needs ~{formatINR(retirementImpact)}/month. That's {impactPct.toFixed(0)}% of your total investable surplus competing with retirement.
              </p>
            </div>
            <Badge tone={impactPct > 50 ? "danger" : impactPct > 30 ? "warning" : "success"}>
              {impactPct.toFixed(0)}% of investments
            </Badge>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Target vs Projected Savings</CardTitle>
            <CardDescription>Future value of current savings against each goal's inflated target</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonBarChart
              data={chartData}
              bars={[
                { key: "Target", name: "Target (future)", color: "#f59e0b" },
                { key: "Saved", name: "Projected saved", color: "#22c55e" },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {computed.map(({ goal: g, years, futureTarget, gap, monthlySip, progress }) => {
          const Icon = goalIcon(g.type);
          return (
            <Card key={g.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <Input className="h-8 border-0 bg-transparent px-0 text-base font-semibold focus-visible:ring-0" value={g.name} onChange={(e) => updateGoal(g.id, { name: e.target.value })} />
                      <p className="text-xs text-muted-foreground">{years} years away · {g.targetYear}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(g.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} tone={progress >= 75 ? "success" : progress >= 40 ? "warning" : "danger"} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Future cost</p>
                    <p className="font-semibold">{formatINR(futureTarget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly SIP needed</p>
                    <p className="font-semibold text-primary">{formatINR(monthlySip)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Target today (₹)</Label>
                    <Input inputMode="numeric" value={g.targetAmount} onChange={(e) => updateGoal(g.id, { targetAmount: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target year</Label>
                    <Input inputMode="numeric" value={g.targetYear} onChange={(e) => updateGoal(g.id, { targetYear: parseInt(e.target.value.replace(/[^0-9]/g, "")) || CURRENT_YEAR })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Already saved (₹)</Label>
                    <Input inputMode="numeric" value={g.currentSaved} onChange={(e) => updateGoal(g.id, { currentSaved: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={g.type} onChange={(e) => updateGoal(g.id, { type: e.target.value as Goal["type"] })}>
                      {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                </div>
                {gap > 0 && <p className="text-xs text-muted-foreground">Funding gap of {formatINR(gap)} — invest {formatINR(monthlySip)}/month to close it.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {profile.goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>No goals yet. Add your first life goal to see its impact on retirement.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
