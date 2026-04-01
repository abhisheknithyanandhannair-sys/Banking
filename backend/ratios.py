from models import BalanceSheet, ProfitAndLoss


def _safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def calculate_financial_ratios(pl: ProfitAndLoss, bs: BalanceSheet) -> dict[str, float]:
    gross_profit = pl.revenue - pl.cogs
    net_profit = gross_profit - pl.operating_expenses - pl.interest_expense - pl.tax_expense

    return {
        "current_ratio": _safe_divide(bs.current_assets, bs.current_liabilities),
        "quick_ratio": _safe_divide(bs.current_assets - bs.inventory, bs.current_liabilities),
        "debt_to_equity": _safe_divide(bs.total_liabilities, bs.equity),
        "gross_margin": _safe_divide(gross_profit, pl.revenue),
        "net_margin": _safe_divide(net_profit, pl.revenue),
        "roa": _safe_divide(net_profit, bs.total_assets),
        "roe": _safe_divide(net_profit, bs.equity),
    }
