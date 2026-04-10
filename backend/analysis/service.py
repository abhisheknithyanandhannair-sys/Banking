from __future__ import annotations

from collections import OrderedDict

from benchmarks import get_peer_benchmark
from ml_scorer import MLScorer
from models import (
    AnalysisRequest,
    AnalysisResponse,
    Blocker,
    CashflowAnalysis,
    ChecklistItem,
    CommercialOpportunity,
    DocumentationAnalysis,
    HistoricalAnalysis,
    HistoricalFinancialYear,
    MetricComparison,
    ReadinessResult,
    StressTestResult,
    WhatIfResult,
)

from .adapters import CountryAdapterResult, analyze_country_context
from .core import (
    build_financial_state,
    clamp,
    run_cashflow_engine,
    run_documentation_engine,
    run_ratio_engine,
    safe_divide,
    scenario_is_active,
)

_scorer = MLScorer()


def analyze_credit_readiness(data: AnalysisRequest) -> AnalysisResponse:
    normalized_data = _normalize_request_with_latest_financials(data)
    baseline_state = build_financial_state(normalized_data)
    baseline_ratios = run_ratio_engine(baseline_state)
    benchmark = get_peer_benchmark(
        country=normalized_data.country,
        sector=getattr(normalized_data, "sector", "professional_services"),
        ratios=baseline_ratios,
    )
    baseline_cashflow = run_cashflow_engine(baseline_state)
    documentation = run_documentation_engine(normalized_data.documentation)
    baseline_adapter = analyze_country_context(normalized_data, baseline_ratios, baseline_cashflow)

    ml_result = _scorer.predict(
        country=normalized_data.country,
        ratios=baseline_ratios,
        cashflow=baseline_cashflow,
        data=normalized_data,
    )
    baseline_score = ml_result["score"]
    baseline_band = _band_for_score(baseline_score)

    why = _build_why(
        normalized_data,
        baseline_ratios,
        baseline_cashflow,
        documentation,
        baseline_adapter,
        baseline_band,
    )
    blockers = _build_blockers(baseline_ratios, baseline_cashflow, documentation, baseline_adapter)
    mitigants = _build_mitigants(normalized_data, baseline_ratios, baseline_cashflow, documentation, baseline_adapter)
    document_pack = _build_document_pack(normalized_data, documentation, baseline_adapter)
    stress_tests = _build_stress_tests(normalized_data)
    historical_analysis = _build_historical_analysis(normalized_data.historical_financials)
    commercial_opportunity = _build_commercial_opportunity(normalized_data, baseline_band, documentation, baseline_ratios)

    scenario_active = scenario_is_active(normalized_data.scenario)
    scenario_ratios = baseline_ratios
    scenario_cashflow = baseline_cashflow
    scenario_adapter = baseline_adapter
    scenario_score = baseline_score
    scenario_band = baseline_band

    if scenario_active:
        scenario_state = build_financial_state(normalized_data, normalized_data.scenario)
        scenario_ratios = run_ratio_engine(scenario_state)
        scenario_cashflow = run_cashflow_engine(scenario_state)
        scenario_adapter = analyze_country_context(normalized_data, scenario_ratios, scenario_cashflow)
        scenario_score = _score_readiness(
            ratios=scenario_ratios,
            cashflow=scenario_cashflow,
            documentation=documentation,
            adapter=scenario_adapter,
        )
        scenario_band = _band_for_score(scenario_score)

    return AnalysisResponse(
        country=normalized_data.country,
        peer_benchmark=benchmark,
        readiness=ReadinessResult(
            score=baseline_score,
            band=baseline_band,
            explanation=" ".join(why[:2])
            if why
            else "Baseline readiness has been computed from shared core metrics and local country signals.",
        ),
        why=why,
        ratios=baseline_ratios,
        cashflow=CashflowAnalysis(
            net_operating_cashflow_proxy=float(baseline_cashflow["net_operating_cashflow_proxy"]),
            seasonality_index=float(baseline_cashflow["seasonality_index"]),
            liquidity_runway_months=float(baseline_cashflow["liquidity_runway_months"]),
            revenue_volatility=float(baseline_cashflow["revenue_volatility"]),
            stress_tests=stress_tests,
        ),
        documentation=DocumentationAnalysis(**documentation),
        top_blockers=blockers,
        mitigants=mitigants,
        document_pack=document_pack,
        scheme_pathways=baseline_adapter.scheme_pathways,
        local_artifacts=baseline_adapter.local_artifacts,
        what_if=WhatIfResult(
            active=scenario_active,
            levers=normalized_data.scenario,
            readiness_score=scenario_score,
            readiness_band=scenario_band,
            band_drift=_describe_band_drift(baseline_band, scenario_band, scenario_active),
            explanation=_build_what_if_explanation(
                baseline_ratios,
                scenario_ratios,
                baseline_cashflow,
                scenario_cashflow,
                scenario_active,
            ),
            evidence_expectations=scenario_adapter.evidence_expectations,
            metrics=_build_metric_comparisons(
                baseline_ratios,
                baseline_cashflow,
                scenario_ratios,
                scenario_cashflow,
            ),
        ),
        historical_analysis=historical_analysis,
        commercial_opportunity=commercial_opportunity,
    )


def _normalize_request_with_latest_financials(data: AnalysisRequest) -> AnalysisRequest:
    latest_year = data.historical_financials[-1]
    return data.model_copy(update={"pl": latest_year.pl, "bs": latest_year.bs})


def _score_metric(value: float, good: float, ok: float, higher_is_better: bool) -> float:
    if higher_is_better:
        if value >= good:
            return 1.0
        if value >= ok:
            return 0.6
        return 0.2
    if value <= good:
        return 1.0
    if value <= ok:
        return 0.6
    return 0.2


def _score_readiness(
    ratios: dict[str, float],
    cashflow: dict[str, float | list],
    documentation: dict[str, int | bool | list[str] | str],
    adapter: CountryAdapterResult,
) -> int:
    net_operating_cashflow_proxy = float(cashflow["net_operating_cashflow_proxy"])
    revenue_proxy = max(abs(float(ratios["net_profit"])) + abs(net_operating_cashflow_proxy), 1.0)
    cashflow_margin_proxy = safe_divide(net_operating_cashflow_proxy, revenue_proxy)

    weighted_score = (
        _score_metric(ratios["current_ratio"], 1.5, 1.1, True) * 8
        + _score_metric(ratios["quick_ratio"], 1.0, 0.8, True) * 6
        + _score_metric(ratios["debt_to_equity"], 1.5, 2.5, False) * 10
        + _score_metric(ratios["interest_coverage"], 4.0, 1.5, True) * 10
        + _score_metric(ratios["dscr_proxy"], 1.4, 1.0, True) * 12
        + _score_metric(ratios["gross_margin"], 0.35, 0.2, True) * 8
        + _score_metric(ratios["net_margin"], 0.12, 0.05, True) * 10
        + _score_metric(ratios["working_capital_cycle_days"], 45.0, 75.0, False) * 6
        + _score_metric(float(cashflow["liquidity_runway_months"]), 6.0, 3.0, True) * 10
        + _score_metric(cashflow_margin_proxy, 0.08, 0.0, True) * 8
        + _score_metric(float(cashflow["revenue_volatility"]), 0.15, 0.3, False) * 6
        + _score_metric(float(documentation["score"]), 85.0, 65.0, True) * 6
    )
    return int(clamp(round(weighted_score) + adapter.score_adjustment, 0, 100))


def _band_for_score(score: int) -> str:
    if score >= 75:
        return "Green"
    if score >= 55:
        return "Amber"
    return "Red"


def _build_why(
    data: AnalysisRequest,
    ratios: dict[str, float],
    cashflow: dict[str, float | list],
    documentation: dict[str, int | bool | list[str] | str],
    adapter: CountryAdapterResult,
    band: str,
) -> list[str]:
    reasons: list[str] = []

    if ratios["dscr_proxy"] >= 1.2:
        reasons.append(
            f"Debt service coverage proxy is {ratios['dscr_proxy']:.2f}x, which supports baseline repayment capacity."
        )
    else:
        reasons.append(f"Debt service coverage proxy is only {ratios['dscr_proxy']:.2f}x, so repayment headroom looks tight.")

    if float(cashflow["liquidity_runway_months"]) >= 6:
        reasons.append(
            f"Liquidity runway is {float(cashflow['liquidity_runway_months']):.1f} months, which gives the case breathing room."
        )
    else:
        reasons.append(
            f"Liquidity runway is {float(cashflow['liquidity_runway_months']):.1f} months, which leaves limited room for shocks."
        )

    if float(documentation["score"]) < 70:
        reasons.append("Documentation readiness is below lender comfort, so filings and IDs are actively dragging the case.")
    else:
        reasons.append("Documentation quality is broadly supportive and should not be the main gating item.")

    reasons.extend(adapter.drivers)

    if band == "Green" and ratios["debt_to_equity"] <= 1.5:
        reasons.append("Leverage is controlled enough to keep the readiness band in the stronger range.")
    elif band == "Red":
        reasons.append("Multiple core metrics are outside lender comfort ranges, so the case remains red until mitigants are added.")

    if data.historical_financials:
        latest_label = data.historical_financials[-1].year_label
        reasons.append(f"The latest scored financial year is {latest_label}, while the full three-year history supports the narrative.")

    return _unique(reasons)[:5]


def _build_blockers(
    ratios: dict[str, float],
    cashflow: dict[str, float | list],
    documentation: dict[str, int | bool | list[str] | str],
    adapter: CountryAdapterResult,
) -> list[Blocker]:
    blockers: list[Blocker] = []

    if ratios["dscr_proxy"] < 1.0:
        blockers.append(
            Blocker(
                title="Cashflow coverage weak",
                severity="high",
                detail="Debt service coverage is below 1.0x, so the current case does not comfortably self-fund repayment.",
            )
        )
    elif ratios["dscr_proxy"] < 1.2:
        blockers.append(
            Blocker(
                title="Coverage only marginal",
                severity="medium",
                detail="Repayment capacity exists but with limited headroom for volatility or rate moves.",
            )
        )

    if ratios["debt_to_equity"] > 2.5:
        blockers.append(
            Blocker(
                title="Leverage high",
                severity="high",
                detail="Debt-to-equity is above 2.5x and may look stretched for new borrowing without support.",
            )
        )

    if ratios["current_ratio"] < 1.1 or float(cashflow["liquidity_runway_months"]) < 3:
        blockers.append(
            Blocker(
                title="Liquidity tight",
                severity="high",
                detail="Short-term liquidity is weak, which reduces room to absorb working-capital swings.",
            )
        )

    if float(cashflow["revenue_volatility"]) > 0.3:
        blockers.append(
            Blocker(
                title="Revenue volatility elevated",
                severity="medium",
                detail="Revenue pattern is volatile, so lenders will expect a stronger seasonality narrative and downside plan.",
            )
        )

    if bool(documentation["stale_accounts"]):
        blockers.append(
            Blocker(
                title="Accounts outdated",
                severity="medium",
                detail="The latest filed accounts are older than 18 months, which weakens lender confidence in the current picture.",
            )
        )

    if documentation["missing_items"] or documentation["mismatch_flags"]:
        blockers.append(
            Blocker(
                title="Documentation gaps",
                severity="medium",
                detail="Missing registry or ID evidence and unresolved mismatches will slow down credit processing.",
            )
        )

    blockers.extend(adapter.blockers)

    severity_rank = {"high": 0, "medium": 1, "low": 2}
    sorted_blockers = sorted(blockers, key=lambda blocker: (severity_rank[blocker.severity], blocker.title))
    return _unique_models(sorted_blockers, key=lambda blocker: blocker.title)[:5]


def _build_mitigants(
    data: AnalysisRequest,
    ratios: dict[str, float],
    cashflow: dict[str, float | list],
    documentation: dict[str, int | bool | list[str] | str],
    adapter: CountryAdapterResult,
) -> list[str]:
    mitigants: list[str] = []

    if ratios["dscr_proxy"] < 1.2:
        mitigants.append("Model a longer debt term or smaller facility size so annual debt service falls into a safer range.")
    if ratios["current_ratio"] < 1.2 or float(cashflow["liquidity_runway_months"]) < 4:
        mitigants.append("Release cash by tightening DSO, reducing inventory days, or phasing drawdown timing.")
    if ratios["debt_to_equity"] > 2.0:
        mitigants.append("Offset leverage with more equity, quasi-equity, or a staged facility structure.")
    if data.facility.collateral_value < (data.facility.requested_amount * 0.3):
        mitigants.append("Improve collateral support or route the case through a guarantee-backed channel.")
    if documentation["missing_items"] or documentation["mismatch_flags"]:
        mitigants.append("Close filing, registry, and ID mismatches before submitting the final lender pack.")

    mitigants.extend(adapter.mitigants)
    return _unique(mitigants)[:6]


def _build_document_pack(
    data: AnalysisRequest,
    documentation: dict[str, int | bool | list[str] | str],
    adapter: CountryAdapterResult,
) -> list[ChecklistItem]:
    items = [
        ChecklistItem(item="Latest filed accounts", reason="Anchors the historical lender view."),
        ChecklistItem(
            item="Current-year management accounts",
            reason="Shows whether performance is improving or deteriorating since the last filing.",
        ),
        ChecklistItem(
            item="12 months of bank statements or open banking export",
            reason="Supports the cashflow proxy and conduct review.",
        ),
        ChecklistItem(item="Aged receivables and payables", reason="Supports working-capital cycle analysis."),
        ChecklistItem(item="Debt schedule", reason="Explains current facilities, pricing, and annual service obligations."),
    ]

    if documentation["missing_items"]:
        items.append(
            ChecklistItem(
                item="Remediation pack for missing registry and ID items",
                reason="Needed because documentation gaps were flagged in the readiness engine.",
            )
        )

    if data.facility.scheme_channel == "guarantee":
        items.append(
            ChecklistItem(
                item="Guarantee justification note",
                reason="Explains why risk sharing is needed and how it mitigates the weak points in the case.",
            )
        )
    elif data.facility.scheme_channel == "microfinance":
        items.append(
            ChecklistItem(
                item="Owner background and use-of-funds note",
                reason="Microfinance pathways usually lean harder on owner narrative and practical use of proceeds.",
            )
        )
    elif data.facility.scheme_channel == "public_scheme":
        items.append(
            ChecklistItem(
                item="Eligibility evidence for public scheme route",
                reason="Needed when the pathway starts with scheme eligibility before the lender application.",
            )
        )

    items.extend(adapter.document_pack)
    return _unique_models(items, key=lambda item: item.item)


def _build_metric_comparisons(
    baseline_ratios: dict[str, float],
    baseline_cashflow: dict[str, float | list],
    scenario_ratios: dict[str, float],
    scenario_cashflow: dict[str, float | list],
) -> list[MetricComparison]:
    return [
        MetricComparison(
            key="dscr_proxy",
            label="Debt Service Coverage",
            baseline=baseline_ratios["dscr_proxy"],
            scenario=scenario_ratios["dscr_proxy"],
            unit="ratio",
        ),
        MetricComparison(
            key="liquidity_runway_months",
            label="Liquidity Runway",
            baseline=float(baseline_cashflow["liquidity_runway_months"]),
            scenario=float(scenario_cashflow["liquidity_runway_months"]),
            unit="months",
        ),
        MetricComparison(
            key="quick_ratio",
            label="Quick Ratio",
            baseline=baseline_ratios["quick_ratio"],
            scenario=scenario_ratios["quick_ratio"],
            unit="ratio",
        ),
        MetricComparison(
            key="working_capital_cycle_days",
            label="Working Capital Cycle",
            baseline=baseline_ratios["working_capital_cycle_days"],
            scenario=scenario_ratios["working_capital_cycle_days"],
            unit="days",
        ),
    ]


def _build_what_if_explanation(
    baseline_ratios: dict[str, float],
    scenario_ratios: dict[str, float],
    baseline_cashflow: dict[str, float | list],
    scenario_cashflow: dict[str, float | list],
    scenario_active: bool,
) -> str:
    if not scenario_active:
        return "Set one or more levers to see how coverage, runway, and working-capital pressure move."

    dscr_delta = scenario_ratios["dscr_proxy"] - baseline_ratios["dscr_proxy"]
    runway_delta = float(scenario_cashflow["liquidity_runway_months"]) - float(baseline_cashflow["liquidity_runway_months"])
    cycle_delta = scenario_ratios["working_capital_cycle_days"] - baseline_ratios["working_capital_cycle_days"]

    direction = "improves" if dscr_delta > 0 or runway_delta > 0 else "weakens"
    return (
        f"The active levers {direction} the scenario: DSCR moves by {dscr_delta:+.2f}x, "
        f"runway moves by {runway_delta:+.1f} months, and the working-capital cycle moves by {cycle_delta:+.1f} days."
    )


def _describe_band_drift(baseline_band: str, scenario_band: str, scenario_active: bool) -> str:
    if not scenario_active:
        return "No scenario applied."
    if baseline_band == scenario_band:
        return f"Band stays {baseline_band}."
    return f"Band shifts from {baseline_band} to {scenario_band}."


def _build_stress_tests(data: AnalysisRequest) -> list[StressTestResult]:
    scenarios = OrderedDict(
        {
            "Margin squeeze (-3%)": data.scenario.model_copy(update={"price_margin_change_pct": -3}),
            "Interest +200 bps": data.scenario.model_copy(update={"interest_rate_shock_bps": 200}),
            "DSO +15 days": data.scenario.model_copy(update={"dso_change_days": 15}),
        }
    )
    documentation = run_documentation_engine(data.documentation)
    results: list[StressTestResult] = []

    for name, scenario in scenarios.items():
        stress_state = build_financial_state(data, scenario)
        stress_ratios = run_ratio_engine(stress_state)
        stress_cashflow = run_cashflow_engine(stress_state)
        stress_adapter = analyze_country_context(data, stress_ratios, stress_cashflow)
        stress_score = _score_readiness(
            ratios=stress_ratios,
            cashflow=stress_cashflow,
            documentation=documentation,
            adapter=stress_adapter,
        )
        stress_band = _band_for_score(stress_score)
        results.append(
            StressTestResult(
                name=name,
                readiness_band=stress_band,
                dscr_proxy=stress_ratios["dscr_proxy"],
                liquidity_runway_months=float(stress_cashflow["liquidity_runway_months"]),
                headline=f"{name} would move the case to {stress_band} based on the shared core metrics.",
            )
        )

    return results


def _build_historical_analysis(historical_financials: list[HistoricalFinancialYear]) -> HistoricalAnalysis:
    revenues = [year.pl.revenue for year in historical_financials]
    net_margins = [_net_margin(year) for year in historical_financials]
    leverage = [_debt_to_equity(year) for year in historical_financials]
    liquidity = [_current_ratio(year) for year in historical_financials]

    revenue_direction = _series_direction(revenues)
    margin_direction = _series_direction(net_margins)
    leverage_direction = _series_direction(leverage)
    liquidity_direction = _series_direction(liquidity)

    start_label = historical_financials[0].year_label
    end_label = historical_financials[-1].year_label

    summary = (
        f"Across {start_label} to {end_label}, revenue trends {_direction_label(revenue_direction)}, "
        f"margins trend {_direction_label(margin_direction)}, leverage trends {_direction_label(leverage_direction)}, "
        f"and liquidity trends {_direction_label(liquidity_direction)}."
    )

    bullets = [
        f"Revenue moved from {_format_currency(historical_financials[0].pl.revenue)} in {start_label} to {_format_currency(historical_financials[-1].pl.revenue)} in {end_label}.",
        f"Net margin moved from {net_margins[0] * 100:.1f}% to {net_margins[-1] * 100:.1f}% across the three-year history.",
        f"Debt to equity moved from {leverage[0]:.2f}x to {leverage[-1]:.2f}x over the same period.",
        f"Current ratio moved from {liquidity[0]:.2f}x to {liquidity[-1]:.2f}x, which shapes the liquidity narrative.",
    ]

    return HistoricalAnalysis(
        summary=summary,
        bullets=bullets,
        revenue_direction=revenue_direction,
        margin_direction=margin_direction,
        leverage_direction=leverage_direction,
        liquidity_direction=liquidity_direction,
    )


def _build_commercial_opportunity(
    data: AnalysisRequest,
    band: str,
    documentation: dict[str, int | bool | list[str] | str],
    ratios: dict[str, float],
) -> CommercialOpportunity:
    multiplier = {"Green": 1.75, "Amber": 1.35, "Red": 1.0}[band]
    if float(documentation["score"]) >= 85:
        multiplier += 0.10
    if ratios["dscr_proxy"] >= 1.5:
        multiplier += 0.15

    requested_amount = float(data.facility.requested_amount)
    annual_revenue = max(float(data.pl.revenue), 1.0)
    capped_amount = min(requested_amount * multiplier, annual_revenue * 0.25)
    suggested_amount = max(requested_amount, capped_amount)
    rounded_amount = max(requested_amount, round(suggested_amount / 25000) * 25000)

    rate_discount = {"Green": 1.0, "Amber": 0.5, "Red": 0.0}[band]
    indicative_rate = max(float(data.facility.interest_rate_pct) - rate_discount, 3.5)

    headline = (
        f"You could unlock up to {_format_currency(rounded_amount)} in funding from {indicative_rate:.1f}% indicative pricing."
    )
    supporting_copy = (
        "Contact us to structure the right route across bank, guarantee, or scheme-backed channels and turn this readiness signal into a lender conversation."
    )
    disclaimer = "Indicative estimate only. Final structure, amount, and pricing remain subject to lender review and current market conditions."

    return CommercialOpportunity(
        potential_amount_eur=rounded_amount,
        indicative_rate_from_pct=indicative_rate,
        headline=headline,
        supporting_copy=supporting_copy,
        disclaimer=disclaimer,
    )


def _net_margin(year: HistoricalFinancialYear) -> float:
    revenue = max(year.pl.revenue, 1.0)
    net_profit = (
        year.pl.revenue
        - year.pl.cogs
        - year.pl.operating_expenses
        - year.pl.interest_expense
        - year.pl.tax_expense
    )
    return safe_divide(net_profit, revenue)


def _debt_to_equity(year: HistoricalFinancialYear) -> float:
    return safe_divide(year.bs.total_liabilities, year.bs.equity)


def _current_ratio(year: HistoricalFinancialYear) -> float:
    return safe_divide(year.bs.current_assets, year.bs.current_liabilities)


def _series_direction(values: list[float]) -> str:
    if len(values) < 2:
        return "flat"

    baseline = max(abs(values[0]), 1.0)
    tolerance = baseline * 0.03
    if abs(values[-1] - values[0]) <= tolerance:
        return "flat"

    increases = sum(1 for index in range(1, len(values)) if values[index] > values[index - 1] + tolerance)
    decreases = sum(1 for index in range(1, len(values)) if values[index] < values[index - 1] - tolerance)

    if increases and decreases:
        return "mixed"
    return "up" if values[-1] > values[0] else "down"


def _direction_label(direction: str) -> str:
    labels = {
        "up": "up",
        "flat": "flat",
        "down": "down",
        "mixed": "mixed",
    }
    return labels.get(direction, direction)


def _format_currency(value: float) -> str:
    return f"EUR {value:,.0f}"


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def _unique_models(items: list, key) -> list:
    seen: set[str] = set()
    ordered = []
    for item in items:
        item_key = key(item)
        if item_key not in seen:
            seen.add(item_key)
            ordered.append(item)
    return ordered
