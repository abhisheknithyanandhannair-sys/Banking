from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, pstdev

from models import AnalysisRequest, DocumentationInput, WhatIfScenario


@dataclass
class FinancialState:
    revenue: float
    cogs: float
    operating_expenses: float
    payroll_expense: float
    interest_expense: float
    tax_expense: float
    depreciation: float
    cash: float
    receivables: float
    inventory: float
    payables: float
    current_assets: float
    current_liabilities: float
    total_assets: float
    total_liabilities: float
    equity: float
    requested_amount: float
    outstanding_debt: float
    annual_debt_service: float
    interest_rate_pct: float
    requested_term_months: int
    collateral_type: str
    collateral_value: float
    planned_capex: float
    scheme_channel: str
    monthly_revenue: list[float]
    monthly_net_cashflow: list[float]


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def scenario_is_active(scenario: WhatIfScenario) -> bool:
    return any(
        [
            scenario.price_margin_change_pct != 0,
            scenario.payroll_change_pct != 0,
            scenario.dso_change_days != 0,
            scenario.inventory_change_days != 0,
            scenario.capex_timing != "neutral",
            scenario.debt_term_change_months != 0,
            scenario.interest_rate_shock_bps != 0,
        ]
    )


def _normalize_positive_series(values: list[float], annual_total: float) -> list[float]:
    sanitized = [max(0.0, float(value)) for value in values]
    total = sum(sanitized)
    if total > 0 and annual_total > 0:
        return [annual_total * safe_divide(value, total) for value in sanitized]
    if annual_total > 0:
        evenly_split = annual_total / 12
        return [evenly_split] * 12
    return [0.0] * 12


def _default_monthly_cashflow(
    revenue: float,
    cogs: float,
    operating_expenses: float,
    interest_expense: float,
    tax_expense: float,
) -> list[float]:
    baseline_annual = revenue - cogs - operating_expenses - interest_expense - tax_expense
    return [baseline_annual / 12] * 12


def build_financial_state(data: AnalysisRequest, scenario: WhatIfScenario | None = None) -> FinancialState:
    scenario = scenario or WhatIfScenario()
    pl = data.pl
    bs = data.bs
    facility = data.facility

    revenue = pl.revenue
    cogs = pl.cogs
    operating_expenses = pl.operating_expenses
    payroll_expense = pl.payroll_expense
    interest_expense = pl.interest_expense
    tax_expense = pl.tax_expense

    other_current_assets = max(bs.current_assets - bs.cash - bs.receivables - bs.inventory, 0.0)
    other_assets = max(bs.total_assets - bs.current_assets, 0.0)

    gross_margin_impact = revenue * (scenario.price_margin_change_pct / 100)
    payroll_delta = payroll_expense * (scenario.payroll_change_pct / 100)
    operating_expenses += payroll_delta

    receivables_delta = revenue * safe_divide(scenario.dso_change_days, 365)
    inventory_delta = cogs * safe_divide(scenario.inventory_change_days, 365)

    cash = bs.cash - receivables_delta - inventory_delta
    receivables = max(bs.receivables + receivables_delta, 0.0)
    inventory = max(bs.inventory + inventory_delta, 0.0)

    capex_cash_delta = 0.0
    if scenario.capex_timing == "defer":
        capex_cash_delta = facility.planned_capex * 0.6
    elif scenario.capex_timing == "bring_forward":
        capex_cash_delta = -facility.planned_capex * 0.6
    cash = max(cash + capex_cash_delta, 0.0)

    rate_delta = facility.outstanding_debt * (scenario.interest_rate_shock_bps / 10000)
    interest_expense = max(interest_expense + rate_delta, 0.0)

    base_principal_component = max(facility.annual_debt_service - pl.interest_expense, 0.0)
    adjusted_term = max(facility.requested_term_months + scenario.debt_term_change_months, 12)
    principal_scaler = safe_divide(facility.requested_term_months, adjusted_term)
    annual_debt_service = max(interest_expense + (base_principal_component * principal_scaler), 0.0)

    current_assets = max(cash + receivables + inventory + other_current_assets, 0.0)
    total_assets = max(current_assets + other_assets, 0.0)

    monthly_revenue = _normalize_positive_series(data.bank.monthly_revenue, revenue)
    monthly_cashflow = list(data.bank.monthly_net_cashflow)
    if not any(abs(value) > 0 for value in monthly_cashflow):
        monthly_cashflow = _default_monthly_cashflow(
            revenue=revenue,
            cogs=cogs,
            operating_expenses=operating_expenses,
            interest_expense=interest_expense,
            tax_expense=tax_expense,
        )

    annual_cashflow_delta = gross_margin_impact - payroll_delta - receivables_delta - inventory_delta + capex_cash_delta - (
        annual_debt_service - facility.annual_debt_service
    )
    adjusted_monthly_cashflow = [value + (annual_cashflow_delta / 12) for value in monthly_cashflow]

    return FinancialState(
        revenue=revenue,
        cogs=max(cogs - gross_margin_impact, 0.0),
        operating_expenses=max(operating_expenses, 0.0),
        payroll_expense=max(payroll_expense + payroll_delta, 0.0),
        interest_expense=interest_expense,
        tax_expense=tax_expense,
        depreciation=pl.depreciation,
        cash=cash,
        receivables=receivables,
        inventory=inventory,
        payables=bs.payables,
        current_assets=current_assets,
        current_liabilities=bs.current_liabilities,
        total_assets=total_assets,
        total_liabilities=bs.total_liabilities,
        equity=bs.equity,
        requested_amount=facility.requested_amount,
        outstanding_debt=facility.outstanding_debt,
        annual_debt_service=annual_debt_service,
        interest_rate_pct=facility.interest_rate_pct + (scenario.interest_rate_shock_bps / 100),
        requested_term_months=adjusted_term,
        collateral_type=facility.collateral_type,
        collateral_value=facility.collateral_value,
        planned_capex=facility.planned_capex,
        scheme_channel=facility.scheme_channel,
        monthly_revenue=monthly_revenue,
        monthly_net_cashflow=adjusted_monthly_cashflow,
    )


def run_ratio_engine(state: FinancialState) -> dict[str, float]:
    gross_profit = state.revenue - state.cogs
    ebit = gross_profit - state.operating_expenses
    ebitda = ebit + state.depreciation
    net_profit = ebit - state.interest_expense - state.tax_expense

    dso = safe_divide(state.receivables * 365, state.revenue)
    inventory_days = safe_divide(state.inventory * 365, state.cogs)
    dpo = safe_divide(state.payables * 365, state.cogs)
    working_capital_cycle_days = dso + inventory_days - dpo

    return {
        "current_ratio": round(safe_divide(state.current_assets, state.current_liabilities), 4),
        "quick_ratio": round(safe_divide(state.current_assets - state.inventory, state.current_liabilities), 4),
        "debt_to_equity": round(safe_divide(state.total_liabilities, state.equity), 4),
        "liabilities_to_assets": round(safe_divide(state.total_liabilities, state.total_assets), 4),
        "leverage_to_ebitda": round(safe_divide(state.outstanding_debt, ebitda), 4),
        "interest_coverage": round(safe_divide(ebit, state.interest_expense), 4),
        "dscr_proxy": round(safe_divide(max(ebitda - state.tax_expense, 0.0), state.annual_debt_service), 4),
        "gross_margin": round(safe_divide(gross_profit, state.revenue), 4),
        "operating_margin": round(safe_divide(ebit, state.revenue), 4),
        "net_margin": round(safe_divide(net_profit, state.revenue), 4),
        "roa": round(safe_divide(net_profit, state.total_assets), 4),
        "roe": round(safe_divide(net_profit, state.equity), 4),
        "dso_days": round(dso, 2),
        "inventory_days": round(inventory_days, 2),
        "dpo_days": round(dpo, 2),
        "working_capital_cycle_days": round(working_capital_cycle_days, 2),
        "working_capital": round(state.current_assets - state.current_liabilities, 2),
        "ebitda": round(ebitda, 2),
        "net_profit": round(net_profit, 2),
    }


def run_cashflow_engine(state: FinancialState) -> dict[str, float | list]:
    monthly_revenue = state.monthly_revenue if any(value > 0 for value in state.monthly_revenue) else [state.revenue / 12] * 12
    monthly_net_cashflow = state.monthly_net_cashflow

    average_revenue = mean(monthly_revenue) if monthly_revenue else 0.0
    revenue_volatility = safe_divide(pstdev(monthly_revenue), average_revenue) if average_revenue else 0.0
    seasonality_index = safe_divide(max(monthly_revenue), average_revenue) if average_revenue else 0.0

    burn_months = [abs(value) for value in monthly_net_cashflow if value < 0]
    average_burn = mean(burn_months) if burn_months else 0.0
    liquidity_runway = 24.0 if average_burn == 0 else clamp(state.cash / average_burn, 0.0, 24.0)

    return {
        "net_operating_cashflow_proxy": round(sum(monthly_net_cashflow), 2),
        "seasonality_index": round(seasonality_index, 2),
        "liquidity_runway_months": round(liquidity_runway, 2),
        "revenue_volatility": round(revenue_volatility, 4),
        "stress_tests": [],
    }


def run_documentation_engine(documentation: DocumentationInput) -> dict[str, int | bool | list[str] | str]:
    missing_items: list[str] = []
    mismatch_flags: list[str] = []

    if documentation.missing_filings:
        missing_items.append("Required filings are still missing.")
    if not documentation.registry_report_available:
        missing_items.append("Registry extract or equivalent report is not yet available.")
    if not documentation.tax_id_available:
        missing_items.append("Tax identification evidence is missing.")
    if not documentation.business_id_available:
        missing_items.append("Business registration ID is missing.")
    if not documentation.director_id_available:
        missing_items.append("Director or beneficial owner ID pack is incomplete.")

    if documentation.name_mismatch_flag:
        mismatch_flags.append("Legal name differs across submissions.")
    if documentation.address_mismatch_flag:
        mismatch_flags.append("Registered address does not match supporting documents.")
    if documentation.bank_account_name_mismatch_flag:
        mismatch_flags.append("Bank account holder name does not fully match the legal entity.")

    stale_accounts = documentation.latest_accounts_age_months > 18
    score = 100
    if documentation.missing_filings:
        score -= 20
    if stale_accounts:
        score -= 15
    if not documentation.registry_report_available:
        score -= 10
    score -= len([item for item in missing_items if "ID" in item or "registration" in item.lower()]) * 8
    score -= len(mismatch_flags) * 7
    score = int(clamp(score, 0, 100))

    summary_parts = []
    if stale_accounts:
        summary_parts.append("accounts are stale")
    if missing_items:
        summary_parts.append("core documents are incomplete")
    if mismatch_flags:
        summary_parts.append("identity mismatches need to be resolved")
    summary = "Documentation is lender-ready." if not summary_parts else f"Documentation pressure points: {', '.join(summary_parts)}."

    return {
        "score": score,
        "missing_items": missing_items,
        "mismatch_flags": mismatch_flags,
        "stale_accounts": stale_accounts,
        "summary": summary,
    }
