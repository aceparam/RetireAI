// Core domain types for the RetireAI planning engine.

export type AssetClass =
  | "equityMF"
  | "stocks"
  | "bonds"
  | "gold"
  | "cash"
  | "realEstate"
  | "nps"
  | "epf"
  | "ppf";

export interface AssetClassMeta {
  key: AssetClass;
  label: string;
  /** Default expected nominal annual return (%). */
  defaultReturn: number;
  /** Default annual volatility / std-dev (%). */
  defaultVolatility: number;
  color: string;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  class: AssetClass;
  value: number;
  /** Optional override of expected return for projections (%). */
  expectedReturn?: number;
}

export interface Liability {
  id: string;
  name: string;
  type: "homeLoan" | "personalLoan" | "creditCard" | "carLoan" | "educationLoan" | "other";
  balance: number;
  interestRate: number;
  emi: number;
}

export interface Goal {
  id: string;
  name: string;
  type: "education" | "marriage" | "house" | "travel" | "emergency" | "vehicle" | "other";
  targetAmount: number;
  targetYear: number; // calendar year
  currentSaved: number;
  priority: "high" | "medium" | "low";
  /** Whether this goal is funded from the retirement corpus pool. */
  inflateToTarget: boolean;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: "pension" | "rental" | "dividend" | "annuity" | "swp" | "other";
  monthlyAmount: number;
  /** Annual growth of this income stream (%). */
  growthRate: number;
  taxable: boolean;
}

export interface ProfileInputs {
  // Personal
  name: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;

  // Cashflow
  annualExpenses: number; // current annual living expenses (today's rupees)
  annualIncome: number; // current gross annual income
  monthlyInvestment: number; // current monthly SIP / savings

  // Assumptions
  inflation: number; // %
  preRetirementReturn: number; // % expected return while accumulating
  postRetirementReturn: number; // % expected return during retirement
  salaryGrowth: number; // % annual increase applied to SIP step-up
  sipStepUp: number; // % annual increase in monthly investment

  // Portfolio
  assets: Asset[];
  liabilities: Liability[];

  // Planning
  goals: Goal[];
  incomeSources: IncomeSource[];
  emergencyFundMonths: number; // months of expenses held as emergency fund

  // Tax
  taxRegime: "old" | "new";
  section80C: number;
  npsContribution: number; // 80CCD(1B)

  // Persona
  persona: "young" | "midCareer" | "preRetiree" | "custom";
}

export interface CorpusProjectionPoint {
  age: number;
  year: number;
  corpus: number;
  contributions: number;
  realCorpus: number; // inflation-adjusted to today
}

export interface RetirementResult {
  yearsToRetire: number;
  yearsInRetirement: number;
  /** Annual expense at retirement (inflated). */
  expenseAtRetirement: number;
  /** Required corpus to sustain expenses through life expectancy. */
  requiredCorpus: number;
  /** Projected corpus at retirement from current savings + SIPs. */
  projectedCorpus: number;
  surplus: number; // projected - required (negative = shortfall)
  readinessScore: number; // 0-100
  /** Monte-Carlo style probability of success (%). */
  successProbability: number;
  /** Additional monthly SIP required to close the gap. */
  additionalMonthlySip: number;
  projection: CorpusProjectionPoint[];
  /** Corpus drawdown timeline through retirement. */
  drawdown: { age: number; year: number; corpus: number; withdrawal: number }[];
  /** Age at which corpus is depleted (if it happens before life expectancy). */
  depletionAge: number | null;
}

export interface MonteCarloResult {
  runs: number;
  successProbability: number;
  median: number;
  best: number;
  worst: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  histogram: { bucket: string; count: number; from: number }[];
  /** Percentile bands of corpus over time for fan chart. */
  bands: { age: number; year: number; p10: number; p25: number; p50: number; p75: number; p90: number }[];
}

export type FireType = "lean" | "regular" | "fat";

export interface FireResult {
  type: FireType;
  annualSpending: number;
  fireNumber: number;
  currentCorpus: number;
  yearsToFire: number;
  requiredMonthlySavings: number;
  progressPercent: number;
}
