import { ProfileInputs, RetirementResult } from "./types";
import { projectRetirement, requiredCorpus, futureValue } from "./finance";
import { formatINR, formatPercent, formatYears } from "./format";
import { generateRecommendations } from "./recommendations";

export interface CoachAnswer {
  headline: string;
  body: string[];
  followUps: string[];
  tone: "positive" | "neutral" | "caution";
}

export const SUGGESTED_QUESTIONS = [
  "Can I retire at 50?",
  "Am I saving enough?",
  "Should I increase my SIP?",
  "What happens if inflation is 8%?",
  "Should I move to more debt funds?",
  "How much corpus do I need?",
  "What's my retirement readiness?",
  "When can I achieve financial independence?",
];

/**
 * Deterministic, explainable "AI" coach. Detects intent from the user's
 * question and answers using the live financial engine and the user's profile.
 *
 * This is fully offline and privacy-preserving. To upgrade to a generative LLM
 * (e.g. the Claude API), route `q` + a serialized profile summary through an
 * API route and stream the response — the rule-based answers below make a
 * strong fallback and grounding context.
 */
export function askCoach(q: string, p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const query = q.toLowerCase().trim();

  // --- Retire at specific age ---
  const ageMatch = query.match(/retire (?:at|by|when)?\s*(\d{2})/);
  if (ageMatch && /retire/.test(query)) {
    const targetAge = parseInt(ageMatch[1], 10);
    return answerRetireAt(p, targetAge);
  }

  // --- Inflation what-if ---
  const inflMatch = query.match(/inflation.*?(\d{1,2})\s*%?/) || query.match(/(\d{1,2})\s*%?\s*inflation/);
  if (inflMatch && /inflation/.test(query)) {
    return answerInflation(p, parseFloat(inflMatch[1]));
  }

  // --- Saving enough ---
  if (/saving enough|enough|on track|am i ok|doing well/.test(query)) {
    return answerOnTrack(p, r);
  }

  // --- Increase SIP ---
  if (/increase.*sip|invest more|save more|more sip|step.?up/.test(query)) {
    return answerIncreaseSip(p, r);
  }

  // --- Debt funds / allocation ---
  if (/debt fund|more debt|bonds|safer|de.?risk|reduce equity|conservative/.test(query)) {
    return answerDebtShift(p, r);
  }
  if (/more equity|aggressive|risky|increase equity/.test(query)) {
    return answerEquityShift(p, r);
  }

  // --- Corpus needed ---
  if (/how much|corpus|need|target/.test(query)) {
    return answerCorpus(p, r);
  }

  // --- Readiness ---
  if (/readiness|score|how am i|status/.test(query)) {
    return answerReadiness(p, r);
  }

  // --- FIRE / financial independence ---
  if (/fire|financial independence|independent|fi number/.test(query)) {
    return answerFire(p, r);
  }

  // --- Fallback: action plan ---
  return answerActionPlan(p, r);
}

function answerRetireAt(p: ProfileInputs, targetAge: number): CoachAnswer {
  if (targetAge <= p.currentAge) {
    return {
      headline: `You're already ${p.currentAge}`,
      body: [`A retirement age of ${targetAge} is at or before your current age. Try a target age beyond ${p.currentAge}.`],
      followUps: ["How much corpus do I need?", "Am I saving enough?"],
      tone: "neutral",
    };
  }
  const scenario = projectRetirement({ ...p, retirementAge: targetAge });
  const ok = scenario.surplus >= 0;
  return {
    headline: ok
      ? `Yes — retiring at ${targetAge} looks achievable ✅`
      : `Retiring at ${targetAge} needs more work ⚠️`,
    body: [
      `At ${targetAge}, you'd need a corpus of about ${formatINR(scenario.requiredCorpus)} (in future rupees) to cover inflation-adjusted expenses through age ${p.lifeExpectancy}.`,
      `On your current trajectory you're projected to have ${formatINR(scenario.projectedCorpus)} — a ${ok ? "surplus" : "shortfall"} of ${formatINR(Math.abs(scenario.surplus))}.`,
      ok
        ? `Estimated success probability: ${formatPercent(scenario.successProbability, 0)}. You have room to spare.`
        : `To close the gap, increase your monthly SIP by about ${formatINR(scenario.additionalMonthlySip)}, or delay retirement slightly.`,
    ],
    followUps: ["Should I increase my SIP?", "What happens if inflation is 8%?", "Compare retiring at 55 vs 60"],
    tone: ok ? "positive" : "caution",
  };
}

function answerInflation(p: ProfileInputs, inflation: number): CoachAnswer {
  const base = projectRetirement(p);
  const scenario = projectRetirement({ ...p, inflation });
  const delta = scenario.requiredCorpus - base.requiredCorpus;
  return {
    headline: `At ${inflation}% inflation, your target rises to ${formatINR(scenario.requiredCorpus)}`,
    body: [
      `Higher inflation makes future expenses larger. Your required corpus moves from ${formatINR(base.requiredCorpus)} (at ${p.inflation}%) to ${formatINR(scenario.requiredCorpus)} (at ${inflation}%) — an increase of ${formatINR(delta)}.`,
      `Your projected corpus stays ${formatINR(scenario.projectedCorpus)}, so your ${scenario.surplus >= 0 ? "surplus" : "shortfall"} becomes ${formatINR(Math.abs(scenario.surplus))}.`,
      scenario.surplus < 0
        ? `Consider equity-tilted investments (which historically beat inflation) and an extra SIP of ~${formatINR(scenario.additionalMonthlySip)}/month.`
        : `You'd still be on track even at ${inflation}% inflation. Solid resilience.`,
    ],
    followUps: ["Should I increase my SIP?", "Should I add more equity?", "Am I saving enough?"],
    tone: scenario.surplus >= 0 ? "positive" : "caution",
  };
}

function answerOnTrack(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const onTrack = r.readinessScore >= 75;
  const partial = r.readinessScore >= 50;
  return {
    headline: onTrack
      ? `You're on track — readiness ${r.readinessScore}/100 🎯`
      : partial
        ? `Decent start — readiness ${r.readinessScore}/100`
        : `Action needed — readiness ${r.readinessScore}/100`,
    body: [
      `Your projected corpus is ${formatINR(r.projectedCorpus)} against a target of ${formatINR(r.requiredCorpus)} — a ${r.surplus >= 0 ? "surplus" : "shortfall"} of ${formatINR(Math.abs(r.surplus))}.`,
      `Success probability is ${formatPercent(r.successProbability, 0)} and your money is projected to ${r.depletionAge ? `run low around age ${r.depletionAge}` : `comfortably last through age ${p.lifeExpectancy}`}.`,
      onTrack
        ? "Keep your SIPs consistent and review allocation yearly."
        : `The fastest lever: ${r.additionalMonthlySip > 0 ? `add ~${formatINR(r.additionalMonthlySip)}/month to your SIP.` : "maintain discipline and enable an annual step-up."}`,
    ],
    followUps: ["Show my action plan", "Should I increase my SIP?", "Can I retire earlier?"],
    tone: onTrack ? "positive" : partial ? "neutral" : "caution",
  };
}

function answerIncreaseSip(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const extra = 5000;
  const scenario = projectRetirement({ ...p, monthlyInvestment: p.monthlyInvestment + extra });
  const delta = scenario.projectedCorpus - r.projectedCorpus;
  return {
    headline: `Adding ${formatINR(extra)}/month → +${formatINR(delta)} corpus`,
    body: [
      `Raising your SIP from ${formatINR(p.monthlyInvestment)} to ${formatINR(p.monthlyInvestment + extra)} grows your projected corpus by ${formatINR(delta)} over ${formatYears(r.yearsToRetire)}.`,
      r.surplus < 0
        ? `You currently have a shortfall of ${formatINR(Math.abs(r.surplus))}. To fully close it, target an extra ${formatINR(r.additionalMonthlySip)}/month.`
        : `You're already in surplus, so extra SIP builds a buffer for inflation surprises or earlier retirement.`,
      "Tip: an annual 10% step-up often beats a one-time increase, since it scales with your salary.",
    ],
    followUps: ["What happens if inflation is 8%?", "Can I retire at 55?", "Show my action plan"],
    tone: "positive",
  };
}

function answerDebtShift(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const near = r.yearsToRetire <= 10;
  return {
    headline: near
      ? "Yes — shifting toward debt makes sense as you near retirement"
      : "Be cautious — too much debt this early can cost you growth",
    body: [
      near
        ? `With ${formatYears(r.yearsToRetire)} to retirement, gradually moving to debt/bonds protects your corpus from a market crash right before you start withdrawing (sequence-of-returns risk).`
        : `You have ${formatYears(r.yearsToRetire)} to go. Equity historically outpaces debt and inflation over long horizons — moving heavily to debt now may leave you short.`,
      `A common glide-path keeps equity near (100 − age) = ${Math.max(20, 100 - p.currentAge)}%. Rebalance once a year rather than timing the market.`,
      near
        ? "Consider a bucket strategy: 2-3 years of expenses in debt/liquid funds, the rest staying in growth assets."
        : "Keep a debt allocation for stability and rebalancing ammunition, but let equity drive growth.",
    ],
    followUps: ["What's my ideal asset allocation?", "Should I increase my SIP?", "What happens if inflation is 8%?"],
    tone: "neutral",
  };
}

function answerEquityShift(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  return {
    headline: r.yearsToRetire > 10 ? "A higher equity tilt can boost long-term growth" : "More equity adds risk this close to retirement",
    body: [
      `Over ${formatYears(r.yearsToRetire)}, equity's higher expected return (~12%) compounds meaningfully versus debt (~7%).`,
      `Guideline equity allocation for your age: ~${Math.max(20, 100 - p.currentAge)}%. Stay diversified across index/large-cap and flexi-cap funds.`,
      r.yearsToRetire <= 10 ? "Since you're within 10 years of retirement, cap the equity increase and keep a debt cushion." : "With a long runway, you can ride out volatility for the growth premium.",
    ],
    followUps: ["Should I move to more debt funds?", "Am I saving enough?"],
    tone: "neutral",
  };
}

function answerCorpus(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  return {
    headline: `You need about ${formatINR(r.requiredCorpus)} by age ${p.retirementAge}`,
    body: [
      `Your expenses today are ${formatINR(p.annualExpenses)}/yr. At ${p.inflation}% inflation, that grows to ${formatINR(r.expenseAtRetirement)}/yr by retirement.`,
      `To fund that (rising with inflation) through age ${p.lifeExpectancy}, you need a corpus of ${formatINR(r.requiredCorpus)}.`,
      `You're projected to reach ${formatINR(r.projectedCorpus)} — a ${r.surplus >= 0 ? "surplus" : "shortfall"} of ${formatINR(Math.abs(r.surplus))}.`,
    ],
    followUps: ["Am I saving enough?", "Should I increase my SIP?", "Can I retire at 55?"],
    tone: r.surplus >= 0 ? "positive" : "caution",
  };
}

function answerReadiness(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  return answerOnTrack(p, r);
}

function answerFire(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const fireNumber = p.annualExpenses / 0.04;
  const target25x = requiredCorpus(futureValue(p.annualExpenses, p.inflation, 0), 4, 0, 30);
  void target25x;
  return {
    headline: `Your FIRE number is ~${formatINR(fireNumber)} (25× expenses)`,
    body: [
      `Financial independence at a 4% safe withdrawal rate needs ${formatINR(fireNumber)} in today's terms.`,
      `Your investable corpus today is ${formatINR(r.projection[0]?.corpus ?? 0)}. Keep investing ${formatINR(p.monthlyInvestment)}/month to get there.`,
      "Explore Lean / Regular / Fat FIRE in the FIRE Calculator to see how lifestyle changes shift your timeline.",
    ],
    followUps: ["When can I achieve financial independence?", "Should I increase my SIP?"],
    tone: "neutral",
  };
}

function answerActionPlan(p: ProfileInputs, r: RetirementResult): CoachAnswer {
  const recs = generateRecommendations(p, r).slice(0, 4);
  return {
    headline: "Here's your personalized action plan",
    body:
      recs.length > 0
        ? recs.map((rec, i) => `${i + 1}. ${rec.title} — ${rec.impact}.`)
        : ["You're in great shape! Keep investing consistently and review your plan annually."],
    followUps: ["Am I saving enough?", "Can I retire at 55?", "What happens if inflation is 8%?"],
    tone: r.readinessScore >= 75 ? "positive" : "neutral",
  };
}
