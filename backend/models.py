from typing import Dict, List, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


CountryCode = Literal["ireland", "spain", "france", "netherlands", "germany"]
SchemeChannel = Literal["bank", "guarantee", "microfinance", "public_scheme"]
ReadinessBand = Literal["Green", "Amber", "Red"]
Severity = Literal["high", "medium", "low"]
CapexTiming = Literal["neutral", "defer", "bring_forward"]
TrendDirection = Literal["up", "flat", "down", "mixed"]


def zero_series() -> List[float]:
    return [0.0] * 12


class ProfitAndLoss(BaseModel):
    revenue: float = Field(..., ge=0)
    cogs: float = Field(0, ge=0)
    operating_expenses: float = Field(0, ge=0)
    payroll_expense: float = Field(0, ge=0)
    interest_expense: float = Field(0, ge=0)
    tax_expense: float = Field(0, ge=0)
    depreciation: float = Field(0, ge=0)


class BalanceSheet(BaseModel):
    cash: float = Field(0, ge=0)
    receivables: float = Field(0, ge=0)
    current_assets: float = Field(..., ge=0)
    inventory: float = Field(0, ge=0)
    payables: float = Field(0, ge=0)
    current_liabilities: float = Field(..., ge=0)
    total_assets: float = Field(..., ge=0)
    total_liabilities: float = Field(..., ge=0)
    equity: float = Field(..., ge=0)


class HistoricalFinancialYear(BaseModel):
    year_label: str = Field(..., min_length=1, max_length=20)
    pl: ProfitAndLoss
    bs: BalanceSheet


class FacilityRequest(BaseModel):
    requested_amount: float = Field(75000, ge=0)
    outstanding_debt: float = Field(120000, ge=0)
    annual_debt_service: float = Field(30000, ge=0)
    interest_rate_pct: float = Field(6.5, ge=0, le=100)
    requested_term_months: int = Field(48, ge=12, le=240)
    collateral_type: str = Field("Unsecured", min_length=1, max_length=80)
    collateral_value: float = Field(0, ge=0)
    planned_capex: float = Field(0, ge=0)
    scheme_channel: SchemeChannel = "bank"


class BankData(BaseModel):
    monthly_revenue: List[float] = Field(default_factory=zero_series, min_length=12, max_length=12)
    monthly_net_cashflow: List[float] = Field(default_factory=zero_series, min_length=12, max_length=12)


class DocumentationInput(BaseModel):
    latest_accounts_age_months: int = Field(12, ge=0, le=120)
    missing_filings: bool = False
    registry_report_available: bool = True
    tax_id_available: bool = True
    business_id_available: bool = True
    director_id_available: bool = True
    name_mismatch_flag: bool = False
    address_mismatch_flag: bool = False
    bank_account_name_mismatch_flag: bool = False


class IrelandContext(BaseModel):
    ccr_arrears: bool = False
    ccr_restructures: bool = False
    ccr_write_offs: bool = False


class SpainContext(BaseModel):
    cirbe_total_exposure: float = Field(0, ge=0)
    collateral_maturity_notes: str = Field("", max_length=200)
    requested_maturity_months: int = Field(36, ge=6, le=240)


class FranceContext(BaseModel):
    bdf_turnover_letter: str = Field("", max_length=1)
    bdf_credit_score_digit: int = Field(0, ge=0, le=9)
    wants_bpifrance_guarantee: bool = False


class NetherlandsContext(BaseModel):
    legal_form: str = Field("bv", min_length=1, max_length=50)
    bkr_events_present: bool = False


class GermanyContext(BaseModel):
    company_register_extract_available: bool = True
    company_register_accounts_available: bool = True
    wants_guarantee_bank: bool = False
    wants_kfw_route: bool = False


class CountryContext(BaseModel):
    ireland: IrelandContext = Field(default_factory=IrelandContext)
    spain: SpainContext = Field(default_factory=SpainContext)
    france: FranceContext = Field(default_factory=FranceContext)
    netherlands: NetherlandsContext = Field(default_factory=NetherlandsContext)
    germany: GermanyContext = Field(default_factory=GermanyContext)


class WhatIfScenario(BaseModel):
    price_margin_change_pct: float = Field(0, ge=-20, le=20)
    payroll_change_pct: float = Field(0, ge=-30, le=30)
    dso_change_days: int = Field(0, ge=-60, le=60)
    inventory_change_days: int = Field(0, ge=-60, le=60)
    capex_timing: CapexTiming = "neutral"
    debt_term_change_months: int = Field(0, ge=-24, le=60)
    interest_rate_shock_bps: int = Field(0, ge=-500, le=500)


class AnalysisRequest(BaseModel):
    country: CountryCode = "ireland"
    pl: ProfitAndLoss
    bs: BalanceSheet
    historical_financials: List[HistoricalFinancialYear] = Field(..., min_length=3, max_length=3)
    facility: FacilityRequest = Field(default_factory=FacilityRequest)
    bank: BankData = Field(default_factory=BankData)
    documentation: DocumentationInput = Field(default_factory=DocumentationInput)
    country_context: CountryContext = Field(default_factory=CountryContext)
    scenario: WhatIfScenario = Field(default_factory=WhatIfScenario)
    employee_count: int = Field(10, ge=0, le=10000)
    business_age_years: int = Field(5, ge=0, le=200)
    sector: str = Field("professional_services", min_length=1, max_length=50)
    consecutive_loss_months: int = Field(0, ge=0, le=24)
    repayment_history_score: int = Field(3, ge=1, le=5)
    fiben_score: int = Field(5, ge=1, le=8)
    schufa_score: int = Field(650, ge=100, le=999)
    hausbank_years: float = Field(3.0, ge=0)
    sbci_eligible: bool = False
    late_payment_flag: bool = False
    cir_eligible: bool = False

    @field_validator("historical_financials")
    @classmethod
    def validate_historical_years(cls, value: List[HistoricalFinancialYear]) -> List[HistoricalFinancialYear]:
        labels = [item.year_label.strip() for item in value]
        if len(set(labels)) != len(labels):
            raise ValueError("Historical financial year labels must be unique.")
        return value

    @model_validator(mode="after")
    def sync_latest_financials(self) -> "AnalysisRequest":
        latest_year = self.historical_financials[-1]
        object.__setattr__(self, "pl", latest_year.pl)
        object.__setattr__(self, "bs", latest_year.bs)
        return self


class ReadinessResult(BaseModel):
    score: int = Field(..., ge=0, le=100)
    band: ReadinessBand
    explanation: str


class Blocker(BaseModel):
    title: str
    severity: Severity
    detail: str


class StressTestResult(BaseModel):
    name: str
    readiness_band: ReadinessBand
    dscr_proxy: float
    liquidity_runway_months: float
    headline: str


class CashflowAnalysis(BaseModel):
    net_operating_cashflow_proxy: float
    seasonality_index: float
    liquidity_runway_months: float
    revenue_volatility: float
    stress_tests: List[StressTestResult]


class DocumentationAnalysis(BaseModel):
    score: int = Field(..., ge=0, le=100)
    missing_items: List[str]
    mismatch_flags: List[str]
    stale_accounts: bool
    summary: str


class ChecklistItem(BaseModel):
    item: str
    reason: str
    required: bool = True


class SchemePathway(BaseModel):
    name: str
    channel: str
    fit_reason: str
    next_step: str


class LocalArtifact(BaseModel):
    artifact: str
    what_it_means: str
    what_it_does_not_mean: str


class MetricComparison(BaseModel):
    key: str
    label: str
    baseline: float
    scenario: float
    unit: Literal["ratio", "percent", "currency", "days", "months"]


class WhatIfResult(BaseModel):
    active: bool
    levers: WhatIfScenario
    readiness_score: int = Field(..., ge=0, le=100)
    readiness_band: ReadinessBand
    band_drift: str
    explanation: str
    evidence_expectations: List[str]
    metrics: List[MetricComparison]


class PeerMetric(BaseModel):
    key: str
    label: str
    your_value: float
    your_value_formatted: str
    peer_average: float
    peer_average_formatted: str
    rating: Literal["above_average", "average", "below_average"]
    gap_pct: float


class PeerBenchmark(BaseModel):
    country: str
    sector: str
    overall_peer_rating: Literal["above_average", "average", "below_average"]
    above_average_count: int
    average_count: int
    below_average_count: int
    metrics: List[PeerMetric]


class HistoricalAnalysis(BaseModel):
    summary: str
    bullets: List[str]
    revenue_direction: TrendDirection
    margin_direction: TrendDirection
    leverage_direction: TrendDirection
    liquidity_direction: TrendDirection


class CommercialOpportunity(BaseModel):
    potential_amount_eur: float = Field(..., ge=0)
    indicative_rate_from_pct: float = Field(..., ge=0)
    headline: str
    supporting_copy: str
    disclaimer: str


class AnalysisResponse(BaseModel):
    country: CountryCode
    readiness: ReadinessResult
    why: List[str]
    ratios: Dict[str, float]
    cashflow: CashflowAnalysis
    documentation: DocumentationAnalysis
    top_blockers: List[Blocker]
    mitigants: List[str]
    document_pack: List[ChecklistItem]
    scheme_pathways: List[SchemePathway]
    local_artifacts: List[LocalArtifact]
    what_if: WhatIfResult
    peer_benchmark: PeerBenchmark
    historical_analysis: HistoricalAnalysis
    commercial_opportunity: CommercialOpportunity


class AgentRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=160)
    registration_number: str = Field("", max_length=80)
    contact_name: str = Field(..., min_length=1, max_length=160)
    contact_email: str = Field(..., min_length=3, max_length=160)
    contact_phone: str = Field("", max_length=80)
    country: CountryCode
    readiness_band: ReadinessBand
    readiness_score: int = Field(..., ge=0, le=100)
    potential_amount_eur: float = Field(..., ge=0)
    indicative_rate_from_pct: float = Field(..., ge=0)
    notes: str = Field("", max_length=1000)


class AgentRequestReceipt(BaseModel):
    request_id: str
    status: Literal["received"]
    message: str
