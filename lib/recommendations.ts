import { ProfileInputs, RetirementResult } from "./types";
import {
  equityAllocationPct,
  readinessBreakdown,
  savingsRatePct,
  totalEMI,
  ASSET_CLASSES,
  clamp,
  sipFactor,
} from "./finance";
import { formatINR } from "./format";

export interface Recommendation {
  id: string;
  priority: number; // 1 = highest
  title: string;
  rationale: string;
  impact: string;
  category: "savings" | "allocation" | "timing" | "tax" | "risk" | "debt" | "protection";
  estimatedImpactValue?: number; // rupee impact on corpus, if quantifiable
}

/**
 * Rule-based recommendations engine. Produces a prioritized, quantified action
 * plan from the user's profile and projection.
 */
export function generateRecommendations(
  p: ProfileInputs,
  r: RetirementResult,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const breakdown = readinessBreakdown(p, r.projectedCorpus, r.requiredCorpus);

  // 1. Shortfall -> increase SIP
  if (r.surplus < 0 && r.additionalMonthlySip > 0) {
    recs.push({
      id: "increase-sip",
      priority: 1,
      title: `Increase monthly SIP by ${formatINR(roundTo(r.additionalMonthlySip, 500))}`,
      rationale: `You are projected to fall short of your required corpus by ${formatINR(Math.abs(r.surplus))}. Stepping up your investment closes this gap by retirement.`,
      impact: `Closes the ${formatINR(Math.abs(r.surplus))} shortfall`,
      category: "savings",
      estimatedImpactValue: Math.abs(r.surplus),
    });
  }

  // 2. Low savings rate
  const sr = savingsRatePct(p);
  if (sr < 20 && p.annualIncome > 0) {
    const targetMonthly = (p.annualIncome * 0.3) / 12;
    const extra = Math.max(0, targetMonthly - p.monthlyInvestment);
    const impactVal = extra * sipFactor(p.preRetirementReturn, r.yearsToRetire);
    recs.push({
      id: "savings-rate",
      priority: r.surplus < 0 ? 2 : 1,
      title: `Lift savings rate from ${sr.toFixed(0)}% toward 30%`,
      rationale: `You currently invest ${sr.toFixed(0)}% of income. A 30% savings rate dramatically accelerates wealth building.`,
      impact: `Adds ~${formatINR(impactVal)} to your corpus`,
      category: "savings",
      estimatedImpactValue: impactVal,
    });
  }

  // 3. Step-up SIP if none
  if (p.sipStepUp < 5) {
    const withStepUp = simulateStepUpDelta(p, r);
    recs.push({
      id: "step-up",
      priority: 3,
      title: "Enable a 10% annual SIP step-up",
      rationale: "Increasing your SIP by 10% each year (in line with salary growth) compounds powerfully with minimal lifestyle impact.",
      impact: `Adds ~${formatINR(withStepUp)} to your corpus`,
      category: "savings",
      estimatedImpactValue: withStepUp,
    });
  }

  // 4. Asset allocation vs age
  const equity = equityAllocationPct(p.assets);
  const targetEquity = clamp(100 - p.currentAge, 20, 90);
  if (equity > targetEquity + 15 && r.yearsToRetire < 12) {
    recs.push({
      id: "derisk",
      priority: 4,
      title: `Reduce equity from ${equity.toFixed(0)}% toward ${targetEquity.toFixed(0)}%`,
      rationale: "As you approach retirement, trimming equity protects you from sequence-of-returns risk near your withdrawal phase.",
      impact: "Lowers portfolio volatility & downside risk",
      category: "risk",
    });
  } else if (equity < targetEquity - 20 && r.yearsToRetire > 12) {
    recs.push({
      id: "add-equity",
      priority: 4,
      title: `Increase equity from ${equity.toFixed(0)}% toward ${targetEquity.toFixed(0)}%`,
      rationale: "With a long horizon, a higher equity allocation captures more growth and outpaces inflation.",
      impact: "Higher expected long-run returns",
      category: "allocation",
    });
  }

  // 5. Emergency fund
  if (p.emergencyFundMonths < 6) {
    const need = (6 - p.emergencyFundMonths) * (p.annualExpenses / 12);
    recs.push({
      id: "emergency",
      priority: 5,
      title: `Build emergency fund to 6 months (${formatINR(need)} more)`,
      rationale: `You hold ${p.emergencyFundMonths} months of expenses. A 6-month buffer prevents you from breaking long-term investments during a crisis.`,
      impact: "Protects your retirement corpus from early withdrawals",
      category: "protection",
    });
  }

  // 6. Debt burden
  const emiRatio = p.annualIncome > 0 ? (totalEMI(p.liabilities) * 12) / p.annualIncome : 0;
  if (emiRatio > 0.4) {
    recs.push({
      id: "debt",
      priority: 2,
      title: "Reduce high debt burden",
      rationale: `EMIs consume ${(emiRatio * 100).toFixed(0)}% of your income. Prepaying high-interest loans frees cashflow for investing.`,
      impact: "Frees monthly cashflow for SIPs",
      category: "debt",
    });
  }
  const creditCard = p.liabilities.find((l) => l.type === "creditCard" && l.balance > 0);
  if (creditCard) {
    recs.push({
      id: "creditcard",
      priority: 1,
      title: "Clear credit-card debt immediately",
      rationale: "Credit-card interest (36-48% p.a.) far exceeds any investment return. This is your highest-priority action.",
      impact: `Saves ~${formatINR(creditCard.balance * 0.4)}/yr in interest`,
      category: "debt",
      estimatedImpactValue: creditCard.balance * 0.4,
    });
  }

  // 7. NPS for tax + retirement
  if (p.npsContribution < 50000 && p.taxRegime === "old") {
    recs.push({
      id: "nps",
      priority: 6,
      title: "Maximize NPS contribution (₹50K under 80CCD(1B))",
      rationale: "NPS offers an exclusive ₹50,000 tax deduction plus a low-cost, equity-linked retirement vehicle.",
      impact: "Tax saving + dedicated retirement growth",
      category: "tax",
    });
  }

  // 8. Delay retirement (only if large shortfall)
  if (r.surplus < 0 && Math.abs(r.surplus) > r.requiredCorpus * 0.25) {
    const delayed = delayRetirementImpact(p, 2);
    recs.push({
      id: "delay",
      priority: 3,
      title: "Consider delaying retirement by 2 years",
      rationale: "Two extra years of compounding plus two fewer years of drawdown can transform a shortfall into a surplus.",
      impact: `Adds ~${formatINR(delayed)} and shortens the drawdown window`,
      category: "timing",
      estimatedImpactValue: delayed,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority).slice(0, 8);
}

function roundTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}

function simulateStepUpDelta(p: ProfileInputs, r: RetirementResult): number {
  // Rough delta from a 10% step-up vs current step-up over horizon
  const factor = sipFactor(p.preRetirementReturn, r.yearsToRetire);
  // Approximate average extra contribution from step-up as ~ monthly * 0.5 * years * 0.1
  const avgExtra = p.monthlyInvestment * 0.5 * r.yearsToRetire * 0.1;
  return Math.max(0, avgExtra * factor * 0.6);
}

function delayRetirementImpact(p: ProfileInputs, extraYears: number): number {
  const m = Math.pow(1 + p.preRetirementReturn / 100, 1 / 12) - 1;
  const currentCorpus = p.assets.reduce((s, a) => s + a.value, 0);
  // Extra compounding on the existing corpus + extra SIP contributions.
  const extraGrowth =
    currentCorpus * (Math.pow(1 + p.preRetirementReturn / 100, extraYears) - 1) +
    p.monthlyInvestment * 12 * extraYears * (1 + m * 6);
  return Math.max(0, extraGrowth);
}
