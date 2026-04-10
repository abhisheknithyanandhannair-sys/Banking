import { AnalysisInput, HistoricalFinancialYear, RegistrationProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSectorLabel, getIndustryLabel, getSubIndustryLabel } from "@/lib/industries";
import { formatCurrency, formatPercentValue } from "@/lib/reportFormatting";

interface ApplicationInputSummaryProps {
  registration: RegistrationProfile;
  input: AnalysisInput;
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

function metricValue(year: HistoricalFinancialYear, key: keyof HistoricalFinancialYear["pl"]) {
  return formatCurrency(year.pl[key]);
}

function ratioFromYear(year: HistoricalFinancialYear) {
  const revenue = Math.max(year.pl.revenue, 1);
  const netProfit =
    year.pl.revenue -
    year.pl.cogs -
    year.pl.operating_expenses -
    year.pl.interest_expense -
    year.pl.tax_expense;
  return formatPercentValue((netProfit / revenue) * 100);
}

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <Card className="border-0 shadow-soft">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-sm leading-6">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoricalYearCard({ year }: { year: HistoricalFinancialYear }) {
  return (
    <Card className="border-0 shadow-soft">
      <CardHeader>
        <CardTitle>{year.year_label}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
          <p className="mt-2 text-sm">{metricValue(year, "revenue")}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Net Margin</p>
          <p className="mt-2 text-sm">{ratioFromYear(year)}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Assets</p>
          <p className="mt-2 text-sm">{formatCurrency(year.bs.current_assets)}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Liabilities</p>
          <p className="mt-2 text-sm">{formatCurrency(year.bs.total_liabilities)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApplicationInputSummary({ registration, input }: ApplicationInputSummaryProps) {
  const countrySignals =
    input.country === "ireland"
      ? [
          { label: "CCR Arrears", value: formatBoolean(input.country_context.ireland.ccr_arrears) },
          { label: "CCR Restructures", value: formatBoolean(input.country_context.ireland.ccr_restructures) },
          { label: "CCR Write-Offs", value: formatBoolean(input.country_context.ireland.ccr_write_offs) },
          { label: "SBCI Eligible", value: formatBoolean(input.sbci_eligible) },
          { label: "Repayment History Score", value: input.repayment_history_score.toString() },
        ]
      : input.country === "spain"
        ? [
            { label: "CIRBE Total Exposure", value: formatCurrency(input.country_context.spain.cirbe_total_exposure) },
            { label: "Requested Maturity", value: `${input.country_context.spain.requested_maturity_months} months` },
            { label: "Collateral Notes", value: input.country_context.spain.collateral_maturity_notes || "Not provided" },
          ]
        : input.country === "france"
          ? [
              { label: "BdF Turnover Letter", value: input.country_context.france.bdf_turnover_letter || "Not provided" },
              { label: "BdF Credit Score Digit", value: input.country_context.france.bdf_credit_score_digit.toString() },
              { label: "FIBEN Score", value: input.fiben_score.toString() },
              { label: "Bpifrance Guarantee", value: formatBoolean(input.country_context.france.wants_bpifrance_guarantee) },
              { label: "Late Payment Flag", value: formatBoolean(input.late_payment_flag) },
              { label: "CIR Eligible", value: formatBoolean(input.cir_eligible) },
            ]
          : input.country === "netherlands"
            ? [
                { label: "Legal Form", value: input.country_context.netherlands.legal_form },
                { label: "BKR Events Present", value: formatBoolean(input.country_context.netherlands.bkr_events_present) },
              ]
            : [
                {
                  label: "Company Register Extract",
                  value: formatBoolean(input.country_context.germany.company_register_extract_available),
                },
                {
                  label: "Filed Accounts Available",
                  value: formatBoolean(input.country_context.germany.company_register_accounts_available),
                },
                { label: "Guarantee Bank Route", value: formatBoolean(input.country_context.germany.wants_guarantee_bank) },
                { label: "KfW Route", value: formatBoolean(input.country_context.germany.wants_kfw_route) },
                { label: "SCHUFA Score", value: input.schufa_score.toString() },
                { label: "Hausbank Relationship", value: `${input.hausbank_years.toFixed(1)} years` },
              ];

  return (
    <div className="space-y-6">
      <SummaryCard
        title="Registered SME Profile"
        items={[
          { label: "Company Name", value: registration.companyName },
          { label: "Registration Number", value: registration.registrationNumber },
          { label: "Contact Name", value: registration.contactName },
          { label: "Contact Email", value: registration.contactEmail },
          { label: "Contact Phone", value: registration.contactPhone },
          { label: "Country", value: formatSectorLabel(input.country) },
          { label: "Industry", value: getIndustryLabel(input.country, registration.industry) },
          { label: "Sub Industry", value: getSubIndustryLabel(input.country, registration.industry, registration.subIndustry) },
          { label: "Model Sector", value: formatSectorLabel(input.sector) },
        ]}
      />

      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Three-Year Financial History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {input.historical_financials.map((year) => (
            <HistoricalYearCard key={year.year_label} year={year} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <SummaryCard
          title="Facility and Current Trading Inputs"
          items={[
            { label: "Employee Count", value: input.employee_count.toString() },
            { label: "Business Age", value: `${input.business_age_years} years` },
            { label: "Consecutive Loss Months", value: input.consecutive_loss_months.toString() },
            { label: "Scheme Channel", value: formatSectorLabel(input.facility.scheme_channel) },
            { label: "Requested Amount", value: formatCurrency(input.facility.requested_amount) },
            { label: "Outstanding Debt", value: formatCurrency(input.facility.outstanding_debt) },
            { label: "Annual Debt Service", value: formatCurrency(input.facility.annual_debt_service) },
            { label: "Interest Rate", value: formatPercentValue(input.facility.interest_rate_pct) },
            { label: "Requested Term", value: `${input.facility.requested_term_months} months` },
            { label: "Collateral Type", value: input.facility.collateral_type },
            { label: "Collateral Value", value: formatCurrency(input.facility.collateral_value) },
            { label: "Planned Capex", value: formatCurrency(input.facility.planned_capex) },
          ]}
        />

        <SummaryCard
          title="Bank and Documentation Inputs"
          items={[
            { label: "Monthly Revenue Series", value: input.bank.monthly_revenue.join(", ") },
            { label: "Monthly Net Cashflow Series", value: input.bank.monthly_net_cashflow.join(", ") },
            { label: "Latest Accounts Age", value: `${input.documentation.latest_accounts_age_months} months` },
            { label: "Missing Filings", value: formatBoolean(input.documentation.missing_filings) },
            { label: "Registry Report", value: formatBoolean(input.documentation.registry_report_available) },
            { label: "Tax ID", value: formatBoolean(input.documentation.tax_id_available) },
            { label: "Business ID", value: formatBoolean(input.documentation.business_id_available) },
            { label: "Director ID", value: formatBoolean(input.documentation.director_id_available) },
            { label: "Name Mismatch", value: formatBoolean(input.documentation.name_mismatch_flag) },
            { label: "Address Mismatch", value: formatBoolean(input.documentation.address_mismatch_flag) },
            {
              label: "Bank Account Name Mismatch",
              value: formatBoolean(input.documentation.bank_account_name_mismatch_flag),
            },
          ]}
        />
      </div>

      <SummaryCard title="Country-Specific Inputs" items={countrySignals} />
    </div>
  );
}
