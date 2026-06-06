"use client";

import * as React from "react";
import { Bot, Send, Sparkles, User, Lightbulb, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeading, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResults } from "@/lib/use-results";
import { askCoach, SUGGESTED_QUESTIONS, CoachAnswer } from "@/lib/coach";
import { generateRecommendations } from "@/lib/recommendations";
import {
  netWorth,
  totalAssets,
  equityAllocationPct,
  savingsRatePct,
} from "@/lib/finance";
import { useAuth, isAuthEnabled } from "@/lib/auth";
import { api } from "@/lib/api";
import { ProfileInputs, RetirementResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "coach";
  text?: string;
  answer?: CoachAnswer; // rule-based structured answer
  markdown?: string; // AI free-text answer
}

/** Build the grounding context sent to the Claude-powered coach. */
function buildContext(profile: ProfileInputs, result: RetirementResult): Record<string, unknown> {
  return {
    name: profile.name || undefined,
    persona: profile.persona,
    currentAge: profile.currentAge,
    retirementAge: profile.retirementAge,
    lifeExpectancy: profile.lifeExpectancy,
    annualExpensesToday: profile.annualExpenses,
    annualIncome: profile.annualIncome,
    monthlyInvestment: profile.monthlyInvestment,
    sipStepUpPct: profile.sipStepUp,
    inflationPct: profile.inflation,
    preRetirementReturnPct: profile.preRetirementReturn,
    postRetirementReturnPct: profile.postRetirementReturn,
    savingsRatePct: Math.round(savingsRatePct(profile)),
    equityAllocationPct: Math.round(equityAllocationPct(profile.assets)),
    netWorth: netWorth(profile.assets, profile.liabilities),
    totalInvestableAssets: totalAssets(profile.assets),
    requiredCorpus: Math.round(result.requiredCorpus),
    projectedCorpus: Math.round(result.projectedCorpus),
    surplusOrShortfall: Math.round(result.surplus),
    expenseAtRetirementPerYear: Math.round(result.expenseAtRetirement),
    readinessScore: result.readinessScore,
    successProbabilityPct: result.successProbability,
    additionalMonthlySipToCloseGap: Math.round(result.additionalMonthlySip),
    corpusDepletionAge: result.depletionAge,
    yearsToRetirement: result.yearsToRetire,
    topRecommendations: generateRecommendations(profile, result).slice(0, 3).map((r) => r.title),
  };
}

export default function CoachPage() {
  const { profile, result } = useResults();
  const token = useAuth((s) => s.token);
  const [aiAvailable, setAiAvailable] = React.useState<boolean | null>(null);
  const [pending, setPending] = React.useState(false);

  const useAI = !!token && aiAvailable === true;

  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "coach",
      answer: {
        headline: `Hi${profile.name ? `, ${profile.name}` : ""}! I'm your AI retirement coach 👋`,
        body: [
          `Your readiness score is ${result.readinessScore}/100 with a ${result.successProbability}% probability of success.`,
          "Ask me anything about your retirement — when you can retire, whether you're saving enough, or how inflation affects your plan.",
        ],
        followUps: SUGGESTED_QUESTIONS.slice(0, 4),
        tone: result.readinessScore >= 75 ? "positive" : "neutral",
      },
    },
  ]);
  const [input, setInput] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);

  // Detect whether the Claude-powered coach is configured on the backend.
  React.useEffect(() => {
    if (!token) {
      setAiAvailable(false);
      return;
    }
    let cancelled = false;
    api
      .coachStatus()
      .then((s) => !cancelled && setAiAvailable(s.available))
      .catch(() => !cancelled && setAiAvailable(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = async (q: string) => {
    const query = q.trim();
    if (!query || pending) return;
    setInput("");

    const priorHistory = messages
      .filter((m) => m.text || m.markdown || m.answer)
      .map((m) => ({
        role: m.role,
        text: m.text ?? m.markdown ?? m.answer?.body.join(" ") ?? "",
      }));

    setMessages((m) => [...m, { role: "user", text: query }]);

    if (useAI) {
      setPending(true);
      try {
        const { answer } = await api.coach(query, buildContext(profile, result), priorHistory.slice(-8));
        setMessages((m) => [...m, { role: "coach", markdown: answer }]);
      } catch {
        // Fall back to the offline rule-based coach on any API failure.
        const fallback = askCoach(query, profile, result);
        setMessages((m) => [...m, { role: "coach", answer: fallback }]);
      } finally {
        setPending(false);
      }
    } else {
      const answer = askCoach(query, profile, result);
      setMessages((m) => [...m, { role: "coach", answer }]);
    }
  };

  const recs = generateRecommendations(profile, result);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="AI Retirement Coach"
        description="Ask questions in plain English and get personalized, quantified answers grounded in your actual plan."
        icon={<Bot className="h-5 w-5" />}
        action={
          useAI ? (
            <Badge tone="primary"><Sparkles className="h-3.5 w-3.5" /> Powered by Claude</Badge>
          ) : (
            <Badge tone="default">Offline coach</Badge>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Chat */}
        <Card className="flex h-[70vh] flex-col">
          <CardContent className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pt-6">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.role === "coach" ? "bg-gradient-to-br from-primary to-purple-500 text-white" : "bg-secondary")}>
                  {m.role === "coach" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </span>
                <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "text-right")}>
                  {m.text && (
                    <div className="inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      {m.text}
                    </div>
                  )}
                  {m.answer && <CoachBubble answer={m.answer} onFollowUp={send} />}
                  {m.markdown && <AICoachBubble text={m.markdown} />}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking through your plan…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </CardContent>
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your retirement…"
                className="flex-1"
                disabled={pending}
              />
              <Button type="submit" size="icon" aria-label="Send" disabled={pending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={pending}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Action plan */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" /> Your Action Plan</CardTitle>
            <CardDescription>Prioritized by estimated impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.length === 0 && (
              <p className="text-sm text-muted-foreground">You're in excellent shape — keep investing consistently! 🎉</p>
            )}
            {recs.map((r, i) => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.rationale}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium text-success">{r.impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              <Sparkles className="mb-1 inline h-3.5 w-3.5 text-primary" />{" "}
              {useAI ? (
                <>Answers are generated by Claude (claude-opus-4-8), grounded in your live plan figures.</>
              ) : isAuthEnabled && !token ? (
                <>You're using the built-in offline coach. Sign in to chat with the Claude-powered coach.</>
              ) : (
                <>Answers are generated locally from your plan. Set <code className="rounded bg-background px-1">ANTHROPIC_API_KEY</code> on the API to enable the Claude-powered coach.</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CoachBubble({ answer, onFollowUp }: { answer: CoachAnswer; onFollowUp: (q: string) => void }) {
  const toneClass =
    answer.tone === "positive" ? "border-success/30" : answer.tone === "caution" ? "border-warning/30" : "border-border";
  return (
    <div className={cn("rounded-2xl rounded-tl-sm border bg-card p-4 text-left", toneClass)}>
      <p className="font-semibold">{answer.headline}</p>
      <div className="mt-2 space-y-1.5">
        {answer.body.map((b, i) => (
          <p key={i} className="text-sm text-muted-foreground">{b}</p>
        ))}
      </div>
      {answer.followUps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {answer.followUps.map((f) => (
            <button
              key={f}
              onClick={() => onFollowUp(f)}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Renders Claude's free-text answer: paragraphs + simple "-" bullet lists. */
function AICoachBubble({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="rounded-2xl rounded-tl-sm border border-primary/30 bg-card p-4 text-left">
      <div className="space-y-1.5 text-sm text-foreground/90">
        {lines.map((line, i) =>
          /^[-*•]\s+/.test(line) ? (
            <div key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">{line.replace(/^[-*•]\s+/, "")}</span>
            </div>
          ) : (
            <p key={i} className={i === 0 ? "font-semibold" : "text-muted-foreground"}>{line}</p>
          ),
        )}
      </div>
    </div>
  );
}
