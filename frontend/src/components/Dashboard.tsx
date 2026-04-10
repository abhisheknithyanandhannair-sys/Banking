import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Landmark,
  Minus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GaugeChart from "./GaugeChart";
import { AnalysisResult, PeerMetric, ReadinessBand, WhatIfScenario, emptyScenario } from "@/types";
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
  showHero?: boolean;
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

const directionBadgeStyles = {
  up: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  flat: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
  down: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  mixed: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
} as const;

function formatRatio(key: string, value: number): string {
  if (key === "working_capital_cycle_days") return `${value.toFixed(1)} days`;
  if (percentageMetrics.has(key)) return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(2);
}

function formatScenarioValue(unit: string, value: number): string {
  if (unit === "days") return `${value.toFixed(1)} days`;
  if (unit === "months") return `${value.toFixed(1)} months`;
  if (unit === "percent") return `${(value * 100).toFixed(1)}%`;
  if (unit === "currency") return `EUR ${value.toLocaleString()}`;
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

type PeerRating = "above_average" | "average" | "below_average";

function PeerRatingPill({ rating }: { rating: PeerRating }) {
  const config: Record<PeerRating, { label: string; styles: string }> = {
    above_average: {
      label: "Above average",
      styles: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    },
    average: {
      label: "Average",
      styles: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
    },
    below_average: {
      label: "Below average",
      styles: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    },
  };
  const { label, styles } = config[rating];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{label}</span>;
}

function PeerMetricRow({ metric, index }: { metric: PeerMetric; index: number }) {
  const Icon =
    metric.rating === "above_average" ? TrendingUp :
    metric.rating === "below_average" ? TrendingDown : Minus;

  const iconColor =
    metric.rating === "above_average" ? "text-emerald-600" :
    metric.rating === "below_average" ? "text-amber-500" : "text-slate-400";

  const gapLabel = metric.gap_pct === 0
    ? "At peer average"
    : `${metric.gap_pct > 0 ? "+" : ""}${metric.gap_pct.toFixed(1)}% vs peers`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center justify-between gap-4 rounded-2xl border p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{metric.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{gapLabel}</p>
      </div>
      <div className="shrink-0 space-y-1 text-right">
        <p className="text-sm font-semibold">{metric.your_value_formatted}</p>
        <p className="text-xs text-muted-foreground">Peers: {metric.peer_average_formatted}</p>
      </div>
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
    </motion.div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border-0 bg-card shadow-soft ${className}`}>
      <div className="space-y-3 p-6">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-2xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">{message}</p>;
}

function DirectionPill({ direction }: { direction: string }) {
  const labelMap = {
    up: "Improving",
    flat: "Stable",
    down: "Softening",
    mixed: "Mixed",
  } as const;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${directionBadgeStyles[direction as keyof typeof directionBadgeStyles]}`}>
      {labelMap[direction as keyof typeof labelMap] ?? direction}
    </span>
  );
}

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
  showHero = true,
}: DashboardProps) {
  const [scenario, setScenario] = useState<WhatIfScenario>(emptyScenario);

  useEffect(() => {
    if (result) setScenario(result.what_if.levers);
  }, [result]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          Preparing your funding readiness report...
        </div>
      </motion.div>
    );
  }

  if (!result) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="flex min-h-[420px] items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold">Your report will appear here</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Complete the business information and financial history to generate your funding-readiness assessment and
              recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={result.readiness.score} variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {showHero ? (
          <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
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
                  {result.why.map((reason, index) => (
                    <motion.div
                      key={reason}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.07 }}
                      className="rounded-2xl border bg-gradient-to-r from-primary/5 to-secondary/50 px-4 py-3 text-sm leading-6"
                    >
                      {reason}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-3">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Main points to address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.top_blockers.length ? result.top_blockers.map((blocker, index) => (
                <motion.div
                  key={blocker.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-2xl border p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium">{blocker.title}</p>
                    <SeverityPill severity={blocker.severity} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{blocker.detail}</p>
                </motion.div>
              )) : <EmptyState message="No critical issues are currently leading the assessment." />}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Strengths supporting the case</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.mitigants.length ? result.mitigants.map((mitigant, index) => (
                <motion.div
                  key={mitigant}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{mitigant}</span>
                </motion.div>
              )) : <EmptyState message="The current business profile already shows a solid set of supporting strengths." />}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Recommended funding routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.scheme_pathways.length ? result.scheme_pathways.map((pathway, index) => (
                <motion.div
                  key={pathway.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
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
              )) : <EmptyState message="No specific funding route has been highlighted for this business yet." />}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Three-year business performance</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <DirectionPill direction={result.historical_analysis.revenue_direction} />
                  <DirectionPill direction={result.historical_analysis.margin_direction} />
                  <DirectionPill direction={result.historical_analysis.liquidity_direction} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">{result.historical_analysis.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {result.historical_analysis.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-2xl border bg-accent/30 p-4 text-sm leading-6">
                    {bullet}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ratioCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
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

        <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle>Documents and resilience checks</CardTitle>
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
              ) : (
                <EmptyState message="Documentation is broadly complete, so no major missing-item alerts are open." />
              )}

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
              <CardTitle>Documents and local records</CardTitle>
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
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Planning scenarios</CardTitle>
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
                    onChange={(event) =>
                      setScenario((current) => ({ ...current, dso_change_days: Number(event.target.value) || 0 }))
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
                    void onSimulate(emptyScenario);
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
                      Scenario: <span className="font-medium">{formatScenarioValue(metric.unit, metric.scenario)}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="font-medium">What lenders may ask for</p>
                {result.what_if.evidence_expectations.map((item) => (
                  <div key={item} className="rounded-2xl border p-4 text-sm leading-6">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Peer comparison</CardTitle>
                <PeerRatingPill rating={result.peer_benchmark.overall_peer_rating} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3 rounded-2xl border bg-accent/40 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{result.peer_benchmark.above_average_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Above average</p>
                </div>
                <div className="border-x text-center">
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{result.peer_benchmark.average_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">At average</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{result.peer_benchmark.below_average_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Below average</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Comparing against{" "}
                <span className="font-medium capitalize">{result.peer_benchmark.sector.replace(/_/g, " ")}</span> peers
                in <span className="font-medium capitalize">{result.peer_benchmark.country}</span>.
              </p>

              <div className="space-y-2">
                {result.peer_benchmark.metrics.map((metric, index) => (
                  <PeerMetricRow key={metric.key} metric={metric} index={index} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
