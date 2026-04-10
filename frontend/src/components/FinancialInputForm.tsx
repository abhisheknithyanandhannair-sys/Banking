import { Upload, FileSpreadsheet, Link2, WandSparkles } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ApplicationSubmission,
  AnalysisInput,
  BalanceSheet,
  CountryCode,
  CountryContext,
  DocumentationInput,
  FacilityRequest,
  HistoricalFinancialYear,
  ProfitAndLoss,
  RegistrationProfile,
  emptyScenario,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deriveSector,
  getDefaultRegistration,
  getIndustryOptions,
  getSubIndustryOptions,
} from "@/lib/industries";

interface FinancialInputFormProps {
  onSubmit: (data: ApplicationSubmission) => Promise<void>;
  loading: boolean;
  submitLabel?: string;
}

const defaultProfitAndLoss: ProfitAndLoss = {
  revenue: 500000,
  cogs: 220000,
  operating_expenses: 140000,
  payroll_expense: 85000,
  interest_expense: 18000,
  tax_expense: 24000,
  depreciation: 12000,
};

const defaultBalanceSheet: BalanceSheet = {
  cash: 60000,
  receivables: 70000,
  current_assets: 180000,
  inventory: 35000,
  payables: 42000,
  current_liabilities: 95000,
  total_assets: 420000,
  total_liabilities: 190000,
  equity: 230000,
};

const defaultFacility: FacilityRequest = {
  requested_amount: 85000,
  outstanding_debt: 150000,
  annual_debt_service: 36000,
  interest_rate_pct: 6.5,
  requested_term_months: 48,
  collateral_type: "Receivables",
  collateral_value: 25000,
  planned_capex: 30000,
  scheme_channel: "bank",
};

const defaultDocumentation: DocumentationInput = {
  latest_accounts_age_months: 10,
  missing_filings: false,
  registry_report_available: true,
  tax_id_available: true,
  business_id_available: true,
  director_id_available: true,
  name_mismatch_flag: false,
  address_mismatch_flag: false,
  bank_account_name_mismatch_flag: false,
};

const defaultCountryContext: CountryContext = {
  ireland: {
    ccr_arrears: false,
    ccr_restructures: false,
    ccr_write_offs: false,
  },
  spain: {
    cirbe_total_exposure: 0,
    collateral_maturity_notes: "",
    requested_maturity_months: 36,
  },
  france: {
    bdf_turnover_letter: "",
    bdf_credit_score_digit: 0,
    wants_bpifrance_guarantee: false,
  },
  netherlands: {
    legal_form: "bv",
    bkr_events_present: false,
  },
  germany: {
    company_register_extract_available: true,
    company_register_accounts_available: true,
    wants_guarantee_bank: false,
    wants_kfw_route: false,
  },
};

const defaultRegistration = getDefaultRegistration("ireland");
const defaultMonthlyRevenue = [40000, 42000, 43000, 41000, 45000, 44000, 46000, 47000, 42000, 39000, 38000, 36000];
const defaultMonthlyNetCashflow = [6000, 5000, 7000, 4000, 8000, 6500, 7000, 7500, 3500, 2000, 1500, 1000];

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none";
const textareaClassName =
  "min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none";

const metricSections = {
  pl: [
    ["revenue", "Revenue"],
    ["cogs", "COGS"],
    ["operating_expenses", "Operating Expenses"],
    ["payroll_expense", "Payroll Expense"],
    ["interest_expense", "Interest Expense"],
    ["tax_expense", "Tax Expense"],
    ["depreciation", "Depreciation"],
  ] as const,
  bs: [
    ["cash", "Cash"],
    ["receivables", "Receivables"],
    ["current_assets", "Current Assets"],
    ["inventory", "Inventory"],
    ["payables", "Payables"],
    ["current_liabilities", "Current Liabilities"],
    ["total_assets", "Total Assets"],
    ["total_liabilities", "Total Liabilities"],
    ["equity", "Equity"],
  ] as const,
  facility: [
    ["requested_amount", "Requested Amount"],
    ["outstanding_debt", "Outstanding Debt"],
    ["annual_debt_service", "Annual Debt Service"],
    ["interest_rate_pct", "Interest Rate %"],
    ["requested_term_months", "Requested Term (months)"],
    ["collateral_value", "Collateral Value"],
    ["planned_capex", "Planned Capex"],
  ] as const,
};

const uploadMetrics = [
  "revenue",
  "cogs",
  "operating_expenses",
  "payroll_expense",
  "interest_expense",
  "tax_expense",
  "depreciation",
  "cash",
  "receivables",
  "current_assets",
  "inventory",
  "payables",
  "current_liabilities",
  "total_assets",
  "total_liabilities",
  "equity",
];

function createHistoricalDefaults(): HistoricalFinancialYear[] {
  const currentYear = new Date().getFullYear();
  return [
    {
      year_label: `${currentYear - 3}`,
      pl: {
        ...defaultProfitAndLoss,
        revenue: 430000,
        cogs: 192000,
        operating_expenses: 132000,
        payroll_expense: 80000,
        interest_expense: 20000,
        tax_expense: 18000,
        depreciation: 10000,
      },
      bs: {
        ...defaultBalanceSheet,
        cash: 45000,
        receivables: 61000,
        current_assets: 150000,
        inventory: 30000,
        payables: 38000,
        current_liabilities: 90000,
        total_assets: 360000,
        total_liabilities: 190000,
        equity: 170000,
      },
    },
    {
      year_label: `${currentYear - 2}`,
      pl: {
        ...defaultProfitAndLoss,
        revenue: 470000,
        cogs: 205000,
        operating_expenses: 136000,
        payroll_expense: 82000,
        interest_expense: 19000,
        tax_expense: 22000,
        depreciation: 11000,
      },
      bs: {
        ...defaultBalanceSheet,
        cash: 52000,
        receivables: 67000,
        current_assets: 166000,
        inventory: 32000,
        payables: 40000,
        current_liabilities: 93000,
        total_assets: 392000,
        total_liabilities: 192000,
        equity: 200000,
      },
    },
    {
      year_label: `${currentYear - 1}`,
      pl: defaultProfitAndLoss,
      bs: defaultBalanceSheet,
    },
  ];
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function seriesToText(values: number[]): string {
  return values.join(", ");
}

function parseSeries(value: string, fallback: number[]): number[] {
  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

  if (parsed.length === 12) {
    return parsed;
  }
  if (!parsed.length) {
    return fallback;
  }
  if (parsed.length > 12) {
    return parsed.slice(0, 12);
  }
  return [...parsed, ...Array.from({ length: 12 - parsed.length }, () => parsed[parsed.length - 1] ?? 0)];
}

function syncLatestFinancials(input: AnalysisInput): AnalysisInput {
  const latestYear = input.historical_financials[input.historical_financials.length - 1];
  return {
    ...input,
    pl: latestYear.pl,
    bs: latestYear.bs,
  };
}

function updateYearMetric(
  years: HistoricalFinancialYear[],
  yearIndex: number,
  section: "pl" | "bs",
  key: string,
  value: number
) {
  return years.map((year, index) => {
    if (index !== yearIndex) {
      return year;
    }
    return {
      ...year,
      [section]: {
        ...year[section],
        [key]: value,
      },
    };
  });
}

function sortYearLabels(labels: string[]) {
  const withNumeric = labels.map((label) => ({
    label,
    numeric: Number((label.match(/\d{4}/) ?? [NaN])[0]),
  }));
  const allNumeric = withNumeric.every((item) => Number.isFinite(item.numeric));
  if (!allNumeric) {
    return labels;
  }
  return [...labels].sort((left, right) => Number(left.match(/\d{4}/)?.[0]) - Number(right.match(/\d{4}/)?.[0]));
}

function applyMetricMap(
  year: HistoricalFinancialYear,
  metricMap: Record<string, number>
): HistoricalFinancialYear {
  return {
    ...year,
    pl: {
      revenue: metricMap.revenue ?? year.pl.revenue,
      cogs: metricMap.cogs ?? year.pl.cogs,
      operating_expenses: metricMap.operating_expenses ?? year.pl.operating_expenses,
      payroll_expense: metricMap.payroll_expense ?? year.pl.payroll_expense,
      interest_expense: metricMap.interest_expense ?? year.pl.interest_expense,
      tax_expense: metricMap.tax_expense ?? year.pl.tax_expense,
      depreciation: metricMap.depreciation ?? year.pl.depreciation,
    },
    bs: {
      cash: metricMap.cash ?? year.bs.cash,
      receivables: metricMap.receivables ?? year.bs.receivables,
      current_assets: metricMap.current_assets ?? year.bs.current_assets,
      inventory: metricMap.inventory ?? year.bs.inventory,
      payables: metricMap.payables ?? year.bs.payables,
      current_liabilities: metricMap.current_liabilities ?? year.bs.current_liabilities,
      total_assets: metricMap.total_assets ?? year.bs.total_assets,
      total_liabilities: metricMap.total_liabilities ?? year.bs.total_liabilities,
      equity: metricMap.equity ?? year.bs.equity,
    },
  };
}

function readSpreadsheet(rows: Array<Record<string, unknown>>, current: AnalysisInput): AnalysisInput {
  const firstRow = rows[0] ?? {};
  const normalizedKeys = Object.keys(firstRow).map(normalizeKey);
  const currentYears = [...current.historical_financials];
  const defaultLatestYear = currentYears[currentYears.length - 1];

  if (normalizedKeys.includes("year") && normalizedKeys.includes("metric") && normalizedKeys.includes("value")) {
    const grouped: Record<string, Record<string, number>> = {};

    rows.forEach((row) => {
      const yearLabel = String(row.year ?? row.Year ?? "").trim();
      const metric = normalizeKey(String(row.metric ?? row.Metric ?? ""));
      if (!yearLabel || !metric) {
        return;
      }
      grouped[yearLabel] = grouped[yearLabel] ?? {};
      grouped[yearLabel][metric] = toNumber(row.value ?? row.Value ?? 0);
    });

    const incomingLabels = sortYearLabels(Object.keys(grouped)).slice(-3);
    const mappedYears = [...currentYears];
    const startIndex = currentYears.length - incomingLabels.length;

    incomingLabels.forEach((label, offset) => {
      const targetIndex = startIndex + offset;
      mappedYears[targetIndex] = applyMetricMap(
        {
          ...mappedYears[targetIndex],
          year_label: label,
        },
        grouped[label]
      );
    });

    return syncLatestFinancials({
      ...current,
      historical_financials: mappedYears,
    });
  }

  if (normalizedKeys.includes("metric") && normalizedKeys.includes("value")) {
    const rowMap: Record<string, number> = {};
    rows.forEach((row) => {
      const metric = normalizeKey(String(row.metric ?? row.Metric ?? ""));
      if (metric) {
        rowMap[metric] = toNumber(row.value ?? row.Value ?? 0);
      }
    });

    const nextYears = [...currentYears];
    nextYears[nextYears.length - 1] = applyMetricMap(defaultLatestYear, rowMap);
    return syncLatestFinancials({
      ...current,
      historical_financials: nextYears,
    });
  }

  const nextYears = [...currentYears];
  nextYears[nextYears.length - 1] = applyMetricMap(defaultLatestYear, {
    revenue: toNumber(firstRow.revenue ?? defaultLatestYear.pl.revenue),
    cogs: toNumber(firstRow.cogs ?? defaultLatestYear.pl.cogs),
    operating_expenses: toNumber(firstRow.operating_expenses ?? defaultLatestYear.pl.operating_expenses),
    payroll_expense: toNumber(firstRow.payroll_expense ?? defaultLatestYear.pl.payroll_expense),
    interest_expense: toNumber(firstRow.interest_expense ?? defaultLatestYear.pl.interest_expense),
    tax_expense: toNumber(firstRow.tax_expense ?? defaultLatestYear.pl.tax_expense),
    depreciation: toNumber(firstRow.depreciation ?? defaultLatestYear.pl.depreciation),
    cash: toNumber(firstRow.cash ?? defaultLatestYear.bs.cash),
    receivables: toNumber(firstRow.receivables ?? defaultLatestYear.bs.receivables),
    current_assets: toNumber(firstRow.current_assets ?? defaultLatestYear.bs.current_assets),
    inventory: toNumber(firstRow.inventory ?? defaultLatestYear.bs.inventory),
    payables: toNumber(firstRow.payables ?? defaultLatestYear.bs.payables),
    current_liabilities: toNumber(firstRow.current_liabilities ?? defaultLatestYear.bs.current_liabilities),
    total_assets: toNumber(firstRow.total_assets ?? defaultLatestYear.bs.total_assets),
    total_liabilities: toNumber(firstRow.total_liabilities ?? defaultLatestYear.bs.total_liabilities),
    equity: toNumber(firstRow.equity ?? defaultLatestYear.bs.equity),
  });

  if (typeof firstRow.year === "string" && firstRow.year.trim()) {
    nextYears[nextYears.length - 1].year_label = firstRow.year.trim();
  }

  return syncLatestFinancials({
    ...current,
    historical_financials: nextYears,
  });
}

function CheckboxField({
  id,
  checked,
  label,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function HistoricalYearEditor({
  year,
  index,
  onLabelChange,
  onMetricChange,
}: {
  year: HistoricalFinancialYear;
  index: number;
  onLabelChange: (yearIndex: number, value: string) => void;
  onMetricChange: (yearIndex: number, section: "pl" | "bs", key: string, value: number) => void;
}) {
  return (
    <div className="space-y-6 rounded-2xl border p-5">
      <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:items-end">
        <div className="space-y-2">
          <Label htmlFor={`year_label_${index}`}>Financial Year Label</Label>
          <Input
            id={`year_label_${index}`}
            value={year.year_label}
            onChange={(event) => onLabelChange(index, event.target.value)}
          />
        </div>
        <div className="rounded-2xl border bg-accent/30 p-4 text-sm leading-6 text-muted-foreground">
          Enter the annual P&amp;L and balance-sheet values for this historical period. The latest year drives the live
          score, while all three years feed the trajectory narrative and sales pitch.
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Profit and Loss</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {metricSections.pl.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`${key}_${index}`}>{label}</Label>
              <Input
                id={`${key}_${index}`}
                type="number"
                min="0"
                step="0.01"
                value={year.pl[key]}
                onChange={(event) => onMetricChange(index, "pl", key, toNumber(event.target.value))}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Balance Sheet</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {metricSections.bs.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`${key}_bs_${index}`}>{label}</Label>
              <Input
                id={`${key}_bs_${index}`}
                type="number"
                min="0"
                step="0.01"
                value={year.bs[key]}
                onChange={(event) => onMetricChange(index, "bs", key, toNumber(event.target.value))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function countryHeading(country: CountryCode): string {
  return {
    ireland: "Ireland adapter",
    spain: "Spain adapter",
    france: "France adapter",
    netherlands: "Netherlands adapter",
    germany: "Germany adapter",
  }[country];
}

export default function FinancialInputForm({
  onSubmit,
  loading,
  submitLabel = "Register Application",
}: FinancialInputFormProps) {
  const defaultHistoricalFinancials = useMemo(() => createHistoricalDefaults(), []);
  const [formData, setFormData] = useState<AnalysisInput>(() =>
    syncLatestFinancials({
      country: "ireland",
      pl: defaultHistoricalFinancials[defaultHistoricalFinancials.length - 1].pl,
      bs: defaultHistoricalFinancials[defaultHistoricalFinancials.length - 1].bs,
      historical_financials: defaultHistoricalFinancials,
      facility: defaultFacility,
      bank: {
        monthly_revenue: defaultMonthlyRevenue,
        monthly_net_cashflow: defaultMonthlyNetCashflow,
      },
      documentation: defaultDocumentation,
      country_context: defaultCountryContext,
      scenario: emptyScenario,
      employee_count: 10,
      business_age_years: 5,
      sector: deriveSector("ireland", defaultRegistration.industry),
      consecutive_loss_months: 0,
      repayment_history_score: 3,
      fiben_score: 5,
      schufa_score: 650,
      hausbank_years: 3.0,
      sbci_eligible: false,
      late_payment_flag: false,
      cir_eligible: false,
    })
  );
  const [registration, setRegistration] = useState<RegistrationProfile>(defaultRegistration);
  const [monthlyRevenueText, setMonthlyRevenueText] = useState(seriesToText(defaultMonthlyRevenue));
  const [monthlyCashflowText, setMonthlyCashflowText] = useState(seriesToText(defaultMonthlyNetCashflow));
  const [uploadMessage, setUploadMessage] = useState<string>(
    "Upload a CSV or Excel sheet to pre-fill one year or all three years of financial statements."
  );
  const industryOptions = getIndustryOptions(formData.country);
  const subIndustryOptions = getSubIndustryOptions(formData.country, registration.industry);

  const updateRegistration = <TKey extends keyof RegistrationProfile>(key: TKey, value: RegistrationProfile[TKey]) => {
    setRegistration((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateHistoricalLabel = (yearIndex: number, value: string) => {
    setFormData((current) =>
      syncLatestFinancials({
        ...current,
        historical_financials: current.historical_financials.map((year, index) =>
          index === yearIndex ? { ...year, year_label: value } : year
        ),
      })
    );
  };

  const updateHistoricalMetric = (yearIndex: number, section: "pl" | "bs", key: string, value: number) => {
    setFormData((current) =>
      syncLatestFinancials({
        ...current,
        historical_financials: updateYearMetric(current.historical_financials, yearIndex, section, key, value),
      })
    );
  };

  const updateFacility = (key: keyof FacilityRequest, value: number | string) => {
    setFormData((current) => ({
      ...current,
      facility: {
        ...current.facility,
        [key]: value,
      },
    }));
  };

  const updateDocumentation = (key: keyof DocumentationInput, value: number | boolean) => {
    setFormData((current) => ({
      ...current,
      documentation: {
        ...current.documentation,
        [key]: value,
      },
    }));
  };

  const updateCountryContext = <
    TSection extends keyof CountryContext,
    TKey extends keyof CountryContext[TSection],
  >(
    section: TSection,
    key: TKey,
    value: CountryContext[TSection][TKey]
  ) => {
    setFormData((current) => ({
      ...current,
      country_context: {
        ...current.country_context,
        [section]: {
          ...current.country_context[section],
          [key]: value,
        },
      },
    }));
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (!rows.length) {
        setUploadMessage("The uploaded file is empty. Please use the template and try again.");
        return;
      }

        setFormData((current) => readSpreadsheet(rows, current));
        setUploadMessage(
          `Loaded ${file.name}. Please review the three years of figures and continue when you are happy.`
        );
    } catch {
      setUploadMessage("The file could not be parsed. Use the year / metric / value template and try again.");
    } finally {
      event.target.value = "";
    }
  };

  const syncSeriesToState = () => {
    setFormData((current) => ({
      ...current,
      bank: {
        monthly_revenue: parseSeries(monthlyRevenueText, current.bank.monthly_revenue),
        monthly_net_cashflow: parseSeries(monthlyCashflowText, current.bank.monthly_net_cashflow),
      },
    }));
  };

  const handleSubmit = () => {
    const monthlyRevenue = parseSeries(monthlyRevenueText, formData.bank.monthly_revenue);
    const monthlyNetCashflow = parseSeries(monthlyCashflowText, formData.bank.monthly_net_cashflow);
    const nextInput = syncLatestFinancials({
      ...formData,
      sector: deriveSector(formData.country, registration.industry),
      bank: {
        monthly_revenue: monthlyRevenue,
        monthly_net_cashflow: monthlyNetCashflow,
      },
    });

    void onSubmit({
      registration,
      analysisInput: nextInput,
    });
  };

  return (
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Business Information</CardTitle>
          <CardDescription>
            Share your business details, three years of financial history, and supporting information so we can prepare
            your funding-readiness report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border bg-card/90 p-5">
            <div className="mb-4">
              <p className="text-base font-semibold">Business profile</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Start with your core business and contact details, then complete the financial information used in your
                assessment.
              </p>
            </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={registration.companyName}
                onChange={(event) => updateRegistration("companyName", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                value={registration.registrationNumber}
                onChange={(event) => updateRegistration("registrationNumber", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={registration.contactName}
                onChange={(event) => updateRegistration("contactName", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={registration.contactEmail}
                onChange={(event) => updateRegistration("contactEmail", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={registration.contactPhone}
                onChange={(event) => updateRegistration("contactPhone", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                className={selectClassName}
                value={formData.country}
                onChange={(event) => {
                  const nextCountry = event.target.value as CountryCode;
                  const nextRegistration = getDefaultRegistration(nextCountry);
                  setFormData((current) => ({
                    ...current,
                    country: nextCountry,
                    sector: deriveSector(nextCountry, nextRegistration.industry),
                  }));
                  setRegistration((current) => ({
                    ...current,
                    industry: nextRegistration.industry,
                    subIndustry: nextRegistration.subIndustry,
                  }));
                }}
              >
                <option value="ireland">Ireland</option>
                <option value="spain">Spain</option>
                <option value="france">France</option>
                <option value="netherlands">Netherlands</option>
                <option value="germany">Germany</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                className={selectClassName}
                value={registration.industry}
                onChange={(event) => {
                  const nextIndustry = event.target.value;
                  const nextSubIndustry = getSubIndustryOptions(formData.country, nextIndustry)[0]?.value ?? "";
                  setRegistration((current) => ({
                    ...current,
                    industry: nextIndustry,
                    subIndustry: nextSubIndustry,
                  }));
                  setFormData((current) => ({
                    ...current,
                    sector: deriveSector(current.country, nextIndustry),
                  }));
                }}
              >
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_industry">Sub Industry</Label>
              <select
                id="sub_industry"
                className={selectClassName}
                value={registration.subIndustry}
                onChange={(event) => updateRegistration("subIndustry", event.target.value)}
              >
                {subIndustryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_sector">Risk Model Sector</Label>
              <Input id="model_sector" value={formData.sector.replace(/_/g, " ")} readOnly />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-accent/60 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Three years in, current year forward</p>
              <p className="leading-6 text-muted-foreground">
                This flow captures three historical annual periods plus the latest 12 months of bank data. The newest
                year feeds the live score, while the full history powers the trajectory interpretation and funding
                opportunity story.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scheme_channel">Scheme Channel</Label>
            <select
              id="scheme_channel"
              className={selectClassName}
              value={formData.facility.scheme_channel}
              onChange={(event) => updateFacility("scheme_channel", event.target.value)}
            >
              <option value="bank">Bank-led route</option>
              <option value="guarantee">Guarantee pathway</option>
              <option value="microfinance">Microfinance pathway</option>
              <option value="public_scheme">Public scheme route</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed bg-accent/60 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Financial upload</p>
              <p className="mt-1 text-sm text-muted-foreground">{uploadMessage}</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Preferred template: <code>year</code>, <code>metric</code>, <code>value</code>. Legacy one-year
                templates using <code>metric</code> and <code>value</code> still map into the newest year.
                Supported metrics: {uploadMetrics.join(", ")}.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Label
              htmlFor="statement-upload"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV / Excel
            </Label>
            <Input
              id="statement-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <a
              href="/sme-financial-upload-template.csv"
              download
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Download template
            </a>
          </div>
        </div>

        <Tabs defaultValue="financials" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="financials">3-Year Financials</TabsTrigger>
            <TabsTrigger value="facility">Facility</TabsTrigger>
            <TabsTrigger value="bank">Bank Data</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="profile">Business</TabsTrigger>
            <TabsTrigger value="country">Country</TabsTrigger>
          </TabsList>

          <TabsContent value="financials" className="mt-4 space-y-6">
              <div className="rounded-2xl border bg-accent/40 p-4 text-sm leading-6 text-muted-foreground">
                Enter figures for the last three completed periods in order from oldest to newest. The latest year is
                used for the baseline assessment, and all three years help us explain how the business has been
                performing over time.
              </div>

            <Tabs defaultValue="year-2" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {formData.historical_financials.map((year, index) => (
                  <TabsTrigger key={index} value={`year-${index}`}>
                    {year.year_label || `Year ${index + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>

              {formData.historical_financials.map((year, index) => (
                <TabsContent key={index} value={`year-${index}`} className="mt-4">
                  <HistoricalYearEditor
                    year={year}
                    index={index}
                    onLabelChange={updateHistoricalLabel}
                    onMetricChange={updateHistoricalMetric}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="facility" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {metricSections.facility.map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.facility[key]}
                    onChange={(event) => updateFacility(key, toNumber(event.target.value))}
                  />
                </div>
              ))}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="collateral_type">Collateral Type</Label>
                <Input
                  id="collateral_type"
                  value={formData.facility.collateral_type}
                  onChange={(event) => updateFacility("collateral_type", event.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bank" className="mt-4 space-y-4">
            <div className="rounded-2xl border bg-accent/40 p-4 text-sm leading-6 text-muted-foreground">
              Enter 12 comma-separated values for both series. These remain current-performance evidence and are kept
              separate from the three annual historical periods.
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_revenue">Monthly Revenue Series</Label>
              <textarea
                id="monthly_revenue"
                className={textareaClassName}
                value={monthlyRevenueText}
                onChange={(event) => setMonthlyRevenueText(event.target.value)}
                onBlur={syncSeriesToState}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_cashflow">Monthly Net Cashflow Series</Label>
              <textarea
                id="monthly_cashflow"
                className={textareaClassName}
                value={monthlyCashflowText}
                onChange={(event) => setMonthlyCashflowText(event.target.value)}
                onBlur={syncSeriesToState}
              />
            </div>
          </TabsContent>

          <TabsContent value="docs" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="latest_accounts_age_months">Latest Accounts Age (months)</Label>
              <Input
                id="latest_accounts_age_months"
                type="number"
                min="0"
                step="1"
                value={formData.documentation.latest_accounts_age_months}
                onChange={(event) => updateDocumentation("latest_accounts_age_months", toNumber(event.target.value))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxField
                id="missing_filings"
                checked={formData.documentation.missing_filings}
                label="Missing filings flagged"
                onChange={(checked) => updateDocumentation("missing_filings", checked)}
              />
              <CheckboxField
                id="registry_report_available"
                checked={formData.documentation.registry_report_available}
                label="Registry report available"
                onChange={(checked) => updateDocumentation("registry_report_available", checked)}
              />
              <CheckboxField
                id="tax_id_available"
                checked={formData.documentation.tax_id_available}
                label="Tax ID available"
                onChange={(checked) => updateDocumentation("tax_id_available", checked)}
              />
              <CheckboxField
                id="business_id_available"
                checked={formData.documentation.business_id_available}
                label="Business ID available"
                onChange={(checked) => updateDocumentation("business_id_available", checked)}
              />
              <CheckboxField
                id="director_id_available"
                checked={formData.documentation.director_id_available}
                label="Director ID pack available"
                onChange={(checked) => updateDocumentation("director_id_available", checked)}
              />
              <CheckboxField
                id="name_mismatch_flag"
                checked={formData.documentation.name_mismatch_flag}
                label="Name mismatch flagged"
                onChange={(checked) => updateDocumentation("name_mismatch_flag", checked)}
              />
              <CheckboxField
                id="address_mismatch_flag"
                checked={formData.documentation.address_mismatch_flag}
                label="Address mismatch flagged"
                onChange={(checked) => updateDocumentation("address_mismatch_flag", checked)}
              />
              <CheckboxField
                id="bank_account_name_mismatch_flag"
                checked={formData.documentation.bank_account_name_mismatch_flag}
                label="Bank account name mismatch"
                onChange={(checked) => updateDocumentation("bank_account_name_mismatch_flag", checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <div className="rounded-2xl border bg-accent/40 p-4 text-sm leading-6 text-muted-foreground">
              These signals feed the ML scoring layer and peer benchmark engine. Industry and sub-industry stay locked
              to the registration choices above.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input
                  id="employee_count"
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={formData.employee_count}
                  onChange={(event) => setFormData((current) => ({ ...current, employee_count: toNumber(event.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_age_years">Business Age (years)</Label>
                <Input
                  id="business_age_years"
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  value={formData.business_age_years}
                  onChange={(event) => setFormData((current) => ({ ...current, business_age_years: toNumber(event.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selected_industry">Industry Selection</Label>
                <Input
                  id="selected_industry"
                  value={`${industryOptions.find((option) => option.value === registration.industry)?.label ?? ""} / ${
                    subIndustryOptions.find((option) => option.value === registration.subIndustry)?.label ?? ""
                  }`}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Risk Model Sector</Label>
                <Input id="sector" value={formData.sector.replace(/_/g, " ")} readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consecutive_loss_months">Consecutive Loss Months</Label>
                <Input
                  id="consecutive_loss_months"
                  type="number"
                  min="0"
                  max="24"
                  step="1"
                  value={formData.consecutive_loss_months}
                  onChange={(event) => setFormData((current) => ({ ...current, consecutive_loss_months: toNumber(event.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model_country">Registered Country</Label>
                <Input id="model_country" value={formData.country} readOnly />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_reference">Registration Contact</Label>
                <Input id="contact_reference" value={registration.contactName} readOnly />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="country" className="mt-4 space-y-4">
            <div className="rounded-2xl border bg-accent/40 p-4">
              <p className="text-sm font-medium">{countryHeading(formData.country)}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Capture the factual local signals that the adapter uses for readiness, blockers, mitigants, and scheme
                pathways.
              </p>
            </div>

            {formData.country === "ireland" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField
                  id="ccr_arrears"
                  checked={formData.country_context.ireland.ccr_arrears}
                  label="CCR arrears present"
                  onChange={(checked) => updateCountryContext("ireland", "ccr_arrears", checked)}
                />
                <CheckboxField
                  id="ccr_restructures"
                  checked={formData.country_context.ireland.ccr_restructures}
                  label="CCR restructures present"
                  onChange={(checked) => updateCountryContext("ireland", "ccr_restructures", checked)}
                />
                <CheckboxField
                  id="ccr_write_offs"
                  checked={formData.country_context.ireland.ccr_write_offs}
                  label="CCR write-offs present"
                  onChange={(checked) => updateCountryContext("ireland", "ccr_write_offs", checked)}
                />
                <CheckboxField
                  id="sbci_eligible"
                  checked={formData.sbci_eligible}
                  label="SBCI eligible"
                  onChange={(checked) => setFormData((current) => ({ ...current, sbci_eligible: checked }))}
                />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="repayment_history_score">Repayment History Score (1-5)</Label>
                  <Input
                    id="repayment_history_score"
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.repayment_history_score}
                    onChange={(event) => setFormData((current) => ({ ...current, repayment_history_score: toNumber(event.target.value) }))}
                  />
                </div>
              </div>
            ) : null}

            {formData.country === "spain" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cirbe_total_exposure">CIRBE Total Exposure</Label>
                  <Input
                    id="cirbe_total_exposure"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.country_context.spain.cirbe_total_exposure}
                    onChange={(event) => updateCountryContext("spain", "cirbe_total_exposure", toNumber(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requested_maturity_months">Requested Maturity (months)</Label>
                  <Input
                    id="requested_maturity_months"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.country_context.spain.requested_maturity_months}
                    onChange={(event) => updateCountryContext("spain", "requested_maturity_months", toNumber(event.target.value))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="collateral_maturity_notes">Collateral / Maturity Notes</Label>
                  <textarea
                    id="collateral_maturity_notes"
                    className={textareaClassName}
                    value={formData.country_context.spain.collateral_maturity_notes}
                    onChange={(event) => updateCountryContext("spain", "collateral_maturity_notes", event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {formData.country === "france" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bdf_turnover_letter">BdF Turnover Letter</Label>
                  <Input
                    id="bdf_turnover_letter"
                    value={formData.country_context.france.bdf_turnover_letter}
                    maxLength={1}
                    onChange={(event) => updateCountryContext("france", "bdf_turnover_letter", event.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bdf_credit_score_digit">BdF Credit Score Digit</Label>
                  <Input
                    id="bdf_credit_score_digit"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.country_context.france.bdf_credit_score_digit}
                    onChange={(event) => updateCountryContext("france", "bdf_credit_score_digit", toNumber(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiben_score">FIBEN Score (1-8)</Label>
                  <Input
                    id="fiben_score"
                    type="number"
                    min="1"
                    max="8"
                    step="1"
                    value={formData.fiben_score}
                    onChange={(event) => setFormData((current) => ({ ...current, fiben_score: toNumber(event.target.value) }))}
                  />
                </div>
                <div className="sm:col-span-1" />
                <CheckboxField
                  id="wants_bpifrance_guarantee"
                  checked={formData.country_context.france.wants_bpifrance_guarantee}
                  label="Bpifrance guarantee should be considered"
                  onChange={(checked) => updateCountryContext("france", "wants_bpifrance_guarantee", checked)}
                />
                <CheckboxField
                  id="late_payment_flag"
                  checked={formData.late_payment_flag}
                  label="Late payment flag"
                  onChange={(checked) => setFormData((current) => ({ ...current, late_payment_flag: checked }))}
                />
                <CheckboxField
                  id="cir_eligible"
                  checked={formData.cir_eligible}
                  label="CIR (R&D tax credit) eligible"
                  onChange={(checked) => setFormData((current) => ({ ...current, cir_eligible: checked }))}
                />
              </div>
            ) : null}

            {formData.country === "netherlands" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legal_form">Legal Form</Label>
                  <select
                    id="legal_form"
                    className={selectClassName}
                    value={formData.country_context.netherlands.legal_form}
                    onChange={(event) => updateCountryContext("netherlands", "legal_form", event.target.value)}
                  >
                    <option value="bv">BV</option>
                    <option value="nv">NV</option>
                    <option value="eenmanszaak">Eenmanszaak</option>
                    <option value="vof">VOF</option>
                    <option value="maatschap">Maatschap</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <CheckboxField
                    id="bkr_events_present"
                    checked={formData.country_context.netherlands.bkr_events_present}
                    label="BKR events present"
                    onChange={(checked) => updateCountryContext("netherlands", "bkr_events_present", checked)}
                  />
                </div>
              </div>
            ) : null}

            {formData.country === "germany" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField
                  id="company_register_extract_available"
                  checked={formData.country_context.germany.company_register_extract_available}
                  label="Company Register extract available"
                  onChange={(checked) => updateCountryContext("germany", "company_register_extract_available", checked)}
                />
                <CheckboxField
                  id="company_register_accounts_available"
                  checked={formData.country_context.germany.company_register_accounts_available}
                  label="Filed accounts available"
                  onChange={(checked) => updateCountryContext("germany", "company_register_accounts_available", checked)}
                />
                <CheckboxField
                  id="wants_guarantee_bank"
                  checked={formData.country_context.germany.wants_guarantee_bank}
                  label="Guarantee bank route should be considered"
                  onChange={(checked) => updateCountryContext("germany", "wants_guarantee_bank", checked)}
                />
                <CheckboxField
                  id="wants_kfw_route"
                  checked={formData.country_context.germany.wants_kfw_route}
                  label="KfW route should be considered"
                  onChange={(checked) => updateCountryContext("germany", "wants_kfw_route", checked)}
                />
                <div className="space-y-2">
                  <Label htmlFor="schufa_score">SCHUFA Score (100-999)</Label>
                  <Input
                    id="schufa_score"
                    type="number"
                    min="100"
                    max="999"
                    step="1"
                    value={formData.schufa_score}
                    onChange={(event) => setFormData((current) => ({ ...current, schufa_score: toNumber(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hausbank_years">Hausbank Relationship (years)</Label>
                  <Input
                    id="hausbank_years"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.hausbank_years}
                    onChange={(event) => setFormData((current) => ({ ...current, hausbank_years: toNumber(event.target.value) }))}
                  />
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          <WandSparkles className="mr-2 h-4 w-4" />
          {loading ? "Registering..." : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
