import { AnalysisResult } from "@/types";
import GaugeChart from "@/components/GaugeChart";
import CommercialOpportunityCard from "@/components/CommercialOpportunityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultsHeroProps {
  companyName: string;
  result: AnalysisResult;
}

const bandBadge = {
  Green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  Amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  Red: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
} as const;

export default function ResultsHero({ companyName, result }: ResultsHeroProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <GaugeChart score={result.readiness.score} band={result.readiness.band} />

      <div className="space-y-6">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Funding Readiness Overview</p>
                <CardTitle className="mt-2 text-2xl sm:text-3xl">{companyName}</CardTitle>
              </div>
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${bandBadge[result.readiness.band]}`}>
                {result.readiness.band}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base leading-7 text-muted-foreground">{result.readiness.explanation}</p>
            <div className="grid gap-3">
              {result.why.map((reason) => (
                <div key={reason} className="rounded-2xl border bg-gradient-to-r from-primary/5 to-secondary/40 px-4 py-3 text-sm leading-6">
                  {reason}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CommercialOpportunityCard result={result} />
      </div>
    </div>
  );
}
