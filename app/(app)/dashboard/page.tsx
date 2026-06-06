"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge, Progress } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AllocationPieChart, MultiLineChart, ScoreGauge } from "@/components/charts";
import { useResults } from "@/lib/use-results";
import {
  netWorth,
  totalAssets,
  totalLiabilities,
  allocationByClass,
  readinessBreakdown,
  scoreBand,
  CURRENT_YEAR,
} from "@/lib/finance";
import { generateRecommendations } from "@/lib/recommendations";
import { formatINR } from "@/lib/format";

export default function DashboardPage() {
  const { profile, result } = useResults();

  const assets = totalAssets(profile.assets);
  const liabilities = totalLiabilities(profile.liabilities);
  const nw = netWorth(profile.assets, profile.liabilities);
  const allocation = allocationByClass(profile.assets);
  const breakdown = readinessBreakdown(profile, result.projectedCorpus, result.requiredCorpus);
  const band = scoreBand(result.readinessScore);
  const recs = generateRecommendations(profile, result).slice(0, 3);

  // Synthesize a plausible 12-month net-worth trend (deterministic).
  const trend = React.useMemo(() => {
    const months = 12;
    const monthlyGrowth = 0.9; // %
    const data: { age: string; "Net Worth": number; Assets: number }[] = [];
    for (let i = months; i >= 0; i--) {
      const factor = Math.pow(1 + monthlyGrowth / 100, -i);
      const noise = 1 + Math.sin(i * 1.3) * 0.012;
      data.push({
        age: monthLabel(i),
        "Net Worth": Math.round(nw * factor * noise),
        Assets: Math.round(assets * factor * noise),
      });
    }
    return data;
  }, [nw, assets]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title={profile.name ? `Welcome back, ${profile.name}` : "Financial Health Dashboard"}
        description="Your complete retirement picture — net worth, readiness, and what to do next."
        icon={<Activity className="h-5 w-5" />}
        action={
          <Link href="/calculator">
            <Button>Open Calculator <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Net Worth"
          value={formatINR(nw)}
          sub={
            <span className="flex items-center gap-1 text-success">
              <ArrowUpRight className="h-3.5 w-3.5" /> Assets {formatINR(assets)}
            </span>
          }
          icon={<Wallet className="h-4 w-4" />}
        />
        <Stat
          label="Projected Corpus"
          value={formatINR(result.projectedCorpus)}
          sub={`at age ${profile.retirementAge}`}
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Stat
          label="Readiness Score"
          value={`${result.readinessScore}`}
          sub={<Badge tone={band.tone}>{band.label}</Badge>}
          tone={band.tone}
          icon={<Target className="h-4 w-4" />}
        />
        <Stat
          label="Success Probability"
          value={`${result.successProbability}%`}
          sub={result.surplus >= 0 ? "On track for goals" : `Shortfall ${formatINR(Math.abs(result.surplus))}`}
          tone={result.successProbability >= 75 ? "success" : result.successProbability >= 50 ? "warning" : "danger"}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Net worth trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
            <CardDescription>Last 12 months · {CURRENT_YEAR}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={trend}
              xKey="age"
              xLabel=""
              lines={[
                { key: "Net Worth", name: "Net Worth", color: "#6366f1" },
                { key: "Assets", name: "Total Assets", color: "#22c55e" },
              ]}
            />
          </CardContent>
        </Card>

        {/* Readiness gauge */}
        <Card>
          <CardHeader>
            <CardTitle>Retirement Readiness</CardTitle>
            <CardDescription>Score out of 100</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={result.readinessScore} />
            <div className="mt-4 w-full space-y-2.5 text-sm">
              <ScoreRow label="Corpus adequacy" value={breakdown.corpusAdequacy} max={40} />
              <ScoreRow label="Savings rate" value={breakdown.savingsRate} max={20} />
              <ScoreRow label="Emergency fund" value={breakdown.emergencyFund} max={15} />
              <ScoreRow label="Debt burden" value={breakdown.debtBurden} max={15} />
              <ScoreRow label="Asset allocation" value={breakdown.assetAllocation} max={10} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>{formatINR(assets)} across {allocation.length} classes</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationPieChart data={allocation} />
            <div className="mt-4 space-y-2">
              {allocation.slice(0, 5).map((a) => (
                <div key={a.class} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                    {a.label}
                  </span>
                  <span className="font-medium text-muted-foreground">{a.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assets & liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Assets & Liabilities</CardTitle>
            <CardDescription>Balance sheet snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Total Assets</span>
                <span className="font-semibold text-success">{formatINR(assets)}</span>
              </div>
              <Progress value={100} tone="success" />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Total Liabilities</span>
                <span className="font-semibold text-danger">{formatINR(liabilities)}</span>
              </div>
              <Progress value={assets > 0 ? (liabilities / assets) * 100 : 0} tone="danger" />
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">Net Worth</p>
              <p className="mt-1 text-2xl font-bold">{formatINR(nw)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {liabilities > 0 ? (
                  <><ArrowDownRight className="h-3.5 w-3.5 text-danger" /> {((liabilities / assets) * 100).toFixed(0)}% leverage</>
                ) : (
                  <><ArrowUpRight className="h-3.5 w-3.5 text-success" /> Debt-free</>
                )}
              </p>
            </div>
            <Link href="/portfolio" className="block">
              <Button variant="outline" className="w-full">Manage portfolio <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>

        {/* Top recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" /> Top Actions
            </CardTitle>
            <CardDescription>Prioritized by impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.length === 0 && (
              <p className="text-sm text-muted-foreground">You're in great shape — no urgent actions. 🎉</p>
            )}
            {recs.map((r, i) => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-snug">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.impact}</p>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/coach" className="block">
              <Button variant="secondary" className="w-full">Get full action plan <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const tone = pct >= 70 ? "success" : pct >= 40 ? "warning" : "danger";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(0)}/{max}</span>
      </div>
      <Progress value={pct} tone={tone} className="h-1.5" />
    </div>
  );
}

function monthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleString("en-IN", { month: "short" });
}
