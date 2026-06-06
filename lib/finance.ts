import {
  Asset,
  AssetClass,
  AssetClassMeta,
  CorpusProjectionPoint,
  Liability,
  ProfileInputs,
  RetirementResult,
} from "./types";

export const CURRENT_YEAR = 2026;

// ---------------------------------------------------------------------------
// Asset class reference data (India-tuned long-run assumptions)
// ---------------------------------------------------------------------------
export const ASSET_CLASSES: Record<AssetClass, AssetClassMeta> = {
  equityMF: {
    key: "equityMF",
    label: "Equity Mutual Funds",
    defaultReturn: 12,
    defaultVolatility: 18,
    color: "#6366f1",
    description: "Diversified equity / index funds via SIP. Highest long-run growth.",
  },
  stocks: {
    key: "stocks",
    label: "Direct Stocks",
    defaultReturn: 13,
    defaultVolatility: 24,
    color: "#8b5cf6",
    description: "Individual equities. Higher upside, higher single-name risk.",
  },
  bonds: {
    key: "bonds",
    label: "Bonds / Debt Funds",
    defaultReturn: 7,
    defaultVolatility: 5,
    color: "#0ea5e9",
    description: "Debt funds, G-Secs, corporate bonds. Stability and income.",
  },
  gold: {
    key: "gold",
    label: "Gold",
    defaultReturn: 8,
    defaultVolatility: 14,
    color: "#f59e0b",
    description: "Sovereign Gold Bonds / gold ETFs. Inflation hedge.",
  },
  cash: {
    key: "cash",
    label: "Cash & FD",
    defaultReturn: 6,
    defaultVolatility: 1,
    color: "#64748b",
    description: "Savings, fixed deposits, liquid funds. Emergency liquidity.",
  },
  realEstate: {
    key: "realEstate",
    label: "Real Estate",
    defaultReturn: 8,
    defaultVolatility: 12,
    color: "#14b8a6",
    description: "Property. Illiquid; excluded from drawdown corpus by default.",
  },
  nps: {
    key: "nps",
    label: "NPS",
    defaultReturn: 10,
    defaultVolatility: 10,
    color: "#ec4899",
    description: "National Pension System. Tax-efficient retirement vehicle.",
  },
  epf: {
    key: "epf",
    label: "EPF",
    defaultReturn: 8.25,
    defaultVolatility: 1,
    color: "#22c55e",
    description: "Employees' Provident Fund. Government-backed, fixed return.",
  },
  ppf: {
    key: "ppf",
    label: "PPF",
    defaultReturn: 7.1,
    defaultVolatility: 1,
    color: "#84cc16",
    description: "Public Provident Fund. 15-yr lock-in, tax-free returns.",
  },
};

export const ASSET_CLASS_LIST = Object.values(ASSET_CLASSES);

/** Asset classes that are illiquid and excluded from the spendable corpus. */
const ILLIQUID: AssetClass[] = ["realEstate"];

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

export function monthlyRate(annualPercent: number): number {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

/** Future value of a present lump sum. */
export function futureValue(present: number, annualReturnPct: number, years: number): number {
  return present * Math.pow(1 + annualReturnPct / 100, years);
}

/**
 * Future value of a monthly SIP with optional annual step-up.
 * Contributions are made at the start of each month.
 */
export function sipFutureValue(
  monthly: number,
  annualReturnPct: number,
  years: number,
  stepUpPct = 0,
): number {
  const m = monthlyRate(annualReturnPct);
  let balance = 0;
  let contribution = monthly;
  for (let y = 0; y < years; y++) {
    for (let mo = 0; mo < 12; mo++) {
      balance = (balance + contribution) * (1 + m);
    }
    contribution *= 1 + stepUpPct / 100;
  }
  return balance;
}

/** Future value factor for ₹1/month invested (ordinary annuity, monthly compounding). */
export function sipFactor(annualReturnPct: number, years: number): number {
  const m = monthlyRate(annualReturnPct);
  const n = years * 12;
  if (m === 0) return n;
  return ((Math.pow(1 + m, n) - 1) / m) * (1 + m);
}

export function totalAssets(assets: Asset[]): number {
  return assets.reduce((s, a) => s + (a.value || 0), 0);
}

export function investableAssets(assets: Asset[]): number {
  return assets
    .filter((a) => !ILLIQUID.includes(a.class))
    .reduce((s, a) => s + (a.value || 0), 0);
}

export function totalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((s, l) => s + (l.balance || 0), 0);
}

export function totalEMI(liabilities: Liability[]): number {
  return liabilities.reduce((s, l) => s + (l.emi || 0), 0);
}

export function netWorth(assets: Asset[], liabilities: Liability[]): number {
  return totalAssets(assets) - totalLiabilities(liabilities);
}

/**
 * Required corpus at retirement to fund inflation-growing expenses through
 * life expectancy. Uses the present value of a growing annuity-due, where the
 * corpus earns the post-retirement nominal return and withdrawals grow with
 * inflation. Equivalent to discounting real (constant) withdrawals at the real
 * return rate.
 */
export function requiredCorpus(
  expenseAtRetirement: number,
  postReturnPct: number,
  inflationPct: number,
  yearsInRetirement: number,
): number {
  const i = postReturnPct / 100;
  const g = inflationPct / 100;
  const n = yearsInRetirement;
  // Real return rate
  const rr = (1 + i) / (1 + g) - 1;
  if (Math.abs(rr) < 1e-6) {
    return expenseAtRetirement * n;
  }
  // Annuity-due present value of constant real withdrawals
  const pv = (expenseAtRetirement * (1 - Math.pow(1 + rr, -n)) * (1 + rr)) / rr;
  return pv;
}

// ---------------------------------------------------------------------------
// Full retirement projection
// ---------------------------------------------------------------------------

export function projectRetirement(p: ProfileInputs): RetirementResult {
  const yearsToRetire = Math.max(0, p.retirementAge - p.currentAge);
  const yearsInRetirement = Math.max(1, p.lifeExpectancy - p.retirementAge);

  const expenseAtRetirement = futureValue(p.annualExpenses, p.inflation, yearsToRetire);
  const required = requiredCorpus(
    expenseAtRetirement,
    p.postRetirementReturn,
    p.inflation,
    yearsInRetirement,
  );

  // Accumulation projection (year by year)
  const startCorpus = investableAssets(p.assets);
  const projection: CorpusProjectionPoint[] = [];
  const m = monthlyRate(p.preRetirementReturn);
  let balance = startCorpus;
  let contribution = p.monthlyInvestment;
  let cumulativeContrib = 0;

  projection.push({
    age: p.currentAge,
    year: CURRENT_YEAR,
    corpus: Math.round(balance),
    contributions: 0,
    realCorpus: Math.round(balance),
  });

  for (let y = 1; y <= yearsToRetire; y++) {
    for (let mo = 0; mo < 12; mo++) {
      balance = (balance + contribution) * (1 + m);
      cumulativeContrib += contribution;
    }
    contribution *= 1 + p.sipStepUp / 100;
    const realCorpus = balance / Math.pow(1 + p.inflation / 100, y);
    projection.push({
      age: p.currentAge + y,
      year: CURRENT_YEAR + y,
      corpus: Math.round(balance),
      contributions: Math.round(cumulativeContrib),
      realCorpus: Math.round(realCorpus),
    });
  }

  const projectedCorpus = balance;
  const surplus = projectedCorpus - required;

  // Drawdown timeline
  const drawdown: RetirementResult["drawdown"] = [];
  let dBalance = projectedCorpus;
  let withdrawal = expenseAtRetirement;
  let depletionAge: number | null = null;
  for (let y = 0; y < yearsInRetirement; y++) {
    const age = p.retirementAge + y;
    // Withdraw at start of year, then grow remainder
    dBalance -= withdrawal;
    if (dBalance < 0 && depletionAge === null) {
      depletionAge = age;
    }
    dBalance = Math.max(0, dBalance) * (1 + p.postRetirementReturn / 100);
    drawdown.push({
      age,
      year: CURRENT_YEAR + yearsToRetire + y,
      corpus: Math.round(Math.max(0, dBalance)),
      withdrawal: Math.round(withdrawal),
    });
    withdrawal *= 1 + p.inflation / 100;
  }

  // Additional monthly SIP to close any gap
  const gap = Math.max(0, required - projectedCorpus);
  const factor = sipFactor(p.preRetirementReturn, yearsToRetire);
  const additionalMonthlySip = factor > 0 ? gap / factor : 0;

  const readinessScore = computeReadinessScore(p, projectedCorpus, required);
  const successProbability = estimateSuccessProbability(projectedCorpus, required, depletionAge, p);

  return {
    yearsToRetire,
    yearsInRetirement,
    expenseAtRetirement,
    requiredCorpus: required,
    projectedCorpus,
    surplus,
    readinessScore,
    successProbability,
    additionalMonthlySip,
    projection,
    drawdown,
    depletionAge,
  };
}

// ---------------------------------------------------------------------------
// Readiness score (0-100) — multi-factor
// ---------------------------------------------------------------------------

export interface ReadinessBreakdown {
  corpusAdequacy: number; // /40
  savingsRate: number; // /20
  emergencyFund: number; // /15
  debtBurden: number; // /15
  assetAllocation: number; // /10
  total: number;
}

export function readinessBreakdown(
  p: ProfileInputs,
  projectedCorpus: number,
  required: number,
): ReadinessBreakdown {
  // Corpus adequacy (40)
  const ratio = required > 0 ? projectedCorpus / required : 1;
  const corpusAdequacy = clamp(ratio, 0, 1.25) * (40 / 1.25);

  // Savings rate (20) — target 30% of income
  const annualSip = p.monthlyInvestment * 12;
  const savingsRatePct = p.annualIncome > 0 ? (annualSip / p.annualIncome) * 100 : 0;
  const savingsRate = clamp(savingsRatePct / 30, 0, 1) * 20;

  // Emergency fund (15) — target 6 months
  const emergencyFund = clamp(p.emergencyFundMonths / 6, 0, 1) * 15;

  // Debt burden (15) — EMI/income; 0% debt = full marks, >=50% = 0
  const emiRatio =
    p.annualIncome > 0 ? (totalEMI(p.liabilities) * 12) / p.annualIncome : 0;
  const debtBurden = clamp(1 - emiRatio / 0.5, 0, 1) * 15;

  // Asset allocation appropriateness (10) — equity share vs (100 - age) rule
  const equityShare = equityAllocationPct(p.assets);
  const targetEquity = clamp(100 - p.currentAge, 20, 90);
  const allocDiff = Math.abs(equityShare - targetEquity);
  const assetAllocation = clamp(1 - allocDiff / 50, 0, 1) * 10;

  const total = Math.round(
    corpusAdequacy + savingsRate + emergencyFund + debtBurden + assetAllocation,
  );

  return {
    corpusAdequacy: round1(corpusAdequacy),
    savingsRate: round1(savingsRate),
    emergencyFund: round1(emergencyFund),
    debtBurden: round1(debtBurden),
    assetAllocation: round1(assetAllocation),
    total: clamp(total, 0, 100),
  };
}

export function computeReadinessScore(
  p: ProfileInputs,
  projectedCorpus: number,
  required: number,
): number {
  return readinessBreakdown(p, projectedCorpus, required).total;
}

export function scoreBand(score: number): { label: string; tone: "danger" | "warning" | "success" } {
  if (score >= 75) return { label: "On Track", tone: "success" };
  if (score >= 50) return { label: "Needs Attention", tone: "warning" };
  return { label: "At Risk", tone: "danger" };
}

// ---------------------------------------------------------------------------
// Allocation helpers
// ---------------------------------------------------------------------------

export function equityAllocationPct(assets: Asset[]): number {
  const total = totalAssets(assets);
  if (total <= 0) return 0;
  const equity = assets
    .filter((a) => a.class === "equityMF" || a.class === "stocks")
    .reduce((s, a) => s + a.value, 0);
  return (equity / total) * 100;
}

export function allocationByClass(assets: Asset[]): { class: AssetClass; label: string; value: number; pct: number; color: string }[] {
  const total = totalAssets(assets);
  const map = new Map<AssetClass, number>();
  for (const a of assets) {
    map.set(a.class, (map.get(a.class) || 0) + a.value);
  }
  return Array.from(map.entries())
    .map(([cls, value]) => ({
      class: cls,
      label: ASSET_CLASSES[cls].label,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
      color: ASSET_CLASSES[cls].color,
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// Success probability (deterministic logistic estimate)
// ---------------------------------------------------------------------------

export function estimateSuccessProbability(
  projectedCorpus: number,
  required: number,
  depletionAge: number | null,
  p: ProfileInputs,
): number {
  const ratio = required > 0 ? projectedCorpus / required : 2;
  // Logistic centred slightly above 1.0 to account for sequence-of-returns risk
  const base = 100 / (1 + Math.exp(-6 * (ratio - 1.05)));
  // Penalty if corpus depletes before life expectancy
  let prob = base;
  if (depletionAge !== null) {
    const shortfallYears = p.lifeExpectancy - depletionAge;
    prob -= clamp(shortfallYears, 0, 30) * 1.5;
  }
  return clamp(Math.round(prob), 1, 99);
}

// ---------------------------------------------------------------------------
// small math utils
// ---------------------------------------------------------------------------

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function savingsRatePct(p: ProfileInputs): number {
  const annualSip = p.monthlyInvestment * 12;
  return p.annualIncome > 0 ? (annualSip / p.annualIncome) * 100 : 0;
}

export function blendedReturn(assets: Asset[]): number {
  const total = totalAssets(assets);
  if (total <= 0) return 0;
  let weighted = 0;
  for (const a of assets) {
    const r = a.expectedReturn ?? ASSET_CLASSES[a.class].defaultReturn;
    weighted += (a.value / total) * r;
  }
  return weighted;
}

export function blendedVolatility(assets: Asset[]): number {
  const total = totalAssets(assets);
  if (total <= 0) return 0;
  // Simplified: weighted average volatility (ignores correlation; conservative-ish)
  let weighted = 0;
  for (const a of assets) {
    weighted += (a.value / total) * ASSET_CLASSES[a.class].defaultVolatility;
  }
  return weighted;
}
