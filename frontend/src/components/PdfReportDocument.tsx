import type { ReactNode } from "react";
import { ApplicationSnapshot } from "@/types";
import { getIndustryLabel, getSubIndustryLabel, formatSectorLabel } from "@/lib/industries";
import { formatCurrency, formatPercentValue, formatRatioValue } from "@/lib/reportFormatting";
import logoSrc from "@/assets/fundable-logo-tight.png";

interface PdfReportDocumentProps {
  snapshot: ApplicationSnapshot;
  agentPrompt: string;
  onPageRef: (index: number, node: HTMLDivElement | null) => void;
}

function SmallCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white p-5 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

export default function PdfReportDocument({ snapshot, agentPrompt, onPageRef }: PdfReportDocumentProps) {
  const { registration, latestInput, result } = snapshot;
  const countrySignals =
    latestInput.country === "ireland"
      ? [
          `CCR arrears: ${latestInput.country_context.ireland.ccr_arrears ? "Yes" : "No"}`,
          `CCR restructures: ${latestInput.country_context.ireland.ccr_restructures ? "Yes" : "No"}`,
          `SBCI eligible: ${latestInput.sbci_eligible ? "Yes" : "No"}`,
        ]
      : latestInput.country === "spain"
        ? [
            `CIRBE exposure: ${formatCurrency(latestInput.country_context.spain.cirbe_total_exposure)}`,
            `Requested maturity: ${latestInput.country_context.spain.requested_maturity_months} months`,
            `Collateral notes: ${latestInput.country_context.spain.collateral_maturity_notes || "None provided"}`,
          ]
        : latestInput.country === "france"
          ? [
              `BdF reference: ${latestInput.country_context.france.bdf_turnover_letter || "-"}${latestInput.country_context.france.bdf_credit_score_digit || ""}`,
              `FIBEN score: ${latestInput.fiben_score}`,
              `Bpifrance guarantee: ${latestInput.country_context.france.wants_bpifrance_guarantee ? "Yes" : "No"}`,
            ]
          : latestInput.country === "netherlands"
            ? [
                `Legal form: ${latestInput.country_context.netherlands.legal_form}`,
                `BKR events present: ${latestInput.country_context.netherlands.bkr_events_present ? "Yes" : "No"}`,
              ]
            : [
                `Register extract: ${latestInput.country_context.germany.company_register_extract_available ? "Yes" : "No"}`,
                `Filed accounts visible: ${latestInput.country_context.germany.company_register_accounts_available ? "Yes" : "No"}`,
                `KfW route requested: ${latestInput.country_context.germany.wants_kfw_route ? "Yes" : "No"}`,
              ];

  return (
    <div className="pointer-events-none fixed -left-[9999px] top-0 z-[-1]">
      <div
        ref={(node) => onPageRef(0, node)}
        className="mb-8 flex min-h-[1123px] w-[794px] flex-col gap-6 bg-white p-10 text-slate-900"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center justify-center rounded-[1.5rem] border border-slate-200 bg-emerald-50 px-5 py-3">
              <img
                src={logoSrc}
                alt="Fundable logo"
                loading="eager"
                decoding="sync"
                crossOrigin="anonymous"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">Funding Readiness Report</p>
            <h1 className="mt-4 text-4xl font-semibold">{registration.companyName}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Prepared from three years of financial history, recent trading data, and country-specific funding
              signals.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 px-6 py-5 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Readiness Band</p>
            <p className="mt-3 text-5xl font-semibold">{result.readiness.score}</p>
            <p className="mt-2 text-lg font-medium text-emerald-700">{result.readiness.band}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <SmallCard title="Readiness Summary">
            <p className="text-base leading-7">{result.readiness.explanation}</p>
            <div className="mt-4 space-y-3">
              {result.why.map((reason) => (
                <div key={reason} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {reason}
                </div>
              ))}
            </div>
          </SmallCard>

          <SmallCard title="Funding Potential">
            <p className="text-xl font-semibold">{result.commercial_opportunity.headline}</p>
            <p className="mt-4">{result.commercial_opportunity.supporting_copy}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Potential funding: {formatCurrency(result.commercial_opportunity.potential_amount_eur)}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Indicative pricing from {formatPercentValue(result.commercial_opportunity.indicative_rate_from_pct)}
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs leading-5 text-slate-500">
                {result.commercial_opportunity.disclaimer}
              </div>
            </div>
          </SmallCard>
        </div>

        <SmallCard title="Speak With Us" className="mt-auto">
          <p className="text-base leading-7">{agentPrompt}</p>
        </SmallCard>
      </div>

      <div
        ref={(node) => onPageRef(1, node)}
        className="mb-8 flex min-h-[1123px] w-[794px] flex-col gap-6 bg-white p-10 text-slate-900"
      >
        <h2 className="text-3xl font-semibold">Key Findings and Funding Routes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SmallCard title="Main Points to Address">
            <ul className="space-y-3">
              {result.top_blockers.length ? result.top_blockers.map((blocker) => (
                <li key={blocker.title}>
                  <span className="font-medium">{blocker.title}</span>: {blocker.detail}
                </li>
              )) : <li>No major blockers are dominating the current case.</li>}
            </ul>
          </SmallCard>
          <SmallCard title="Strengths Supporting the Case">
            <ul className="space-y-3">
              {result.mitigants.length ? result.mitigants.map((mitigant) => <li key={mitigant}>{mitigant}</li>) : <li>No extra mitigants required beyond current strengths.</li>}
            </ul>
          </SmallCard>
        </div>

        <SmallCard title="Recommended Funding Routes">
          <div className="space-y-4">
            {result.scheme_pathways.map((pathway) => (
              <div key={pathway.name} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold">{pathway.name}</p>
                <p className="mt-1 text-sm text-slate-500">{pathway.channel}</p>
                <p className="mt-3">{pathway.fit_reason}</p>
                <p className="mt-3 font-medium">{pathway.next_step}</p>
              </div>
            ))}
          </div>
        </SmallCard>

        <SmallCard title="Three-Year Business Performance">
          <p className="text-base leading-7">{result.historical_analysis.summary}</p>
          <div className="mt-4 space-y-3">
            {result.historical_analysis.bullets.map((bullet) => (
              <div key={bullet} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                {bullet}
              </div>
            ))}
          </div>
        </SmallCard>
      </div>

      <div
        ref={(node) => onPageRef(2, node)}
        className="mb-8 flex min-h-[1123px] w-[794px] flex-col gap-6 bg-white p-10 text-slate-900"
      >
        <h2 className="text-3xl font-semibold">Financials, Documents, and Market Comparison</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SmallCard title="Key Ratios">
            <ul className="space-y-2">
              <li>Current ratio: {result.ratios.current_ratio.toFixed(2)}</li>
              <li>Quick ratio: {result.ratios.quick_ratio.toFixed(2)}</li>
              <li>Debt / equity: {result.ratios.debt_to_equity.toFixed(2)}</li>
              <li>Interest coverage: {result.ratios.interest_coverage.toFixed(2)}</li>
              <li>DSCR proxy: {result.ratios.dscr_proxy.toFixed(2)}</li>
              <li>Gross margin: {formatPercentValue(result.ratios.gross_margin * 100)}</li>
              <li>Net margin: {formatPercentValue(result.ratios.net_margin * 100)}</li>
            </ul>
          </SmallCard>
          <SmallCard title="Documents and Resilience Checks">
            <p>Documentation score: {result.documentation.score}/100</p>
            <p className="mt-2">{result.documentation.summary}</p>
            <div className="mt-4 space-y-2">
              {result.cashflow.stress_tests.map((stress) => (
                <div key={stress.name} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="font-medium">{stress.name}</span>: {stress.headline}
                </div>
              ))}
            </div>
          </SmallCard>
        </div>

        <SmallCard title="Documents Lenders May Request">
          <div className="grid gap-3 md:grid-cols-2">
            {result.document_pack.map((item) => (
              <div key={item.item} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="font-medium">{item.item}</p>
                <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </SmallCard>

        <SmallCard title="Peer Comparison">
          <p className="text-base leading-7">
            Overall peer rating: {result.peer_benchmark.overall_peer_rating.replace(/_/g, " ")}. Comparing against{" "}
            {result.peer_benchmark.sector.replace(/_/g, " ")} peers in {result.peer_benchmark.country}.
          </p>
          <div className="mt-4 space-y-2">
            {result.peer_benchmark.metrics.slice(0, 6).map((metric) => (
              <div key={metric.key} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <span>{metric.label}</span>
                <span className="font-medium">
                  {metric.your_value_formatted} vs {metric.peer_average_formatted}
                </span>
              </div>
            ))}
          </div>
        </SmallCard>
      </div>

      <div
        ref={(node) => onPageRef(3, node)}
        className="mb-8 flex min-h-[1123px] w-[794px] flex-col gap-6 bg-white p-10 text-slate-900"
      >
        <h2 className="text-3xl font-semibold">Application Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SmallCard title="Registration">
            <ul className="space-y-2">
              <li>Company: {registration.companyName}</li>
              <li>Registration: {registration.registrationNumber}</li>
              <li>Contact: {registration.contactName}</li>
              <li>Email: {registration.contactEmail}</li>
              <li>Phone: {registration.contactPhone}</li>
              <li>Country: {formatSectorLabel(latestInput.country)}</li>
              <li>Industry: {getIndustryLabel(latestInput.country, registration.industry)}</li>
              <li>Sub-industry: {getSubIndustryLabel(latestInput.country, registration.industry, registration.subIndustry)}</li>
            </ul>
          </SmallCard>
          <SmallCard title="Facility and Current Inputs">
            <ul className="space-y-2">
              <li>Requested amount: {formatCurrency(latestInput.facility.requested_amount)}</li>
              <li>Outstanding debt: {formatCurrency(latestInput.facility.outstanding_debt)}</li>
              <li>Annual debt service: {formatCurrency(latestInput.facility.annual_debt_service)}</li>
              <li>Interest rate: {formatPercentValue(latestInput.facility.interest_rate_pct)}</li>
              <li>Requested term: {latestInput.facility.requested_term_months} months</li>
              <li>Collateral value: {formatCurrency(latestInput.facility.collateral_value)}</li>
              <li>Planned capex: {formatCurrency(latestInput.facility.planned_capex)}</li>
            </ul>
          </SmallCard>
        </div>

        <SmallCard title="Three-Year Financial History">
          <div className="space-y-3">
            {latestInput.historical_financials.map((year) => (
              <div key={year.year_label} className="grid grid-cols-4 gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <span className="font-medium">{year.year_label}</span>
                <span>Revenue {formatCurrency(year.pl.revenue)}</span>
                <span>Net margin {formatPercentValue((((year.pl.revenue - year.pl.cogs - year.pl.operating_expenses - year.pl.interest_expense - year.pl.tax_expense) / Math.max(year.pl.revenue, 1)) * 100))}</span>
                <span>Current ratio {formatRatioValue(year.bs.current_assets / Math.max(year.bs.current_liabilities, 1))}</span>
              </div>
            ))}
          </div>
        </SmallCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SmallCard title="Bank and Documentation">
            <ul className="space-y-2">
              <li>Monthly revenue series: {latestInput.bank.monthly_revenue.join(", ")}</li>
              <li>Monthly net cashflow series: {latestInput.bank.monthly_net_cashflow.join(", ")}</li>
              <li>Latest accounts age: {latestInput.documentation.latest_accounts_age_months} months</li>
              <li>Missing filings: {latestInput.documentation.missing_filings ? "Yes" : "No"}</li>
              <li>Registry report available: {latestInput.documentation.registry_report_available ? "Yes" : "No"}</li>
            </ul>
          </SmallCard>
          <SmallCard title="Country-Specific Signals">
            <ul className="space-y-2">
              {countrySignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </SmallCard>
        </div>
      </div>
    </div>
  );
}
