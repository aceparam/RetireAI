import { FireResult, FireType, ProfileInputs } from "./types";
import { investableAssets, sipFactor } from "./finance";

export type { FireType } from "./types";

export const FIRE_MULTIPLIERS: Record<FireType, { label: string; spendFactor: number; description: string; color: string }> = {
  lean: {
    label: "Lean FIRE",
    spendFactor: 0.6,
    description: "Minimalist independence. Cover essential expenses (~60% of current spend).",
    color: "#0ea5e9",
  },
  regular: {
    label: "Regular FIRE",
    spendFactor: 1.0,
    description: "Maintain your current lifestyle indefinitely.",
    color: "#6366f1",
  },
  fat: {
    label: "Fat FIRE",
    spendFactor: 1.6,
    description: "Independence with a generous, upgraded lifestyle (~160% of current spend).",
    color: "#a855f7",
  },
};

/**
 * FIRE number = annual spending / safe withdrawal rate.
 * Years to FI solved from current corpus + monthly savings compounding at the
 * expected pre-retirement return.
 */
export function computeFire(
  p: ProfileInputs,
  type: FireType,
  safeWithdrawalRate: number,
): FireResult {
  const spendFactor = FIRE_MULTIPLIERS[type].spendFactor;
  const annualSpending = p.annualExpenses * spendFactor;
  const fireNumber = annualSpending / (safeWithdrawalRate / 100);
  const currentCorpus = investableAssets(p.assets);
  const r = p.preRetirementReturn / 100;
  const monthly = p.monthlyInvestment;

  // Solve years to reach fireNumber via iteration (monthly compounding + SIP)
  let yearsToFire = 0;
  if (currentCorpus < fireNumber) {
    const m = Math.pow(1 + r, 1 / 12) - 1;
    let balance = currentCorpus;
    let months = 0;
    const maxMonths = 80 * 12;
    let contribution = monthly;
    while (balance < fireNumber && months < maxMonths) {
      balance = (balance + contribution) * (1 + m);
      months++;
      if (months % 12 === 0) contribution *= 1 + p.sipStepUp / 100;
    }
    yearsToFire = months >= maxMonths ? Infinity : months / 12;
  }

  // Required monthly savings to hit FIRE by planned retirement age
  const yearsAvail = Math.max(1, p.retirementAge - p.currentAge);
  const fvCurrent = currentCorpus * Math.pow(1 + r, yearsAvail);
  const gap = Math.max(0, fireNumber - fvCurrent);
  const factor = sipFactor(p.preRetirementReturn, yearsAvail);
  const requiredMonthlySavings = factor > 0 ? gap / factor : 0;

  return {
    type,
    annualSpending,
    fireNumber,
    currentCorpus,
    yearsToFire,
    requiredMonthlySavings,
    progressPercent: fireNumber > 0 ? Math.min(100, (currentCorpus / fireNumber) * 100) : 0,
  };
}

export function fireProgressPath(
  p: ProfileInputs,
  fireNumber: number,
  maxYears = 40,
): { age: number; corpus: number; target: number }[] {
  const r = p.preRetirementReturn / 100;
  const m = Math.pow(1 + r, 1 / 12) - 1;
  let balance = investableAssets(p.assets);
  let contribution = p.monthlyInvestment;
  const path = [{ age: p.currentAge, corpus: Math.round(balance), target: Math.round(fireNumber) }];
  for (let y = 1; y <= maxYears; y++) {
    for (let mo = 0; mo < 12; mo++) {
      balance = (balance + contribution) * (1 + m);
    }
    contribution *= 1 + p.sipStepUp / 100;
    path.push({ age: p.currentAge + y, corpus: Math.round(balance), target: Math.round(fireNumber) });
    if (balance >= fireNumber && y > 2) break;
  }
  return path;
}
