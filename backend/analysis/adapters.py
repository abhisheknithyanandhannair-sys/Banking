from __future__ import annotations

from dataclasses import dataclass, field

from models import AnalysisRequest, Blocker, ChecklistItem, LocalArtifact, SchemePathway


@dataclass
class CountryAdapterResult:
    score_adjustment: int = 0
    drivers: list[str] = field(default_factory=list)
    blockers: list[Blocker] = field(default_factory=list)
    mitigants: list[str] = field(default_factory=list)
    document_pack: list[ChecklistItem] = field(default_factory=list)
    scheme_pathways: list[SchemePathway] = field(default_factory=list)
    local_artifacts: list[LocalArtifact] = field(default_factory=list)
    evidence_expectations: list[str] = field(default_factory=list)


def analyze_country_context(data: AnalysisRequest, ratios: dict[str, float], cashflow: dict[str, float | list]) -> CountryAdapterResult:
    if data.country == "ireland":
        return _ireland_adapter(data)
    if data.country == "spain":
        return _spain_adapter(data, ratios)
    if data.country == "france":
        return _france_adapter(data)
    if data.country == "netherlands":
        return _netherlands_adapter(data)
    return _germany_adapter(data, cashflow)


def _ireland_adapter(data: AnalysisRequest) -> CountryAdapterResult:
    context = data.country_context.ireland
    result = CountryAdapterResult(
        scheme_pathways=[
            SchemePathway(
                name="SBCI-backed bank route",
                channel="Eligibility first, then lender application",
                fit_reason="Useful when the business wants a bank-routed scheme pathway with public support attached to the credit story.",
                next_step="Confirm eligibility and align the pack with the participating lender's underwriting memo.",
            ),
            SchemePathway(
                name="Microfinance Ireland route",
                channel="Direct microfinance pathway",
                fit_reason="Best suited to smaller requests or cases where the business needs a lower-ticket funding route with a tighter support process.",
                next_step="Prepare owner background, use-of-funds narrative, and recent bank conduct before submission.",
            ),
        ],
        document_pack=[
            ChecklistItem(item="CCR report or lender CCR pull confirmation", reason="Shows factual Irish credit events where relevant to the application."),
            ChecklistItem(item="CRO company extract", reason="Supports legal identity and filing status checks."),
        ],
        local_artifacts=[
            LocalArtifact(
                artifact="CCR report",
                what_it_means="A factual Central Credit Register view of credit facilities and events, typically relevant once exposure reaches the €2,000 reporting threshold.",
                what_it_does_not_mean="It does not produce a lender score or automatic credit decision on its own.",
            )
        ],
        evidence_expectations=[
            "In Ireland, the CCR report is factual conduct evidence and not a score.",
            "If arrears or restructures exist, expect a short remediation narrative and recent clean conduct evidence.",
        ],
    )

    if data.facility.requested_amount >= 2000:
        result.drivers.append("Requested exposure is above the Irish CCR reporting threshold, so lenders will expect the factual registry picture to reconcile cleanly.")

    if context.ccr_arrears:
        result.score_adjustment -= 14
        result.blockers.append(
            Blocker(
                title="CCR arrears present",
                severity="high",
                detail="Irish credit conduct shows arrears that will likely dominate the lender discussion until cured or fully explained.",
            )
        )
        result.mitigants.append("Provide cure evidence, recent clean bank conduct, and a clear arrears remediation note before submission.")

    if context.ccr_restructures:
        result.score_adjustment -= 6
        result.blockers.append(
            Blocker(
                title="Prior restructure needs context",
                severity="medium",
                detail="A CCR restructure flag will usually require an explanation of why it happened and why the business is now stable.",
            )
        )
        result.mitigants.append("Attach a one-page restructure timeline with performance improvements since the event.")

    if context.ccr_write_offs:
        result.score_adjustment -= 18
        result.blockers.append(
            Blocker(
                title="CCR write-off flag",
                severity="high",
                detail="Historic write-offs are a major credibility issue and usually need strong evidence of remediation or ring-fencing.",
            )
        )
        result.mitigants.append("Reduce requested size, improve collateral support, and prepare a detailed explanation of the historic write-off.")

    return result


def _spain_adapter(data: AnalysisRequest, ratios: dict[str, float]) -> CountryAdapterResult:
    context = data.country_context.spain
    secured = data.facility.collateral_value >= (data.facility.requested_amount * 0.5)
    result = CountryAdapterResult(
        scheme_pathways=[
            SchemePathway(
                name="Bank-led credit route",
                channel="Lender underwriting with CIRBE reconciliation",
                fit_reason="A clean exposure picture, maturity ladder, and coherent collateral story are central to the Spanish credit journey.",
                next_step="Prepare the CIRBE report, debt maturity schedule, and collateral support before meeting the lender.",
            )
        ],
        document_pack=[
            ChecklistItem(item="CIRBE report", reason="Lets the lender reconcile factual exposure once the >€1,000 reporting threshold is crossed."),
            ChecklistItem(item="Collateral schedule", reason="Supports collateral parsing and security coverage review."),
            ChecklistItem(item="Debt maturity ladder", reason="Shows refinancing pressure and tenor concentration clearly."),
        ],
        local_artifacts=[
            LocalArtifact(
                artifact="CIRBE report",
                what_it_means="A factual Bank of Spain exposure view that becomes relevant once reportable exposure exceeds €1,000.",
                what_it_does_not_mean="It does not assign a score by itself; lenders still interpret the exposure profile and repayment story.",
            )
        ],
        evidence_expectations=[
            "In Spain, CIRBE is factual exposure evidence and not a score.",
            "Spanish lenders will expect collateral and maturity details to line up with the registry picture.",
        ],
    )

    if context.cirbe_total_exposure > 1000:
        result.drivers.append("Reportable CIRBE exposure is already in scope, so the debt picture needs to reconcile tightly.")

    if context.cirbe_total_exposure > 1000 and not secured:
        result.score_adjustment -= 7
        result.blockers.append(
            Blocker(
                title="CIRBE-visible exposure without much collateral cover",
                severity="medium",
                detail="The lender may see meaningful exposure already in the system while the new request still looks lightly secured.",
            )
        )
        result.mitigants.append("Improve the collateral package or reduce the requested size to improve security coverage.")

    if context.requested_maturity_months < 24 and ratios["dscr_proxy"] < 1.1:
        result.score_adjustment -= 5
        result.blockers.append(
            Blocker(
                title="Short maturity intensifies debt service",
                severity="medium",
                detail="A shorter Spanish tenor pushes annual service higher at a point where coverage is already tight.",
            )
        )
        result.mitigants.append("Model a longer tenor so debt service aligns better with cash conversion and seasonality.")

    if secured:
        result.score_adjustment += 3
        result.drivers.append("Collateral coverage is available and can soften lender concerns around exposure and tenor.")

    return result


def _france_adapter(data: AnalysisRequest) -> CountryAdapterResult:
    context = data.country_context.france
    turnover = data.pl.revenue
    if turnover < 2_000_000:
        regime = "sub-€2m turnover path"
    elif turnover < 10_000_000:
        regime = "€2m-€10m turnover path"
    else:
        regime = "€10m+ turnover path"

    rating = ""
    if context.bdf_turnover_letter or context.bdf_credit_score_digit:
        rating = f"{context.bdf_turnover_letter.upper()}{context.bdf_credit_score_digit}"

    result = CountryAdapterResult(
        scheme_pathways=[
            SchemePathway(
                name="Bpifrance guarantee route",
                channel="Guarantee support alongside lender process",
                fit_reason="Helpful when a French lender needs additional comfort on collateral or risk-sharing.",
                next_step="Prepare the lender case and attach the Bpifrance guarantee narrative where the gap is primarily security or risk appetite.",
            )
        ],
        document_pack=[
            ChecklistItem(item="Banque de France correspondence or rating reference", reason="Helps frame existing French central-bank dialogue where available."),
            ChecklistItem(item=f"Turnover evidence for the {regime}", reason="Shows which turnover band the business is presenting under."),
            ChecklistItem(item="Guarantee support note", reason="Useful when asking the lender to consider a Bpifrance-backed mitigant."),
        ],
        local_artifacts=[
            LocalArtifact(
                artifact="Banque de France rating",
                what_it_means="A local rating reference combining turnover context and a credit-quality digit that can shape the lender discussion.",
                what_it_does_not_mean="It is not a guarantee of loan approval; lenders still assess current cashflow, leverage, and documentation quality.",
            )
        ],
        evidence_expectations=[
            "In France, qualitative improvements can strengthen the Banque de France dialogue even when the historical file is imperfect.",
            "French readiness conversations often blend the rating reference with fresh cashflow and documentation evidence.",
        ],
    )

    result.drivers.append(f"French case mapped to the {regime}.")
    if rating:
        result.drivers.append(f"Banque de France reference captured as {rating}.")

    if 0 < context.bdf_credit_score_digit <= 3:
        result.score_adjustment += 5
    elif context.bdf_credit_score_digit >= 6:
        result.score_adjustment -= 7
        result.blockers.append(
            Blocker(
                title="French rating signal is weak",
                severity="medium",
                detail="The Banque de France digit suggests the credit dialogue may need stronger current-year evidence and mitigants.",
            )
        )
        result.mitigants.append("Bring fresh management accounts, explain the current trading trend, and add a guarantee mitigant where relevant.")

    if context.wants_bpifrance_guarantee or data.facility.collateral_value < (data.facility.requested_amount * 0.25):
        result.mitigants.append("Use a Bpifrance guarantee discussion to offset weaker collateral support.")

    return result


def _netherlands_adapter(data: AnalysisRequest) -> CountryAdapterResult:
    context = data.country_context.netherlands
    legal_form = context.legal_form.strip().lower()
    personal_liability = legal_form in {"eenmanszaak", "vof", "maatschap"}
    bkr_relevant = personal_liability

    result = CountryAdapterResult(
        scheme_pathways=[
            SchemePathway(
                name="BMKB route via financier",
                channel="Bank or financier-led guarantee pathway",
                fit_reason="Works well when the Dutch case is basically financeable but short on collateral comfort.",
                next_step="Frame the facility through the lender first and position BMKB as the security mitigant.",
            ),
            SchemePathway(
                name="GO route via financier",
                channel="Lender-led larger guarantee structure",
                fit_reason="Useful where the financing need is larger and the bank wants a more formal risk-sharing path.",
                next_step="Prepare a lender pack with cashflow case, structure, and guarantee rationale before the financier discussion.",
            ),
        ],
        document_pack=[
            ChecklistItem(item="KVK extract", reason="Supports Dutch legal-form and registration checks."),
            ChecklistItem(item="BKR overview", reason="Relevant when the legal form brings personal liability into the credit view.", required=bkr_relevant),
            ChecklistItem(item="RVO/BMKB or GO support note", reason="Explains why a guarantee pathway is being used."),
        ],
        local_artifacts=[
            LocalArtifact(
                artifact="BKR credit overview",
                what_it_means="A personal credit overview that becomes relevant where the Dutch legal form exposes the owner to personal liability.",
                what_it_does_not_mean="It is not the same thing as a corporate score for the company itself.",
            )
        ],
        evidence_expectations=[
            "In the Netherlands, BKR relevance depends on whether the legal form creates personal liability or personal borrowing linkage.",
            "Dutch guarantee routes such as BMKB and GO typically sit inside the lender journey rather than replacing it.",
        ],
    )

    if personal_liability:
        result.drivers.append("The selected Dutch legal form points to personal liability, so personal conduct evidence can matter.")

    if bkr_relevant and context.bkr_events_present:
        result.score_adjustment -= 10
        result.blockers.append(
            Blocker(
                title="BKR issues may spill into the case",
                severity="high",
                detail="Because the legal form points to personal liability, adverse BKR events can directly affect the financing discussion.",
            )
        )
        result.mitigants.append("Clean up personal conduct where possible and route the case through a guarantee-supported lender discussion.")

    if not personal_liability:
        result.score_adjustment += 2
        result.drivers.append("The legal form limits personal-liability spillover, which improves the Dutch underwriting story.")

    return result


def _germany_adapter(data: AnalysisRequest, cashflow: dict[str, float | list]) -> CountryAdapterResult:
    context = data.country_context.germany
    result = CountryAdapterResult(
        scheme_pathways=[
            SchemePathway(
                name="Guarantee bank route",
                channel="Hausbank plus guarantee bank structure",
                fit_reason="Useful when the German case is viable but needs additional comfort on risk sharing or collateral.",
                next_step="Align the lender memo first and then attach the guarantee-bank argument to the same package.",
            ),
            SchemePathway(
                name="KfW route via Hausbank",
                channel="Bank-led public development route",
                fit_reason="Strong fit where a German lender is open to development-bank pathways alongside standard underwriting.",
                next_step="Prepare the Hausbank case with current accounts, plan figures, and the intended KfW use of funds.",
            ),
        ],
        document_pack=[
            ChecklistItem(item="Company Register extract", reason="Shows the legal entity details and current filing visibility."),
            ChecklistItem(item="Latest filed annual accounts", reason="German lenders will expect accounts visibility through the register or direct pack."),
            ChecklistItem(item="Hausbank memo and use-of-funds note", reason="Supports KfW or guarantee-bank routing."),
        ],
        local_artifacts=[
            LocalArtifact(
                artifact="Company Register extract",
                what_it_means="A factual view of German filing and accounts availability that helps confirm what is publicly on record.",
                what_it_does_not_mean="It should not be treated as supervisory credit data or as a direct score substitute.",
            )
        ],
        evidence_expectations=[
            "In Germany, do not assume access to supervisory credit data; rely on filings, lender packs, and direct bank dialogue.",
            "Register availability and current accounts visibility matter a lot in the German lender workflow.",
        ],
    )

    if not context.company_register_extract_available:
        result.score_adjustment -= 8
        result.blockers.append(
            Blocker(
                title="Company Register extract missing",
                severity="high",
                detail="The legal entity pack is incomplete because the core German register extract is not available.",
            )
        )
        result.mitigants.append("Obtain the Company Register extract before approaching the Hausbank or guarantee provider.")

    if not context.company_register_accounts_available:
        result.score_adjustment -= 7
        result.blockers.append(
            Blocker(
                title="Filed accounts not visible",
                severity="medium",
                detail="The lender may have limited comfort if register-based accounts availability is weak or outdated.",
            )
        )
        result.mitigants.append("Provide the latest annual accounts directly in the lender pack if register visibility is thin.")

    if context.wants_guarantee_bank or data.facility.collateral_value < (data.facility.requested_amount * 0.25):
        result.mitigants.append("Use a guarantee-bank structure to offset collateral gaps in the German case.")

    if context.wants_kfw_route and float(cashflow["liquidity_runway_months"]) >= 3:
        result.score_adjustment += 2
        result.drivers.append("Liquidity runway is sufficient to support a structured Hausbank plus KfW conversation.")

    return result
