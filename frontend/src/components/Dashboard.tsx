import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  if (key === "working_capital_cycle_days") return `${value.toFixed(1)} days`;
  if (percentageMetrics.has(key)) return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(2);
}

function formatScenarioValue(unit: string, value: number): string {
  if (unit === "days") return `${value.toFixed(1)} days`;
  if (unit === "months") return `${value.toFixed(1)} months`;
  if (unit === "percent") return `${(value * 100).toFixed(1)}%`;
  if (unit === "currency") return `€${value.toLocaleString()}`;
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

// Skeleton shimmer card
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border-0 bg-card shadow-soft ${className}`}>
      <div className="p-6 space-y-3">
        <div className="h-4 w-1/3 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-4/5 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-3/5 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// Animation variants
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function Dashboard({
  result,
  loading,
  simulationLoading,
  onSimulate,
  canSimulate,
}: DashboardProps) {
  const [scenario, setScenario] = useState<WhatIfScenario>(emptyScenario);

  useEffect(() => {
    if (result) setScenario(result.what_if.levers);
  }, [result]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2 flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          Running country-aware readiness analysis…
        </div>
      </motion.div>
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
    <AnimatePresence mode="wait">
      <motion.div
        key={result.readiness.score}
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Gauge + Summary */}
        <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <GaugeChart score={result.readiness.score} band={result.readiness.band} />

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Readiness Summary</CardTitle>
                <motion.span
                  key={result.readiness.band}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${bandBadge[result.readiness.band]}`}
                >
                  {result.readiness.band}
                </motion.span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{result.readiness.explanation}</p>
              <div className="space-y-3">
                {result.why.map((reason, i) => (
                  <motion.div
                    key={reason}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl border bg-gradient-to-r from-primary/5 to-secondary/50 px-4 py-3 text-sm leading-6"
                  >
                    {reason}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blockers / Mitigants / Pathways */}
        <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-3">
          <Card className="border-0 shadow-soft">
            <CardHeader><CardTitle>Top Blockers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.top_blockers.map((blocker, i) => (
                <motion.div
                  key={blocker.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium">{blocker.title}</p>
                    <SeverityPill severity={blocker.severity} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{blocker.detail}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader><CardTitle>Mitigants</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.mitigants.map((mitigant, i) => (
                <motion.div
                  key={mitigant}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{mitigant}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader><CardTitle>Scheme Pathways</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.scheme_pathways.map((pathway, i) => (
                <motion.div
                  key={pathway.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border p-4"
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <p className="font-medium">{pathway.name}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {pathway.channel}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{pathway.fit_reason}</p>
                  <p className="mt-2 text-sm leading-6">{pathway.next_step}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ratio cards */}
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ratioCards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-soft">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                    <Landmark className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold">{formatRatio(card.key, result.ratios[card.key] ?? 0)}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Docs & Stress / Local Artifacts */}
        <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-0 shadow-soft">
            <CardHeader><CardTitle>Documentation & Stress Tests</CardTitle></CardHeader>
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
            <CardHeader><CardTitle>Documents & Local Artifacts</CardTitle></CardHeader>
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
        </motion.div>

        {/* What-If Simulator */}
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>What-If Simulator</CardTitle>
                <motion.span
                  key={result.what_if.readiness_band}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${bandBadge[result.what_if.readiness_band]}`}
                >
                  {result.what_if.band_drift}
                </motion.span>
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, price_margin_change_pct: Number(e.target.value) || 0 }))
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, payroll_change_pct: Number(e.target.value) || 0 }))
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, interest_rate_shock_bps: Number(e.target.value) || 0 }))
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, dso_change_days: Number(e.target.value) || 0 }))
                    }
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, inventory_change_days: Number(e.target.value) || 0 }))
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
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, debt_term_change_months: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="capex_timing">Capex Timing</Label>
                  <select
                    id="capex_timing"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                    value={scenario.capex_timing}
                    onChange={(e) =>
                      setScenario((s) => ({
                        ...s,
                        capex_timing: e.target.value as WhatIfScenario["capex_timing"],
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
                  {simulationLoading ? "Running scenario…" : "Run scenario"}
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
                Allowed ranges: margin <code>-20</code> to <code>20</code>, payroll <code>-30</code> to <code>30</code>,
                DSO/inventory <code>-60</code> to <code>60</code> days, debt term <code>-24</code> to <code>60</code>{" "}
                months, and interest shock <code>-500</code> to <code>500</code> bps.
              </p>

              <div className="rounded-2xl border bg-accent/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="font-medium">Scenario score {result.what_if.readiness_score} / 100</p>
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
                      Scenario:{" "}
                      <span className="font-medium">{formatScenarioValue(metric.unit, metric.scenario)}</span>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
