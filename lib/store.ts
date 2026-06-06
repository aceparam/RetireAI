"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Asset, Goal, IncomeSource, Liability, ProfileInputs } from "./types";

let idCounter = 0;
export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

// ---------------------------------------------------------------------------
// Persona presets
// ---------------------------------------------------------------------------

export const PERSONA_PRESETS: Record<"young" | "midCareer" | "preRetiree", ProfileInputs> = {
  young: {
    name: "",
    persona: "young",
    currentAge: 28,
    retirementAge: 55,
    lifeExpectancy: 85,
    annualExpenses: 600000,
    annualIncome: 1500000,
    monthlyInvestment: 30000,
    inflation: 6,
    preRetirementReturn: 12,
    postRetirementReturn: 8,
    salaryGrowth: 8,
    sipStepUp: 10,
    emergencyFundMonths: 3,
    taxRegime: "new",
    section80C: 150000,
    npsContribution: 0,
    assets: [
      { id: "a1", name: "Equity Mutual Funds", class: "equityMF", value: 800000 },
      { id: "a2", name: "EPF", class: "epf", value: 400000 },
      { id: "a3", name: "Savings & FD", class: "cash", value: 300000 },
    ],
    liabilities: [],
    goals: [
      { id: "g1", name: "Emergency Fund", type: "emergency", targetAmount: 600000, targetYear: 2027, currentSaved: 300000, priority: "high", inflateToTarget: false },
    ],
    incomeSources: [],
  },
  midCareer: {
    name: "",
    persona: "midCareer",
    currentAge: 42,
    retirementAge: 60,
    lifeExpectancy: 85,
    annualExpenses: 1200000,
    annualIncome: 3000000,
    monthlyInvestment: 60000,
    inflation: 6,
    preRetirementReturn: 11,
    postRetirementReturn: 8,
    salaryGrowth: 7,
    sipStepUp: 8,
    emergencyFundMonths: 5,
    taxRegime: "old",
    section80C: 150000,
    npsContribution: 50000,
    assets: [
      { id: "a1", name: "Equity Mutual Funds", class: "equityMF", value: 4500000 },
      { id: "a2", name: "Direct Stocks", class: "stocks", value: 1500000 },
      { id: "a3", name: "EPF", class: "epf", value: 2500000 },
      { id: "a4", name: "PPF", class: "ppf", value: 1200000 },
      { id: "a5", name: "NPS", class: "nps", value: 800000 },
      { id: "a6", name: "Real Estate", class: "realEstate", value: 8000000 },
      { id: "a7", name: "Cash & FD", class: "cash", value: 800000 },
    ],
    liabilities: [
      { id: "l1", name: "Home Loan", type: "homeLoan", balance: 4500000, interestRate: 8.5, emi: 42000 },
    ],
    goals: [
      { id: "g1", name: "Child's Education", type: "education", targetAmount: 5000000, targetYear: 2034, currentSaved: 1000000, priority: "high", inflateToTarget: true },
      { id: "g2", name: "Child's Marriage", type: "marriage", targetAmount: 3000000, targetYear: 2040, currentSaved: 200000, priority: "medium", inflateToTarget: true },
    ],
    incomeSources: [],
  },
  preRetiree: {
    name: "",
    persona: "preRetiree",
    currentAge: 56,
    retirementAge: 62,
    lifeExpectancy: 88,
    annualExpenses: 1500000,
    annualIncome: 4000000,
    monthlyInvestment: 100000,
    inflation: 6,
    preRetirementReturn: 9,
    postRetirementReturn: 7.5,
    salaryGrowth: 5,
    sipStepUp: 5,
    emergencyFundMonths: 8,
    taxRegime: "old",
    section80C: 150000,
    npsContribution: 50000,
    assets: [
      { id: "a1", name: "Equity Mutual Funds", class: "equityMF", value: 9000000 },
      { id: "a2", name: "Debt Funds", class: "bonds", value: 6000000 },
      { id: "a3", name: "EPF", class: "epf", value: 8000000 },
      { id: "a4", name: "PPF", class: "ppf", value: 3000000 },
      { id: "a5", name: "NPS", class: "nps", value: 4000000 },
      { id: "a6", name: "Gold (SGB)", class: "gold", value: 1500000 },
      { id: "a7", name: "Cash & FD", class: "cash", value: 2500000 },
    ],
    liabilities: [],
    goals: [
      { id: "g1", name: "World Tour", type: "travel", targetAmount: 2000000, targetYear: 2030, currentSaved: 500000, priority: "low", inflateToTarget: true },
    ],
    incomeSources: [
      { id: "i1", name: "Rental Income", type: "rental", monthlyAmount: 35000, growthRate: 5, taxable: true },
    ],
  },
};

export const DEFAULT_PROFILE: ProfileInputs = PERSONA_PRESETS.midCareer;

// ---------------------------------------------------------------------------
// Saved scenarios
// ---------------------------------------------------------------------------

export interface SavedScenario {
  id: string;
  name: string;
  profile: ProfileInputs;
  createdAt: number;
}

interface PlannerState {
  profile: ProfileInputs;
  scenarios: SavedScenario[];
  onboarded: boolean;

  setProfile: (patch: Partial<ProfileInputs>) => void;
  replaceProfile: (profile: ProfileInputs) => void;
  loadPersona: (persona: "young" | "midCareer" | "preRetiree") => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;

  // Assets
  addAsset: (a: Omit<Asset, "id">) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  // Liabilities
  addLiability: (l: Omit<Liability, "id">) => void;
  updateLiability: (id: string, patch: Partial<Liability>) => void;
  removeLiability: (id: string) => void;

  // Goals
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Income sources
  addIncome: (i: Omit<IncomeSource, "id">) => void;
  updateIncome: (id: string, patch: Partial<IncomeSource>) => void;
  removeIncome: (id: string) => void;

  // Scenarios
  saveScenario: (name: string) => void;
  deleteScenario: (id: string) => void;
  loadScenario: (id: string) => void;

  // Sync (backend) helpers
  setScenarios: (scenarios: SavedScenario[]) => void;
  replaceScenarioId: (oldId: string, next: SavedScenario) => void;
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      scenarios: [],
      onboarded: false,

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      replaceProfile: (profile) => set({ profile }),
      loadPersona: (persona) =>
        set({ profile: { ...PERSONA_PRESETS[persona], name: get().profile.name } }),
      setOnboarded: (v) => set({ onboarded: v }),
      reset: () => set({ profile: DEFAULT_PROFILE, scenarios: [], onboarded: false }),

      addAsset: (a) => set((s) => ({ profile: { ...s.profile, assets: [...s.profile.assets, { ...a, id: uid("a") }] } })),
      updateAsset: (id, patch) =>
        set((s) => ({ profile: { ...s.profile, assets: s.profile.assets.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeAsset: (id) => set((s) => ({ profile: { ...s.profile, assets: s.profile.assets.filter((x) => x.id !== id) } })),

      addLiability: (l) => set((s) => ({ profile: { ...s.profile, liabilities: [...s.profile.liabilities, { ...l, id: uid("l") }] } })),
      updateLiability: (id, patch) =>
        set((s) => ({ profile: { ...s.profile, liabilities: s.profile.liabilities.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeLiability: (id) => set((s) => ({ profile: { ...s.profile, liabilities: s.profile.liabilities.filter((x) => x.id !== id) } })),

      addGoal: (g) => set((s) => ({ profile: { ...s.profile, goals: [...s.profile.goals, { ...g, id: uid("g") }] } })),
      updateGoal: (id, patch) =>
        set((s) => ({ profile: { ...s.profile, goals: s.profile.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeGoal: (id) => set((s) => ({ profile: { ...s.profile, goals: s.profile.goals.filter((x) => x.id !== id) } })),

      addIncome: (i) => set((s) => ({ profile: { ...s.profile, incomeSources: [...s.profile.incomeSources, { ...i, id: uid("i") }] } })),
      updateIncome: (id, patch) =>
        set((s) => ({ profile: { ...s.profile, incomeSources: s.profile.incomeSources.map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      removeIncome: (id) => set((s) => ({ profile: { ...s.profile, incomeSources: s.profile.incomeSources.filter((x) => x.id !== id) } })),

      saveScenario: (name) =>
        set((s) => ({
          scenarios: [
            ...s.scenarios,
            { id: uid("sc"), name, profile: JSON.parse(JSON.stringify(s.profile)), createdAt: Date.now() },
          ],
        })),
      deleteScenario: (id) => set((s) => ({ scenarios: s.scenarios.filter((x) => x.id !== id) })),
      loadScenario: (id) => {
        const sc = get().scenarios.find((x) => x.id === id);
        if (sc) set({ profile: JSON.parse(JSON.stringify(sc.profile)) });
      },

      setScenarios: (scenarios) => set({ scenarios }),
      replaceScenarioId: (oldId, next) =>
        set((s) => ({ scenarios: s.scenarios.map((x) => (x.id === oldId ? next : x)) })),
    }),
    {
      name: "retireai-store",
      version: 1,
    },
  ),
);
