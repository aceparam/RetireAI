"use client";

import * as React from "react";
import { Receipt, TrendingDown, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge } from "@/components/ui/misc";
import { NumberField } from "@/components/ui/field";
import { ComparisonBarChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import { compareRegimes, computeTax, taxSavingTips, equityLTCG } from "@/lib/tax";
import { formatINR, formatPercent } from "@/lib/format";

export default function TaxPage() {
  const { profile } = useResults();
  const { setProfile } = usePlanner();

  const [section80D, setSection80D] = React.useState(25000);
  const [homeLoanInterest, setHomeLoanInterest] = React.useState(
    profile.liabilities.find((l) => l.type === "homeLoan") ? 200000 : 0,
  );
  const [ltcg, setLtcg] = React.useState(150000);

  const baseInput = {
    grossIncome: profile.annualIncome,
    section80C: profile.section80C,
    section80D,
    npsContribution: profile.npsContribution,
    homeLoanInterest,
    otherDeductions: 0,
  };

  const comparison = compareRegimes(baseInput);
  const chosen = computeTax({ ...baseInput, regime: profile.taxRegime });
  const tips = taxSavingTips({ ...baseInput, regime: profile.taxRegime });
  const ltcgTax = equityLTCG(ltcg);

  const chartData = [
    { name: "Old Regime", "Tax Payable": Math.round(comparison.old.totalTax), "Take Home": Math.round(comparison.old.takeHome) },
    { name: "New Regime", "Tax Payable": Math.round(comparison.new.totalTax), "Take Home": Math.round(comparison.new.takeHome) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Tax Optimization (India)"
        description="Compare the Old and New regimes, maximize 80C & NPS deductions, and estimate capital-gains tax. FY 2025-26."
        icon={<Receipt className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Your Income & Deductions</CardTitle>
            <CardDescription>Annual figures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <NumberField label="Gross annual income" value={profile.annualIncome} onChange={(v) => setProfile({ annualIncome: v })} prefix="₹" format="inr" />
            <div className="space-y-1.5">
              <Label2>Tax regime</Label2>
              <div className="grid grid-cols-2 gap-2">
                {(["old", "new"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setProfile({ taxRegime: r })}
                    className={`rounded-xl border p-2.5 text-sm font-medium capitalize transition-all ${profile.taxRegime === r ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
                  >
                    {r} Regime
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deductions (Old regime)</p>
              <div className="space-y-4">
                <NumberField label="80C (max ₹1.5L)" value={profile.section80C} onChange={(v) => setProfile({ section80C: v })} prefix="₹" format="inr" />
                <NumberField label="NPS 80CCD(1B) (max ₹50K)" value={profile.npsContribution} onChange={(v) => setProfile({ npsContribution: v })} prefix="₹" format="inr" />
                <NumberField label="80D Health insurance" value={section80D} onChange={setSection80D} prefix="₹" format="inr" />
                <NumberField label="Home loan interest 24(b)" value={homeLoanInterest} onChange={setHomeLoanInterest} prefix="₹" format="inr" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Tax Payable" value={formatINR(chosen.totalTax)} tone="danger" sub={`${profile.taxRegime} regime`} />
            <Stat label="Take Home" value={formatINR(chosen.takeHome)} tone="success" />
            <Stat label="Effective Rate" value={formatPercent(chosen.effectiveRate)} />
            <Stat label="Total Deductions" value={formatINR(chosen.totalDeductions)} tone="primary" />
          </div>

          {/* Regime recommendation */}
          <Card className={comparison.better === profile.taxRegime ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex items-start gap-3">
                <TrendingDown className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    The <span className="capitalize">{comparison.better}</span> regime is better for you
                  </p>
                  <p className="text-sm text-muted-foreground">
                    It saves {formatINR(comparison.savings)} versus the other regime.
                    {comparison.better !== profile.taxRegime && " Switch to optimize."}
                  </p>
                </div>
              </div>
              <Badge tone="success">Save {formatINR(comparison.savings)}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Old vs New Regime</CardTitle>
              <CardDescription>Tax payable and take-home compared</CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonBarChart
                data={chartData}
                bars={[
                  { key: "Tax Payable", name: "Tax Payable", color: "#ef4444" },
                  { key: "Take Home", name: "Take Home", color: "#22c55e" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" /> Tax-Saving Opportunities</CardTitle>
                <CardDescription>Personalized to your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tips.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{t.title}</p>
                      {t.potentialSaving > 0 && <Badge tone="success">Save {formatINR(t.potentialSaving)}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capital Gains & Withdrawal Tax</CardTitle>
                <CardDescription>Equity LTCG estimate (FY 25-26)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NumberField label="Equity long-term gains this year" value={ltcg} onChange={setLtcg} prefix="₹" format="inr" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Exemption</span><span>₹1,25,000</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxable gains</span><span>{formatINR(Math.max(0, ltcg - 125000))}</span></div>
                  <div className="flex justify-between border-t border-border pt-2"><span className="font-medium">LTCG tax @ 12.5%</span><span className="font-bold text-danger">{formatINR(ltcgTax)}</span></div>
                </div>
                <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Retirement withdrawal tip</p>
                  Harvest up to ₹1.25L of equity gains tax-free each year, and stagger withdrawals to stay within lower slabs. EPF & PPF maturity are tax-free; NPS is 60% tax-free at exit.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label2({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium leading-none text-foreground/90">{children}</p>;
}
