// India income-tax engine (FY 2025-26 / AY 2026-27 assumptions).

export interface TaxSlab {
  upTo: number; // upper bound of slab (Infinity for last)
  rate: number; // %
}

// New regime (FY 2025-26): revised slabs with ₹75,000 standard deduction.
export const NEW_REGIME_SLABS: TaxSlab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

// Old regime slabs (individual < 60 yrs).
export const OLD_REGIME_SLABS: TaxSlab[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 5 },
  { upTo: 1000000, rate: 20 },
  { upTo: Infinity, rate: 30 },
];

export const STANDARD_DEDUCTION_NEW = 75000;
export const STANDARD_DEDUCTION_OLD = 50000;

export interface TaxInput {
  grossIncome: number;
  regime: "old" | "new";
  section80C: number; // max 1.5L
  section80D: number; // health insurance
  npsContribution: number; // 80CCD(1B) max 50k
  homeLoanInterest: number; // 24(b) max 2L
  otherDeductions: number;
}

export interface TaxResult {
  regime: "old" | "new";
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  baseTax: number;
  rebate: number; // 87A
  cess: number; // 4%
  totalTax: number;
  effectiveRate: number;
  takeHome: number;
  slabBreakup: { slab: string; taxed: number; rate: number; tax: number }[];
}

function computeSlabTax(taxable: number, slabs: TaxSlab[]) {
  let tax = 0;
  let prev = 0;
  const breakup: TaxResult["slabBreakup"] = [];
  for (const slab of slabs) {
    if (taxable <= prev) break;
    const portion = Math.min(taxable, slab.upTo) - prev;
    if (portion > 0 && slab.rate > 0) {
      const t = (portion * slab.rate) / 100;
      tax += t;
      breakup.push({
        slab: `₹${(prev / 100000).toFixed(1)}L – ${slab.upTo === Infinity ? "∞" : `₹${(slab.upTo / 100000).toFixed(1)}L`}`,
        taxed: portion,
        rate: slab.rate,
        tax: t,
      });
    }
    prev = slab.upTo;
  }
  return { tax, breakup };
}

export function computeTax(input: TaxInput): TaxResult {
  const isNew = input.regime === "new";
  const slabs = isNew ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  const stdDeduction = isNew ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD;

  // Deductions: new regime only allows standard deduction + employer NPS.
  let deductions = stdDeduction;
  if (!isNew) {
    deductions +=
      Math.min(input.section80C, 150000) +
      Math.min(input.section80D, 100000) +
      Math.min(input.npsContribution, 50000) +
      Math.min(input.homeLoanInterest, 200000) +
      input.otherDeductions;
  } else {
    // 80CCD(1B)/(2) employer NPS still allowed in new regime (1B not, employer 2 yes — simplified)
    deductions += Math.min(input.npsContribution, 50000);
  }

  const taxableIncome = Math.max(0, input.grossIncome - deductions);
  const { tax: baseTax, breakup } = computeSlabTax(taxableIncome, slabs);

  // Section 87A rebate
  let rebate = 0;
  if (isNew && taxableIncome <= 1200000) {
    rebate = Math.min(baseTax, 60000);
  } else if (!isNew && taxableIncome <= 500000) {
    rebate = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    regime: input.regime,
    grossIncome: input.grossIncome,
    totalDeductions: deductions,
    taxableIncome,
    baseTax,
    rebate,
    cess,
    totalTax,
    effectiveRate: input.grossIncome > 0 ? (totalTax / input.grossIncome) * 100 : 0,
    takeHome: input.grossIncome - totalTax,
    slabBreakup: breakup,
  };
}

export function compareRegimes(input: Omit<TaxInput, "regime">): {
  old: TaxResult;
  new: TaxResult;
  better: "old" | "new";
  savings: number;
} {
  const oldR = computeTax({ ...input, regime: "old" });
  const newR = computeTax({ ...input, regime: "new" });
  const better = oldR.totalTax <= newR.totalTax ? "old" : "new";
  return {
    old: oldR,
    new: newR,
    better,
    savings: Math.abs(oldR.totalTax - newR.totalTax),
  };
}

// Long-term capital gains on equity: 12.5% over ₹1.25L exemption (FY25-26).
export function equityLTCG(gains: number): number {
  const taxable = Math.max(0, gains - 125000);
  return taxable * 0.125;
}

export interface TaxSavingTip {
  title: string;
  detail: string;
  potentialSaving: number;
}

export function taxSavingTips(input: TaxInput): TaxSavingTip[] {
  const tips: TaxSavingTip[] = [];
  if (input.regime === "old") {
    const slabRate = marginalRate(input.grossIncome - 50000, OLD_REGIME_SLABS) / 100;
    const remaining80C = Math.max(0, 150000 - input.section80C);
    if (remaining80C > 0) {
      tips.push({
        title: `Use remaining ₹${(remaining80C / 1000).toFixed(0)}K of 80C limit`,
        detail: "Invest in ELSS, PPF, EPF, or life insurance to exhaust your ₹1.5L 80C deduction.",
        potentialSaving: Math.round(remaining80C * slabRate * 1.04),
      });
    }
    const remainingNps = Math.max(0, 50000 - input.npsContribution);
    if (remainingNps > 0) {
      tips.push({
        title: `Claim ₹${(remainingNps / 1000).toFixed(0)}K extra via NPS 80CCD(1B)`,
        detail: "NPS gives an exclusive ₹50,000 deduction over and above 80C.",
        potentialSaving: Math.round(remainingNps * slabRate * 1.04),
      });
    }
    if (input.section80D < 25000) {
      tips.push({
        title: "Buy / declare health insurance (80D)",
        detail: "Premiums up to ₹25,000 (₹50,000 for senior-citizen parents) are deductible.",
        potentialSaving: Math.round((25000 - input.section80D) * slabRate * 1.04),
      });
    }
  } else {
    tips.push({
      title: "Compare with the Old Regime",
      detail:
        "The new regime ignores 80C/80D. If you have a home loan or large deductions, the old regime may save more — check the comparison above.",
      potentialSaving: 0,
    });
  }
  return tips;
}

function marginalRate(taxable: number, slabs: TaxSlab[]): number {
  let prev = 0;
  for (const slab of slabs) {
    if (taxable <= slab.upTo) return slab.rate;
    prev = slab.upTo;
  }
  return slabs[slabs.length - 1].rate;
}
