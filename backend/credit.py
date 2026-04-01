def credit_score(ratios: dict[str, float]) -> dict[str, object]:
    score = 0
    recommendations: list[str] = []

    if ratios["current_ratio"] >= 2:
        score += 18
    elif ratios["current_ratio"] >= 1.2:
        score += 12
    else:
        score += 5
        recommendations.append(
            "Improve current ratio by building cash reserves and reducing short-term liabilities."
        )

    if ratios["quick_ratio"] >= 1:
        score += 14
    elif ratios["quick_ratio"] >= 0.7:
        score += 9
    else:
        score += 4
        recommendations.append(
            "Increase quick ratio by accelerating receivables collection and lowering inventory dependence."
        )

    if ratios["debt_to_equity"] <= 1:
        score += 18
    elif ratios["debt_to_equity"] <= 2:
        score += 10
    else:
        score += 4
        recommendations.append(
            "Reduce leverage by paying down debt or adding equity capital."
        )

    if ratios["gross_margin"] >= 0.4:
        score += 15
    elif ratios["gross_margin"] >= 0.25:
        score += 10
    else:
        score += 4
        recommendations.append(
            "Increase gross margin by reviewing pricing and lowering direct costs."
        )

    if ratios["net_margin"] >= 0.15:
        score += 15
    elif ratios["net_margin"] >= 0.08:
        score += 10
    else:
        score += 4
        recommendations.append(
            "Improve net margin by controlling overhead and increasing operating efficiency."
        )

    if ratios["roa"] >= 0.08:
        score += 10
    elif ratios["roa"] >= 0.03:
        score += 6
    else:
        score += 2
        recommendations.append(
            "Raise return on assets by improving asset utilization and disposing of idle assets."
        )

    if ratios["roe"] >= 0.15:
        score += 10
    elif ratios["roe"] >= 0.08:
        score += 6
    else:
        score += 2
        recommendations.append(
            "Improve return on equity through stronger profitability and better capital allocation."
        )

    score = max(0, min(100, score))

    if score >= 80:
        rating = "A"
    elif score >= 65:
        rating = "B"
    elif score >= 50:
        rating = "C"
    else:
        rating = "D"

    if len(recommendations) < 3:
        recommendations.extend(
            [
                "Monitor working capital monthly and keep at least three months of runway planning.",
                "Benchmark margins and leverage against peers in your industry.",
                "Prepare a lender-ready monthly dashboard for faster funding decisions.",
            ]
        )

    return {
        "score": score,
        "rating": rating,
        "recommendations": recommendations[:5],
    }
