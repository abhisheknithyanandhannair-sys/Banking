import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import GaugeChart from "./GaugeChart";
import { AnalysisResult, ReadinessBand, WhatIfScenario, emptyScenario } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DashboardProps {
  result: AnalysisResult | null;
  loading: boolean;
  simulationLoading: boolean;
  onSimulate: (scenario: WhatIfScenario) => Promise<void>;
  canSimulate: boolean;
}

const percentageMetrics = new Set(["gross_margin", "operating_margin", "net_margin", "roa", "roe", "liabilities_to_assets"]);

const ratioCards = [
  { key: "current_ratio", label: "Current Ratio" },
  { key: "quick_ratio", label: "Quick Ratio" },
  { key: "debt_to_equity", label: "Debt / Equity" },
  { key: "interest_coverage", label: "Interest Coverage" },
  { key: "dscr_proxy", label: "DSCR Proxy" },
  { key: "gross_margin", label: "Gross Margin" },
  { key: "net_margin", label: "Net Margin" },
  { key: "working_capital_cycle_days", label: "Working Capital Cycle" },
];

const bandBadge: Record<ReadinessBand, string> = {
  Green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  Amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  Red: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
};

function formatRatio(key: string, value: number): string {
  if (key === "working_capital_cycle_days") {
    return `${value.toFixed(1)} days`;
  }
  if (percentageMetrics.has(key)) {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value.toFixed(2);
}

function formatScenarioValue(unit: string, value: number): string {
  if (unit === "days") {
    return `${value.toFixed(1)} days`;
  }
  if (unit === "months") {
    return `${value.toFixed(1)} months`;
  }
  if (unit === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === "currency") {
    return `€${value.toLocaleString()}`;
  }
  return value.toFixed(2);
}

function SeverityPill({ severity }: { severity: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    low: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  }[severity];

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{severity}</span>;
}

export default function Dashboard({
  result,
  loading,
  simulationLoading,
  onSimulate,
  canSimulate,
}: DashboardProps) {
  const [scenario, setScenario] = useState<WhatIfScenario>(emptyScenario);

  useEffect(() => {
    if (result) {
      setScenario(result.what_if.levers);
    }
  }, [result]);

  if (loading) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Running the country-aware readiness analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold">Dashboard ready</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Analyze an SME case to generate the readiness band, blockers, mitigants, documents, local artifacts, and
              what-if drift.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <GaugeChart score={result.readiness.score} band={result.readiness.band} />

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Readiness Summary</CardTitle>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${bandBadge[result.readiness.band]}`}>
                {result.readiness.band}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">{result.readiness.explanation}</p>
            <div className="space-y-3">
              {result.why.map((reason) => (
                <div
                  key={reason}
                  className="rounded-2xl border bg-gradient-to-r from-primary/5 to-secondary/50 px-4 py-3 text-sm leading-6"
                >
                  {reason}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Top Blockers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.top_blockers.map((blocker) => (
              <div key={blocker.title} className="rounded-2xl border p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium">{blocker.title}</p>
                  <SeverityPill severity={blocker.severity} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{blocker.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Mitigants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.mitigants.map((mitigant) => (
              <div key={mitigant} className="flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>{mitigant}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Scheme Pathways</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.scheme_pathways.map((pathway) => (
              <div key={pathway.name} className="rounded-2xl border p-4">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="font-medium">{pathway.name}</p>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {pathway.channel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{pathway.fit_reason}</p>
                <p className="mt-2 text-sm leading-6">{pathway.next_step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ratioCards.map((card) => (
          <Card key={card.key} className="border-0 shadow-soft">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Landmark className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-semibold">{formatRatio(card.key, result.ratios[card.key] ?? 0)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Documentation & Stress Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-accent/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium">Documentation score</p>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {result.documentation.score}/100
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{result.documentation.summary}</p>
            </div>

            {result.documentation.missing_items.length ? (
              <div className="space-y-2">
                {result.documentation.missing_items.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {result.cashflow.stress_tests.map((stress) => (
              <div key={stress.name} className="rounded-2xl border p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium">{stress.name}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${bandBadge[stress.readiness_band]}`}>
                    {stress.readiness_band}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{stress.headline}</p>
                <p className="mt-2 text-sm">
                  DSCR {stress.dscr_proxy.toFixed(2)}x, runway {stress.liquidity_runway_months.toFixed(1)} months
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Documents & Local Artifacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {result.document_pack.map((item) => (
                <div key={item.item} className="rounded-2xl border p-4">
                  <div className="mb-1 flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="font-medium">{item.item}</p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {result.local_artifacts.map((artifact) => (
                <div key={artifact.artifact} className="rounded-2xl border bg-accent/30 p-4">
                  <p className="font-medium">{artifact.artifact}</p>
                  <p className="mt-2 text-sm leading-6">{artifact.what_it_means}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Not the same as: {artifact.what_it_does_not_mean}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>What-If Simulator</CardTitle>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${bandBadge[result.what_if.readiness_band]}`}>
              {result.what_if.band_drift}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price_margin_change_pct">Price / Margin %</Label>
              <Input
                id="price_margin_change_pct"
                type="number"
                min="-20"
                max="20"
                step="0.1"
                value={scenario.price_margin_change_pct}
                onChange={(event) =>
                  setScenario((current) => ({ ...current, price_margin_change_pct: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll_change_pct">Payroll %</Label>
              <Input
                id="payroll_change_pct"
                type="number"
                min="-30"
                max="30"
                step="0.1"
                value={scenario.payroll_change_pct}
                onChange={(event) =>
                  setScenario((current) => ({ ...current, payroll_change_pct: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate_shock_bps">Interest Shock (bps)</Label>
              <Input
                id="interest_rate_shock_bps"
                type="number"
                min="-500"
                max="500"
                step="1"
                value={scenario.interest_rate_shock_bps}
                onChange={(event) =>
                  setScenario((current) => ({ ...current, interest_rate_shock_bps: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dso_change_days">DSO Change (days)</Label>
              <Input
                id="dso_change_days"
                type="number"
                min="-60"
                max="60"
                step="1"
                value={scenario.dso_change_days}
                onChange={(event) => setScenario((current) => ({ ...current, dso_change_days: Number(event.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory_change_days">Inventory Change (days)</Label>
              <Input
                id="inventory_change_days"
                type="number"
                min="-60"
                max="60"
                step="1"
                value={scenario.inventory_change_days}
                onChange={(event) =>
                  setScenario((current) => ({ ...current, inventory_change_days: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt_term_change_months">Debt Term Change (months)</Label>
              <Input
                id="debt_term_change_months"
                type="number"
                min="-24"
                max="60"
                step="1"
                value={scenario.debt_term_change_months}
                onChange={(event) =>
                  setScenario((current) => ({ ...current, debt_term_change_months: Number(event.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="capex_timing">Capex Timing</Label>
              <select
                id="capex_timing"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                value={scenario.capex_timing}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    capex_timing: event.target.value as WhatIfScenario["capex_timing"],
                  }))
                }
              >
                <option value="neutral">Neutral</option>
                <option value="defer">Defer capex</option>
                <option value="bring_forward">Bring capex forward</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => onSimulate(scenario)} disabled={!canSimulate || simulationLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {simulationLoading ? "Running scenario..." : "Run scenario"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setScenario(emptyScenario);
                onSimulate(emptyScenario);
              }}
              disabled={!canSimulate || simulationLoading}
            >
              Reset scenario
            </Button>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            Allowed ranges: margin `-20` to `20`, payroll `-30` to `30`, DSO/inventory `-60` to `60` days, debt term
            `-24` to `60` months, and interest shock `-500` to `500` bps.
          </p>

          <div className="rounded-2xl border bg-accent/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="font-medium">
                Scenario score {result.what_if.readiness_score} / 100
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{result.what_if.explanation}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {result.what_if.metrics.map((metric) => (
              <div key={metric.key} className="rounded-2xl border p-4">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-sm">
                  Baseline: <span className="font-medium">{formatScenarioValue(metric.unit, metric.baseline)}</span>
                </p>
                <p className="text-sm">
                  Scenario: <span className="font-medium">{formatScenarioValue(metric.unit, metric.scenario)}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="font-medium">Evidence expectations</p>
            {result.what_if.evidence_expectations.map((item) => (
              <div key={item} className="rounded-2xl border p-4 text-sm leading-6">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
