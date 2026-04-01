from __future__ import annotations

from collections import OrderedDict

from models import (
    AnalysisRequest,
    AnalysisResponse,
    Blocker,
    CashflowAnalysis,
    ChecklistItem,
    DocumentationAnalysis,
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


def analyze_credit_readiness(data: AnalysisRequest) -> AnalysisResponse:
    baseline_state = build_financial_state(data)
    baseline_ratios = run_ratio_engine(baseline_state)
    baseline_cashflow = run_cashflow_engine(baseline_state)
    documentation = run_documentation_engine(data.documentation)
    baseline_adapter = analyze_country_context(data, baseline_ratios, baseline_cashflow)

    baseline_score = _score_readiness(
        ratios=baseline_ratios,
        cashflow=baseline_cashflow,
        documentation=documentation,
        adapter=baseline_adapter,
    )
    baseline_band = _band_for_score(baseline_score)
    why = _build_why(data, baseline_ratios, baseline_cashflow, documentation, baseline_adapter, baseline_band)
    blockers = _build_blockers(baseline_ratios, baseline_cashflow, documentation, baseline_adapter)
    mitigants = _build_mitigants(data, baseline_ratios, baseline_cashflow, documentation, baseline_adapter)
    document_pack = _build_document_pack(data, documentation, baseline_adapter)
    stress_tests = _build_stress_tests(data)

    scenario_active = scenario_is_active(data.scenario)
    scenario_ratios = baseline_ratios
    scenario_cashflow = baseline_cashflow
    scenario_adapter = baseline_adapter
    scenario_score = baseline_score
    scenario_band = baseline_band

    if scenario_active:
        scenario_state = build_financial_state(data, data.scenario)
        scenario_ratios = run_ratio_engine(scenario_state)
        scenario_cashflow = run_cashflow_engine(scenario_state)
        scenario_adapter = analyze_country_context(data, scenario_ratios, scenario_cashflow)
        scenario_score = _score_readiness(
            ratios=scenario_ratios,
            cashflow=scenario_cashflow,
            documentation=documentation,
            adapter=scenario_adapter,
        )
        scenario_band = _band_for_score(scenario_score)

    return AnalysisResponse(
        country=data.country,
        readiness=ReadinessResult(
            score=baseline_score,
            band=baseline_band,
            explanation=" ".join(why[:2]) if why else "Baseline readiness has been computed from shared core metrics and local country signals.",
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
            levers=data.scenario,
            readiness_score=scenario_score,
            readiness_band=scenario_band,
            band_drift=_describe_band_drift(baseline_band, scenario_band, scenario_active),
            explanation=_build_what_if_explanation(baseline_ratios, scenario_ratios, baseline_cashflow, scenario_cashflow, scenario_active),
            evidence_expectations=scenario_adapter.evidence_expectations,
            metrics=_build_metric_comparisons(baseline_ratios, baseline_cashflow, scenario_ratios, scenario_cashflow),
        ),
    )


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
        reasons.append(f"Debt service coverage proxy is {ratios['dscr_proxy']:.2f}x, which supports baseline repayment capacity.")
    else:
        reasons.append(f"Debt service coverage proxy is only {ratios['dscr_proxy']:.2f}x, so repayment headroom looks tight.")

    if float(cashflow["liquidity_runway_months"]) >= 6:
        reasons.append(f"Liquidity runway is {float(cashflow['liquidity_runway_months']):.1f} months, which gives the case breathing room.")
    else:
        reasons.append(f"Liquidity runway is {float(cashflow['liquidity_runway_months']):.1f} months, which leaves limited room for shocks.")

    if float(documentation["score"]) < 70:
        reasons.append("Documentation readiness is below lender comfort, so filings and IDs are actively dragging the case.")
    else:
        reasons.append("Documentation quality is broadly supportive and should not be the main gating item.")

    reasons.extend(adapter.drivers)

    if band == "Green" and ratios["debt_to_equity"] <= 1.5:
        reasons.append("Leverage is controlled enough to keep the readiness band in the stronger range.")
    elif band == "Red":
        reasons.append("Multiple core metrics are outside lender comfort ranges, so the case remains red until mitigants are added.")

    return _unique(reasons)[:4]


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
        ChecklistItem(item="Current-year management accounts", reason="Shows whether performance is improving or deteriorating since the last filing."),
        ChecklistItem(item="12 months of bank statements or open banking export", reason="Supports the cashflow proxy and conduct review."),
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
