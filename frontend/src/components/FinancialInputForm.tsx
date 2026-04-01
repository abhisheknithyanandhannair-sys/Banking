import { Upload, FileSpreadsheet, Link2, WandSparkles } from "lucide-react";
import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import {
  AnalysisInput,
  BalanceSheet,
  CountryCode,
  CountryContext,
  DocumentationInput,
  FacilityRequest,
  ProfitAndLoss,
  emptyScenario,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialInputFormProps {
  onAnalyze: (data: AnalysisInput) => Promise<void>;
  loading: boolean;
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

function readSpreadsheet(rows: Array<Record<string, unknown>>, current: AnalysisInput): AnalysisInput {
  const firstRow = rows[0] ?? {};
  const normalizedKeys = Object.keys(firstRow).map(normalizeKey);

  if (normalizedKeys.includes("metric") && normalizedKeys.includes("value")) {
    const rowMap: Record<string, number> = {};
    rows.forEach((row) => {
      const metric = normalizeKey(String(row.metric ?? row.Metric ?? ""));
      if (metric) {
        rowMap[metric] = toNumber(row.value ?? row.Value ?? 0);
      }
    });

    return {
      ...current,
      pl: {
        revenue: rowMap.revenue ?? current.pl.revenue,
        cogs: rowMap.cogs ?? current.pl.cogs,
        operating_expenses: rowMap.operating_expenses ?? current.pl.operating_expenses,
        payroll_expense: rowMap.payroll_expense ?? current.pl.payroll_expense,
        interest_expense: rowMap.interest_expense ?? current.pl.interest_expense,
        tax_expense: rowMap.tax_expense ?? current.pl.tax_expense,
        depreciation: rowMap.depreciation ?? current.pl.depreciation,
      },
      bs: {
        cash: rowMap.cash ?? current.bs.cash,
        receivables: rowMap.receivables ?? current.bs.receivables,
        current_assets: rowMap.current_assets ?? current.bs.current_assets,
        inventory: rowMap.inventory ?? current.bs.inventory,
        payables: rowMap.payables ?? current.bs.payables,
        current_liabilities: rowMap.current_liabilities ?? current.bs.current_liabilities,
        total_assets: rowMap.total_assets ?? current.bs.total_assets,
        total_liabilities: rowMap.total_liabilities ?? current.bs.total_liabilities,
        equity: rowMap.equity ?? current.bs.equity,
      },
    };
  }

  return {
    ...current,
    pl: {
      revenue: toNumber(firstRow.revenue ?? current.pl.revenue),
      cogs: toNumber(firstRow.cogs ?? current.pl.cogs),
      operating_expenses: toNumber(firstRow.operating_expenses ?? current.pl.operating_expenses),
      payroll_expense: toNumber(firstRow.payroll_expense ?? current.pl.payroll_expense),
      interest_expense: toNumber(firstRow.interest_expense ?? current.pl.interest_expense),
      tax_expense: toNumber(firstRow.tax_expense ?? current.pl.tax_expense),
      depreciation: toNumber(firstRow.depreciation ?? current.pl.depreciation),
    },
    bs: {
      cash: toNumber(firstRow.cash ?? current.bs.cash),
      receivables: toNumber(firstRow.receivables ?? current.bs.receivables),
      current_assets: toNumber(firstRow.current_assets ?? current.bs.current_assets),
      inventory: toNumber(firstRow.inventory ?? current.bs.inventory),
      payables: toNumber(firstRow.payables ?? current.bs.payables),
      current_liabilities: toNumber(firstRow.current_liabilities ?? current.bs.current_liabilities),
      total_assets: toNumber(firstRow.total_assets ?? current.bs.total_assets),
      total_liabilities: toNumber(firstRow.total_liabilities ?? current.bs.total_liabilities),
      equity: toNumber(firstRow.equity ?? current.bs.equity),
    },
  };
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

function countryHeading(country: CountryCode): string {
  return {
    ireland: "Ireland adapter",
    spain: "Spain adapter",
    france: "France adapter",
    netherlands: "Netherlands adapter",
    germany: "Germany adapter",
  }[country];
}

export default function FinancialInputForm({ onAnalyze, loading }: FinancialInputFormProps) {
  const [formData, setFormData] = useState<AnalysisInput>({
    country: "ireland",
    pl: defaultProfitAndLoss,
    bs: defaultBalanceSheet,
    facility: defaultFacility,
    bank: {
      monthly_revenue: defaultMonthlyRevenue,
      monthly_net_cashflow: defaultMonthlyNetCashflow,
    },
    documentation: defaultDocumentation,
    country_context: defaultCountryContext,
    scenario: emptyScenario,
  });
  const [monthlyRevenueText, setMonthlyRevenueText] = useState(seriesToText(defaultMonthlyRevenue));
  const [monthlyCashflowText, setMonthlyCashflowText] = useState(seriesToText(defaultMonthlyNetCashflow));
  const [uploadMessage, setUploadMessage] = useState<string>(
    "Upload a CSV or Excel sheet to pre-fill the financial statements."
  );

  const updatePL = (key: keyof ProfitAndLoss, value: number) => {
    setFormData((current) => ({
      ...current,
      pl: {
        ...current.pl,
        [key]: value,
      },
    }));
  };

  const updateBS = (key: keyof BalanceSheet, value: number) => {
    setFormData((current) => ({
      ...current,
      bs: {
        ...current.bs,
        [key]: value,
      },
    }));
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
      setUploadMessage(`Loaded ${file.name}. Review the values and run the readiness analysis.`);
    } catch {
      setUploadMessage("The file could not be parsed. Use the template structure and try again.");
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

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader>
        <CardTitle className="text-2xl">Application Input</CardTitle>
        <CardDescription>
          Capture shared financial data first, then add the local credit signals that drive each country adapter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border bg-accent/60 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Connect first, type later</p>
              <p className="leading-6 text-muted-foreground">
                This demo accepts manual overrides, but the intended operating model is registry identity plus Open
                Banking data first, with typed edits only for exceptions and lender-side context.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              className={selectClassName}
              value={formData.country}
              onChange={(event) => setFormData((current) => ({ ...current, country: event.target.value as CountryCode }))}
            >
              <option value="ireland">Ireland</option>
              <option value="spain">Spain</option>
              <option value="france">France</option>
              <option value="netherlands">Netherlands</option>
              <option value="germany">Germany</option>
            </select>
          </div>

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
                Excel outline: use columns <code>metric</code> and <code>value</code>, or a single row with matching
                field names. Supported metrics: {uploadMetrics.join(", ")}.
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="facility">Facility</TabsTrigger>
            <TabsTrigger value="bank">Bank Data</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
            <TabsTrigger value="country">Country</TabsTrigger>
          </TabsList>

          <TabsContent value="financials" className="mt-4 space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium">Profit &amp; loss</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {metricSections.pl.map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.pl[key]}
                      onChange={(event) => updatePL(key, toNumber(event.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Balance sheet</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {metricSections.bs.map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bs[key]}
                      onChange={(event) => updateBS(key, toNumber(event.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
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
              Enter 12 comma-separated values for both series. The backend uses monthly revenue for seasonality and
              monthly net cashflow as the bank-data operating cashflow proxy.
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
                <div className="sm:col-span-2">
                  <CheckboxField
                    id="wants_bpifrance_guarantee"
                    checked={formData.country_context.france.wants_bpifrance_guarantee}
                    label="Bpifrance guarantee should be considered"
                    onChange={(checked) => updateCountryContext("france", "wants_bpifrance_guarantee", checked)}
                  />
                </div>
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
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        <Button
          className="w-full"
          onClick={() => {
            syncSeriesToState();
            const monthlyRevenue = parseSeries(monthlyRevenueText, formData.bank.monthly_revenue);
            const monthlyNetCashflow = parseSeries(monthlyCashflowText, formData.bank.monthly_net_cashflow);
            onAnalyze({
              ...formData,
              bank: {
                monthly_revenue: monthlyRevenue,
                monthly_net_cashflow: monthlyNetCashflow,
              },
            });
          }}
          disabled={loading}
        >
          <WandSparkles className="mr-2 h-4 w-4" />
          {loading ? "Analyzing..." : "Analyze Readiness"}
        </Button>
      </CardContent>
    </Card>
  );
}
