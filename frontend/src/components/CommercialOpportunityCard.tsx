import { ArrowUpRight, BadgeEuro, ShieldCheck } from "lucide-react";
import { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatPercentValue } from "@/lib/reportFormatting";

interface CommercialOpportunityCardProps {
  result: AnalysisResult;
}

export default function CommercialOpportunityCard({ result }: CommercialOpportunityCardProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-card to-sky-500/[0.08] shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeEuro className="h-5 w-5 text-emerald-600" />
          Funding Potential
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Potential Funding</p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCompactCurrency(result.commercial_opportunity.potential_amount_eur)}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Indicative Pricing From</p>
            <p className="mt-2 text-3xl font-semibold">
              {formatPercentValue(result.commercial_opportunity.indicative_rate_from_pct)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background/70 p-4">
          <p className="text-base font-semibold">{result.commercial_opportunity.headline}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {result.commercial_opportunity.supporting_copy}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-dashed bg-background/60 p-4 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
          <span>{result.commercial_opportunity.disclaimer}</span>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <ArrowUpRight className="h-4 w-4" />
          Our team can help you prepare the right next conversation with a lender or funding partner.
        </div>
      </CardContent>
    </Card>
  );
}
