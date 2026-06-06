import { MonteCarloResult, ProfileInputs } from "./types";
import {
  blendedReturn,
  blendedVolatility,
  futureValue,
  investableAssets,
  monthlyRate,
  CURRENT_YEAR,
} from "./finance";

// Box-Muller transform for standard normal samples.
function randNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export interface MonteCarloConfig {
  runs: number;
  /** Override expected return (annual %). Defaults to blended portfolio return. */
  meanReturn?: number;
  /** Override annual volatility (%). Defaults to blended portfolio volatility. */
  volatility?: number;
}

/**
 * Monte-Carlo retirement simulation.
 *
 * Phase 1 (accumulation): annual returns drawn from a normal distribution;
 * monthly SIP with step-up is added each year.
 * Phase 2 (decumulation): inflation-growing withdrawals against a volatile
 * corpus. A run "succeeds" if the corpus survives to life expectancy.
 */
export function runMonteCarlo(p: ProfileInputs, config: MonteCarloConfig): MonteCarloResult {
  const runs = Math.max(100, Math.min(20000, config.runs));
  const yearsToRetire = Math.max(0, p.retirementAge - p.currentAge);
  const yearsInRetirement = Math.max(1, p.lifeExpectancy - p.retirementAge);
  const mean = ((config.meanReturn ?? blendedReturn(p.assets)) || p.preRetirementReturn) / 100;
  const vol = ((config.volatility ?? blendedVolatility(p.assets)) || 15) / 100;
  const postMean = p.postRetirementReturn / 100;
  const postVol = vol * 0.6; // de-risked portfolio in retirement
  const inflation = p.inflation / 100;

  const startCorpus = investableAssets(p.assets);
  const expenseAtRetirement = futureValue(p.annualExpenses, p.inflation, yearsToRetire);

  const finalCorpora: number[] = [];
  let successes = 0;

  // Track corpus path per year for percentile bands
  const totalYears = yearsToRetire + yearsInRetirement;
  const paths: number[][] = Array.from({ length: totalYears + 1 }, () => []);

  for (let r = 0; r < runs; r++) {
    let balance = startCorpus;
    let contribution = p.monthlyInvestment;
    paths[0].push(balance);

    // Accumulation
    for (let y = 1; y <= yearsToRetire; y++) {
      const annualReturn = mean + vol * randNormal();
      const m = Math.pow(1 + Math.max(-0.95, annualReturn), 1 / 12) - 1;
      for (let mo = 0; mo < 12; mo++) {
        balance = (balance + contribution) * (1 + m);
      }
      contribution *= 1 + p.sipStepUp / 100;
      paths[y].push(balance);
    }

    const corpusAtRetirement = balance;

    // Decumulation
    let withdrawal = expenseAtRetirement;
    let depleted = false;
    for (let y = 0; y < yearsInRetirement; y++) {
      balance -= withdrawal;
      if (balance < 0) {
        balance = 0;
        depleted = true;
      }
      const annualReturn = postMean + postVol * randNormal();
      balance = balance * (1 + Math.max(-0.95, annualReturn));
      withdrawal *= 1 + inflation;
      paths[yearsToRetire + 1 + y]?.push(balance);
    }

    if (!depleted && balance >= 0) successes++;
    finalCorpora.push(corpusAtRetirement);
  }

  finalCorpora.sort((a, b) => a - b);
  const pct = (q: number) => finalCorpora[Math.min(finalCorpora.length - 1, Math.floor(q * finalCorpora.length))];

  // Histogram of corpus-at-retirement
  const min = finalCorpora[0];
  const max = finalCorpora[finalCorpora.length - 1];
  const buckets = 24;
  const width = (max - min) / buckets || 1;
  const histogram = Array.from({ length: buckets }, (_, i) => ({
    from: min + i * width,
    bucket: "",
    count: 0,
  }));
  for (const v of finalCorpora) {
    const idx = Math.min(buckets - 1, Math.floor((v - min) / width));
    histogram[idx].count++;
  }
  histogram.forEach((h) => {
    h.bucket = compactCr(h.from);
  });

  // Percentile bands over time
  const bands = paths.map((arr, idx) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const q = (x: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(x * sorted.length))] : 0;
    return {
      age: p.currentAge + idx,
      year: CURRENT_YEAR + idx,
      p10: Math.round(q(0.1)),
      p25: Math.round(q(0.25)),
      p50: Math.round(q(0.5)),
      p75: Math.round(q(0.75)),
      p90: Math.round(q(0.9)),
    };
  });

  return {
    runs,
    successProbability: Math.round((successes / runs) * 100),
    median: Math.round(pct(0.5)),
    best: Math.round(max),
    worst: Math.round(min),
    p10: Math.round(pct(0.1)),
    p25: Math.round(pct(0.25)),
    p75: Math.round(pct(0.75)),
    p90: Math.round(pct(0.9)),
    histogram,
    bands,
  };
}

function compactCr(v: number): string {
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
  return `${(v / 1e3).toFixed(0)}K`;
}
