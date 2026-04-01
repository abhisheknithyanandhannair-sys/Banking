export type CountryCode = "ireland" | "spain" | "france" | "netherlands" | "germany";
export type SchemeChannel = "bank" | "guarantee" | "microfinance" | "public_scheme";
export type ReadinessBand = "Green" | "Amber" | "Red";
export type CapexTiming = "neutral" | "defer" | "bring_forward";

export interface ProfitAndLoss {
  revenue: number;
  cogs: number;
  operating_expenses: number;
  payroll_expense: number;
  interest_expense: number;
  tax_expense: number;
  depreciation: number;
}

export interface BalanceSheet {
  cash: number;
  receivables: number;
  current_assets: number;
  inventory: number;
  payables: number;
  current_liabilities: number;
  total_assets: number;
  total_liabilities: number;
  equity: number;
}

export interface FacilityRequest {
  requested_amount: number;
  outstanding_debt: number;
  annual_debt_service: number;
  interest_rate_pct: number;
  requested_term_months: number;
  collateral_type: string;
  collateral_value: number;
  planned_capex: number;
  scheme_channel: SchemeChannel;
}

export interface BankData {
  monthly_revenue: number[];
  monthly_net_cashflow: number[];
}

export interface DocumentationInput {
  latest_accounts_age_months: number;
  missing_filings: boolean;
  registry_report_available: boolean;
  tax_id_available: boolean;
  business_id_available: boolean;
  director_id_available: boolean;
  name_mismatch_flag: boolean;
  address_mismatch_flag: boolean;
  bank_account_name_mismatch_flag: boolean;
}

export interface IrelandContext {
  ccr_arrears: boolean;
  ccr_restructures: boolean;
  ccr_write_offs: boolean;
}

export interface SpainContext {
  cirbe_total_exposure: number;
  collateral_maturity_notes: string;
  requested_maturity_months: number;
}

export interface FranceContext {
  bdf_turnover_letter: string;
  bdf_credit_score_digit: number;
  wants_bpifrance_guarantee: boolean;
}

export interface NetherlandsContext {
  legal_form: string;
  bkr_events_present: boolean;
}

export interface GermanyContext {
  company_register_extract_available: boolean;
  company_register_accounts_available: boolean;
  wants_guarantee_bank: boolean;
  wants_kfw_route: boolean;
}

export interface CountryContext {
  ireland: IrelandContext;
  spain: SpainContext;
  france: FranceContext;
  netherlands: NetherlandsContext;
  germany: GermanyContext;
}

export interface WhatIfScenario {
  price_margin_change_pct: number;
  payroll_change_pct: number;
  dso_change_days: number;
  inventory_change_days: number;
  capex_timing: CapexTiming;
  debt_term_change_months: number;
  interest_rate_shock_bps: number;
}

export interface AnalysisInput {
  country: CountryCode;
  pl: ProfitAndLoss;
  bs: BalanceSheet;
  facility: FacilityRequest;
  bank: BankData;
  documentation: DocumentationInput;
  country_context: CountryContext;
  scenario: WhatIfScenario;
}

export interface ReadinessResult {
  score: number;
  band: ReadinessBand;
  explanation: string;
}

export interface Blocker {
  title: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

export interface StressTestResult {
  name: string;
  readiness_band: ReadinessBand;
  dscr_proxy: number;
  liquidity_runway_months: number;
  headline: string;
}

export interface CashflowAnalysis {
  net_operating_cashflow_proxy: number;
  seasonality_index: number;
  liquidity_runway_months: number;
  revenue_volatility: number;
  stress_tests: StressTestResult[];
}

export interface DocumentationAnalysis {
  score: number;
  missing_items: string[];
  mismatch_flags: string[];
  stale_accounts: boolean;
  summary: string;
}

export interface ChecklistItem {
  item: string;
  reason: string;
  required: boolean;
}

export interface SchemePathway {
  name: string;
  channel: string;
  fit_reason: string;
  next_step: string;
}

export interface LocalArtifact {
  artifact: string;
  what_it_means: string;
  what_it_does_not_mean: string;
}

export interface MetricComparison {
  key: string;
  label: string;
  baseline: number;
  scenario: number;
  unit: "ratio" | "percent" | "currency" | "days" | "months";
}

export interface WhatIfResult {
  active: boolean;
  levers: WhatIfScenario;
  readiness_score: number;
  readiness_band: ReadinessBand;
  band_drift: string;
  explanation: string;
  evidence_expectations: string[];
  metrics: MetricComparison[];
}

export interface AnalysisResult {
  country: CountryCode;
  readiness: ReadinessResult;
  why: string[];
  ratios: Record<string, number>;
  cashflow: CashflowAnalysis;
  documentation: DocumentationAnalysis;
  top_blockers: Blocker[];
  mitigants: string[];
  document_pack: ChecklistItem[];
  scheme_pathways: SchemePathway[];
  local_artifacts: LocalArtifact[];
  what_if: WhatIfResult;
}

export const emptyScenario: WhatIfScenario = {
  price_margin_change_pct: 0,
  payroll_change_pct: 0,
  dso_change_days: 0,
  inventory_change_days: 0,
  capex_timing: "neutral",
  debt_term_change_months: 0,
  interest_rate_shock_bps: 0,
};
