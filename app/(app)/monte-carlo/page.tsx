"use client";

import * as React from "react";
import { Dices, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stat, SectionHeading, Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/field";
import { MonteCarloFanChart, HistogramChart } from "@/components/charts";
import { useResults } from "@/lib/use-results";
import { usePlanner } from "@/lib/store";
import { runMonteCarlo } from "@/lib/montecarlo";
import { MonteCarloResult } from "@/lib/types";
import { blendedReturn, blendedVolatility } from "@/lib/finance";
import { formatINR } from "@/lib/format";

export default function MonteCarloPage() {
  const { profile } = useResults();
  const { setProfile } = usePlanner();
  const [runs, setRuns] = React.useState(2000);
  const [result, setResult] = React.useState<MonteCarloResult | null>(null);
  const [running, setRunning] = React.useState(false);

  const defaultReturn = Math.round(blendedReturn(profile.assets) || profile.preRetirementReturn);
  const defaultVol = Math.round(blendedVolatility(profile.assets) || 15);

  const simulate = React.useCallback(() => {
    setRunning(true);
    // Defer so the spinner paints before the (synchronous) compute.
    setTimeout(() => {
      const r = runMonteCarlo(profile, { runs });
      setResult(r);
      setRunning(false);
    }, 50);
  }, [profile, runs]);

  React.useEffect(() => {
    simulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Monte Carlo Simulation"
        description="Markets are uncertain. We run thousands of randomized return paths to estimate your real probability of success."
        icon={<Dices className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Simulation Settings</CardTitle>
            <CardDescription>Return modeled as a normal distribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <NumberField label="Number of simulations" value={runs} onChange={setRuns} min={500} max={10000} step={500} slider />
            <NumberField label="Expected return" value={profile.preRetirementReturn} onChange={(v) => setProfile({ preRetirementReturn: v })} min={6} max={16} step={0.5} slider suffix="%" hint={`Portfolio blend ≈ ${defaultReturn}%`} />
            <NumberField label="Portfolio volatility" value={defaultVol} onChange={() => {}} min={5} max={30} suffix="%" hint="Derived from your asset allocation (std-dev)." />
            <NumberField label="Inflation" value={profile.inflation} onChange={(v) => setProfile({ inflation: v })} min={3} max={12} step={0.5} slider suffix="%" />
            <Button className="w-full" onClick={simulate} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Simulating…" : `Run ${runs.toLocaleString("en-IN")} simulations`}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Success Probability"
                  value={`${result.successProbability}%`}
                  tone={result.successProbability >= 75 ? "success" : result.successProbability >= 50 ? "warning" : "danger"}
                  sub={`${result.runs.toLocaleString("en-IN")} runs`}
                />
                <Stat label="Median Corpus" value={formatINR(result.median)} tone="primary" sub="50th percentile" />
                <Stat label="Best Case" value={formatINR(result.best)} tone="success" sub="luckiest path" />
                <Stat label="Worst Case" value={formatINR(result.worst)} tone="danger" sub="unluckiest path" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Corpus Confidence Bands</CardTitle>
                  <CardDescription>Percentile range of outcomes over time (fan chart)</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonteCarloFanChart data={result.bands} />
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Outcome Distribution</CardTitle>
                    <CardDescription>Corpus at retirement across all runs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HistogramChart data={result.histogram} median={result.median} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Intervals</CardTitle>
                    <CardDescription>Where your corpus is likely to land</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Pessimistic (10th pct)", value: result.p10, tone: "danger" as const },
                      { label: "Conservative (25th pct)", value: result.p25, tone: "warning" as const },
                      { label: "Median (50th pct)", value: result.median, tone: "primary" as const },
                      { label: "Optimistic (75th pct)", value: result.p75, tone: "success" as const },
                      { label: "Best (90th pct)", value: result.p90, tone: "success" as const },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <Badge tone={row.tone}>{formatINR(row.value)}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
