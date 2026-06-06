"use client";

import * as React from "react";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { DrawdownChart, MultiLineChart } from "@/components/charts";
import { usePlanner } from "@/lib/store";
import { useResults } from "@/lib/use-results";
import { CURRENT_YEAR, futureValue } from "@/lib/finance";
import { IncomeSource } from "@/lib/types";
import { formatINR } from "@/lib/format";

const INCOME_TYPES = [
  { value: "pension", label: "Pension" },
  { value: "rental", label: "Rental Income" },
  { value: "dividend", label: "Dividends" },
  { value: "annuity", label: "Annuity" },
  { value: "swp", label: "SWP (Mutual Fund)" },
  { value: "other", label: "Other" },
] as const;

export default function IncomePage() {
  const { profile, result } = useResults();
  const { addIncome, updateIncome, removeIncome } = usePlanner();

  const totalMonthlyIncome = profile.incomeSources.reduce((s, i) => s + i.monthlyAmount, 0);
  const annualIncome = totalMonthlyIncome * 12;
  const expenseAtRetirement = result.expenseAtRetirement;
  const netAnnualNeed = Math.max(0, expenseAtRetirement - annualIncome);
  const incomeCoverage = expenseAtRetirement > 0 ? Math.min(100, (annualIncome / expenseAtRetirement) * 100) : 0;

  // Depletion forecast with income offset
  const forecast = React.useMemo(() => {
    const yearsToRetire = Math.max(0, profile.retirementAge - profile.currentAge);
    const yearsInRetirement = Math.max(1, profile.lifeExpectancy - profile.retirementAge);
    let balance = result.projectedCorpus;
    let expense = expenseAtRetirement;
    const rows: { age: number; corpus: number; withdrawal: number; income: number }[] = [];
    for (let y = 0; y < yearsInRetirement; y++) {
      const age = profile.retirementAge + y;
      // Other income grows by each source's growth rate
      const yearIncome = profile.incomeSources.reduce(
        (s, src) => s + src.monthlyAmount * 12 * Math.pow(1 + src.growthRate / 100, y),
        0,
      );
      const netWithdrawal = Math.max(0, expense - yearIncome);
      balance = Math.max(0, balance - netWithdrawal) * (1 + profile.postRetirementReturn / 100);
      rows.push({ age, corpus: Math.round(balance), withdrawal: Math.round(netWithdrawal), income: Math.round(yearIncome) });
      expense *= 1 + profile.inflation / 100;
    }
    void yearsToRetire;
    return rows;
  }, [profile, result.projectedCorpus, expenseAtRetirement]);

  const depletionAge = forecast.find((r) => r.corpus <= 0)?.age ?? null;
  const lastsToEnd = depletionAge === null;

  // Tax-adjusted (rough): taxable income sources taxed at ~10% effective in retirement
  const taxableAnnual = profile.incomeSources.filter((i) => i.taxable).reduce((s, i) => s + i.monthlyAmount * 12, 0);
  const estTax = taxableAnnual * 0.1;
  const netCashFlow = annualIncome - estTax;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Retirement Income Planner"
        description="Map out your post-retirement income — pension, rent, dividends, SWP & annuity — and see how long your corpus lasts."
        icon={<Wallet className="h-5 w-5" />}
        action={
          <Button size="sm" onClick={() => addIncome({ name: "New Source", type: "rental", monthlyAmount: 20000, growthRate: 5, taxable: true })}>
            <Plus className="h-4 w-4" /> Add income
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly Income" value={formatINR(totalMonthlyIncome)} tone="success" sub="from all sources" />
        <Stat label="Expense Coverage" value={`${incomeCoverage.toFixed(0)}%`} tone={incomeCoverage >= 60 ? "success" : "warning"} sub="of retirement expenses" />
        <Stat label="Net Corpus Draw" value={formatINR(netAnnualNeed)} sub="per year (yr 1)" tone="primary" />
        <Stat label="Corpus Longevity" value={lastsToEnd ? `Age ${profile.lifeExpectancy}+` : `Age ${depletionAge}`} tone={lastsToEnd ? "success" : "danger"} sub={lastsToEnd ? "lasts your lifetime" : "depletes early"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Corpus Depletion Forecast</CardTitle>
            <CardDescription>Remaining corpus after income-offset withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            {!lastsToEnd && (
              <div className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                Corpus depletes around age {depletionAge}. Add income or reduce expenses to extend it.
              </div>
            )}
            <DrawdownChart data={forecast.map((f) => ({ age: f.age, corpus: f.corpus, withdrawal: f.withdrawal }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax-Adjusted Cash Flow</CardTitle>
            <CardDescription>Annual, year 1 of retirement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Gross income" value={formatINR(annualIncome)} />
            <Row label="Taxable portion" value={formatINR(taxableAnnual)} muted />
            <Row label="Estimated tax (~10%)" value={`- ${formatINR(estTax)}`} tone="danger" />
            <div className="border-t border-border pt-3">
              <Row label="Net annual cash flow" value={formatINR(netCashFlow)} tone="success" bold />
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Net monthly in hand</p>
              <p className="text-xl font-bold">{formatINR(netCashFlow / 12)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expense Over Time</CardTitle>
          <CardDescription>How your income streams cover rising expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiLineChart
            data={forecast.map((f, i) => ({
              age: f.age,
              Income: f.income,
              Expense: Math.round(expenseAtRetirement * Math.pow(1 + profile.inflation / 100, i)),
            }))}
            lines={[
              { key: "Income", name: "Other Income", color: "#22c55e" },
              { key: "Expense", name: "Expenses", color: "#ef4444" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
          <CardDescription>Pension, rental, dividends, SWP, annuity & more</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.incomeSources.length === 0 ? (
            <p className="rounded-xl bg-secondary/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No income sources yet. Add pension, rent or dividends to model your retirement cash flow.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.incomeSources.map((i) => (
                <div key={i.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_130px_100px_90px_auto] lg:items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={i.name} onChange={(e) => updateIncome(i.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={i.type} onChange={(e) => updateIncome(i.id, { type: e.target.value as IncomeSource["type"] })}>
                      {INCOME_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monthly (₹)</Label>
                    <Input inputMode="numeric" value={i.monthlyAmount} onChange={(e) => updateIncome(i.id, { monthlyAmount: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Growth %</Label>
                    <Input inputMode="numeric" value={i.growthRate} onChange={(e) => updateIncome(i.id, { growthRate: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Taxable</Label>
                    <Select value={i.taxable ? "yes" : "no"} onChange={(e) => updateIncome(i.id, { taxable: e.target.value === "yes" })}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeIncome(i.id)} aria-label="Remove">
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

function Row({ label, value, tone, muted, bold }: { label: string; value: string; tone?: "success" | "danger"; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`${bold ? "text-base font-bold" : "font-medium"} ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}`}>{value}</span>
    </div>
  );
}
