"use client";

import * as React from "react";
import { PieChart, Plus, Trash2, ShieldAlert, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge, Progress } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { AllocationPieChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import {
  ASSET_CLASS_LIST,
  ASSET_CLASSES,
  allocationByClass,
  blendedReturn,
  blendedVolatility,
  equityAllocationPct,
  totalAssets,
  totalLiabilities,
  clamp,
} from "@/lib/finance";
import { AssetClass } from "@/lib/types";
import { formatINR, formatPercent } from "@/lib/format";

const LIABILITY_TYPES = [
  { value: "homeLoan", label: "Home Loan" },
  { value: "personalLoan", label: "Personal Loan" },
  { value: "creditCard", label: "Credit Card" },
  { value: "carLoan", label: "Car Loan" },
  { value: "educationLoan", label: "Education Loan" },
  { value: "other", label: "Other" },
] as const;

export default function PortfolioPage() {
  const { profile } = useResults();
  const { addAsset, updateAsset, removeAsset, addLiability, updateLiability, removeLiability } = usePlanner();

  const allocation = allocationByClass(profile.assets);
  const assets = totalAssets(profile.assets);
  const liabilities = totalLiabilities(profile.liabilities);
  const expReturn = blendedReturn(profile.assets);
  const vol = blendedVolatility(profile.assets);
  const equity = equityAllocationPct(profile.assets);

  // Risk score: balance of growth vs volatility, age-appropriateness
  const targetEquity = clamp(100 - profile.currentAge, 20, 90);
  const diversification = Math.min(100, allocation.length * 14 + (allocation.length >= 5 ? 15 : 0));
  const allocFit = clamp(100 - Math.abs(equity - targetEquity) * 1.5, 0, 100);
  const riskScore = Math.round(diversification * 0.4 + allocFit * 0.6);
  const concentration = allocation[0]?.pct ?? 0;

  const insights = buildInsights({ equity, targetEquity, concentration, diversification, allocCount: allocation.length });

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Portfolio Analyzer"
        description="Review your asset allocation, diversification, expected return and risk — with recommendations for retirement suitability."
        icon={<PieChart className="h-5 w-5" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Assets" value={formatINR(assets)} tone="success" />
        <Stat label="Expected Return" value={formatPercent(expReturn)} tone="primary" sub="blended, nominal" />
        <Stat label="Portfolio Volatility" value={formatPercent(vol)} sub="annual std-dev" tone={vol > 18 ? "warning" : "default"} />
        <Stat label="Equity Exposure" value={formatPercent(equity, 0)} sub={`age-target ≈ ${targetEquity}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Across {allocation.length} asset classes</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationPieChart data={allocation} />
            <div className="mt-4 space-y-2">
              {allocation.map((a) => (
                <div key={a.class} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                    {a.label}
                  </span>
                  <span className="text-muted-foreground">{formatINR(a.value)} · {a.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Risk & Quality</CardTitle>
            <CardDescription>Retirement suitability score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-secondary/60 p-4 text-center">
              <p className="text-4xl font-bold">{riskScore}<span className="text-lg text-muted-foreground">/100</span></p>
              <Badge tone={riskScore >= 70 ? "success" : riskScore >= 45 ? "warning" : "danger"} className="mt-2">
                {riskScore >= 70 ? "Well-balanced" : riskScore >= 45 ? "Needs tuning" : "Reconsider"}
              </Badge>
            </div>
            <Metric label="Diversification" value={diversification} />
            <Metric label="Allocation fit (age)" value={allocFit} />
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Concentration (largest holding)</span>
                <span className="font-medium">{concentration.toFixed(0)}%</span>
              </div>
              <Progress value={concentration} tone={concentration > 50 ? "danger" : concentration > 35 ? "warning" : "success"} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-warning" /> Recommendations</CardTitle>
            <CardDescription>Improve retirement readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((i, idx) => (
              <div key={idx} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{i.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{i.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Asset editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>Your holdings across all asset classes</CardDescription>
            </div>
            <Button size="sm" onClick={() => addAsset({ name: "New Asset", class: "equityMF", value: 100000 })}>
              <Plus className="h-4 w-4" /> Add asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.assets.map((a) => (
              <div key={a.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_140px_110px_auto] lg:items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={a.name} onChange={(e) => updateAsset(a.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Select
                    value={a.class}
                    onChange={(e) => {
                      const cls = e.target.value as AssetClass;
                      updateAsset(a.id, { class: cls, expectedReturn: ASSET_CLASSES[cls].defaultReturn });
                    }}
                  >
                    {ASSET_CLASS_LIST.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value (₹)</Label>
                  <Input inputMode="numeric" value={a.value} onChange={(e) => updateAsset(a.id, { value: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Return %</Label>
                  <Input
                    inputMode="numeric"
                    value={a.expectedReturn ?? ASSET_CLASSES[a.class].defaultReturn}
                    onChange={(e) => updateAsset(a.id, { expectedReturn: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAsset(a.id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liability editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liabilities</CardTitle>
              <CardDescription>Total debt: {formatINR(liabilities)}</CardDescription>
            </div>
            <Button size="sm" onClick={() => addLiability({ name: "New Loan", type: "personalLoan", balance: 100000, interestRate: 11, emi: 5000 })}>
              <Plus className="h-4 w-4" /> Add liability
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.liabilities.length === 0 ? (
            <p className="rounded-xl bg-success/10 px-4 py-6 text-center text-sm text-success">You're debt-free! 🎉</p>
          ) : (
            <div className="space-y-3">
              {profile.liabilities.map((l) => (
                <div key={l.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_130px_110px_110px_auto] lg:items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={l.name} onChange={(e) => updateLiability(l.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={l.type} onChange={(e) => updateLiability(l.id, { type: e.target.value as any })}>
                      {LIABILITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Balance (₹)</Label>
                    <Input inputMode="numeric" value={l.balance} onChange={(e) => updateLiability(l.id, { balance: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rate %</Label>
                    <Input inputMode="numeric" value={l.interestRate} onChange={(e) => updateLiability(l.id, { interestRate: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">EMI (₹)</Label>
                    <Input inputMode="numeric" value={l.emi} onChange={(e) => updateLiability(l.id, { emi: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLiability(l.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const tone = value >= 70 ? "success" : value >= 45 ? "warning" : "danger";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(0)}/100</span>
      </div>
      <Progress value={value} tone={tone} className="h-1.5" />
    </div>
  );
}

function buildInsights({
  equity,
  targetEquity,
  concentration,
  diversification,
  allocCount,
}: {
  equity: number;
  targetEquity: number;
  concentration: number;
  diversification: number;
  allocCount: number;
}) {
  const out: { title: string; detail: string }[] = [];
  if (equity > targetEquity + 15) {
    out.push({ title: "Reduce equity exposure", detail: `Equity at ${equity.toFixed(0)}% exceeds the age-based target of ~${targetEquity}%. Consider trimming toward debt as you near retirement.` });
  } else if (equity < targetEquity - 15) {
    out.push({ title: "Increase growth assets", detail: `Equity at ${equity.toFixed(0)}% is below your ~${targetEquity}% target. More equity can help outpace inflation over the long run.` });
  } else {
    out.push({ title: "Equity allocation looks healthy", detail: `Your ${equity.toFixed(0)}% equity is close to the age-appropriate target.` });
  }
  if (concentration > 45) {
    out.push({ title: "High concentration risk", detail: `Your largest asset class is ${concentration.toFixed(0)}% of the portfolio. Spread risk across more classes.` });
  }
  if (allocCount < 4) {
    out.push({ title: "Diversify further", detail: "Holding fewer than 4 asset classes raises risk. Consider adding bonds, gold or international exposure." });
  }
  if (diversification >= 70 && concentration <= 40) {
    out.push({ title: "Well-diversified", detail: "Good spread across asset classes reduces single-point risk." });
  }
  return out.slice(0, 4);
}
