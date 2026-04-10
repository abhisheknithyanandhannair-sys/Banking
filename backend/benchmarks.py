"""
benchmarks.py — Peer benchmarking for SME credit readiness.
Sector averages calibrated from:
  - Ireland SME PDF (CCR, SBCI, sector breakdown)
  - France SME PDF (FIBEN, Bpifrance, sector breakdown)
  - Germany SME PDF (SCHUFA, KfW, Mittelstand data)
  - ECB SAFE Survey aggregated data
  - Eurostat SME structural business statistics

HOW TO USE:
1. Copy this file into your backend/ directory
2. In analysis/service.py add at the top:
       from benchmarks import get_peer_benchmark
3. In analyze_credit_readiness(), after baseline_ratios is computed, add:
       benchmark = get_peer_benchmark(data.country, data.sector, baseline_ratios)
4. Add benchmark to your AnalysisResponse (see bottom of this file)
"""

from typing import Literal

# ── Sector-level benchmarks per country ──────────────────────────────────────
# Each entry has:
#   current_ratio, debt_to_equity, gross_margin, ebit_margin,
#   net_margin, interest_coverage, dscr_proxy, receivables_days
#
# Sources:
#   IE — CCR avg outstanding debt €444K, approval rate 88%, sector PDFs
#   FR — FIBEN dataset, Bpifrance SME reports, INSEE sector stats
#   DE — KfW SME Panel 2025, Bundesbank, SCHUFA reform data
#   All — ECB SAFE Survey, Eurostat SBS database

BENCHMARKS = {

    # ── IRELAND ──────────────────────────────────────────────────────────────
    "ireland": {
        "construction": {
            "current_ratio":      1.45,
            "debt_to_equity":     1.80,
            "gross_margin":       0.26,
            "ebit_margin":        0.08,
            "net_margin":         0.05,
            "interest_coverage":  3.20,
            "dscr_proxy":         1.30,
            "receivables_days":   52.0,
            "revenue_growth_pct": 0.12,   # IE PDF: construction +56% 2012-2018
        },
        "retail": {
            "current_ratio":      1.35,
            "debt_to_equity":     1.50,
            "gross_margin":       0.29,
            "ebit_margin":        0.07,
            "net_margin":         0.04,
            "interest_coverage":  3.50,
            "dscr_proxy":         1.35,
            "receivables_days":   38.0,
            "revenue_growth_pct": 0.06,
        },
        "professional_services": {
            "current_ratio":      1.60,
            "debt_to_equity":     1.10,
            "gross_margin":       0.55,
            "ebit_margin":        0.14,
            "net_margin":         0.10,
            "interest_coverage":  5.50,
            "dscr_proxy":         1.80,
            "receivables_days":   44.0,
            "revenue_growth_pct": 0.10,   # IE PDF: services +26.9%
        },
        "manufacturing": {
            "current_ratio":      1.55,
            "debt_to_equity":     1.40,
            "gross_margin":       0.35,
            "ebit_margin":        0.10,
            "net_margin":         0.07,
            "interest_coverage":  4.20,
            "dscr_proxy":         1.50,
            "receivables_days":   48.0,
            "revenue_growth_pct": 0.07,
        },
        "ict": {
            "current_ratio":      1.80,
            "debt_to_equity":     0.90,
            "gross_margin":       0.62,
            "ebit_margin":        0.16,
            "net_margin":         0.12,
            "interest_coverage":  7.00,
            "dscr_proxy":         2.10,
            "receivables_days":   40.0,
            "revenue_growth_pct": 0.18,   # IE PDF: ICT high-growth
        },
        "hospitality": {
            "current_ratio":      1.20,
            "debt_to_equity":     2.10,
            "gross_margin":       0.62,
            "ebit_margin":        0.09,
            "net_margin":         0.05,
            "interest_coverage":  2.80,
            "dscr_proxy":         1.20,
            "receivables_days":   22.0,
            "revenue_growth_pct": 0.08,   # IE PDF: Power Up Grant sector
        },
        "wholesale": {
            "current_ratio":      1.40,
            "debt_to_equity":     1.60,
            "gross_margin":       0.22,
            "ebit_margin":        0.06,
            "net_margin":         0.04,
            "interest_coverage":  3.10,
            "dscr_proxy":         1.25,
            "receivables_days":   45.0,
            "revenue_growth_pct": 0.05,
        },
    },

    # ── FRANCE ───────────────────────────────────────────────────────────────
    # FR PDF: SME value added 55.8%, employment grew +0.3% in 2024
    # Bankruptcies rising above pre-COVID; manufacturing 84% 3yr survival
    "france": {
        "construction": {
            "current_ratio":      1.35,
            "debt_to_equity":     2.00,
            "gross_margin":       0.24,
            "ebit_margin":        0.07,
            "net_margin":         0.04,
            "interest_coverage":  2.90,
            "dscr_proxy":         1.20,
            "receivables_days":   58.0,   # FR PDF: late payment issue
            "revenue_growth_pct": 0.04,
        },
        "retail": {
            "current_ratio":      1.25,
            "debt_to_equity":     1.70,
            "gross_margin":       0.27,
            "ebit_margin":        0.06,
            "net_margin":         0.03,
            "interest_coverage":  3.00,
            "dscr_proxy":         1.20,
            "receivables_days":   35.0,
            "revenue_growth_pct": 0.03,
        },
        "professional_services": {
            "current_ratio":      1.55,
            "debt_to_equity":     1.00,
            "gross_margin":       0.58,
            "ebit_margin":        0.13,
            "net_margin":         0.09,
            "interest_coverage":  5.80,
            "dscr_proxy":         1.75,
            "receivables_days":   46.0,
            "revenue_growth_pct": 0.08,   # FR PDF: fastest growing sector
        },
        "manufacturing": {
            "current_ratio":      1.50,
            "debt_to_equity":     1.30,
            "gross_margin":       0.33,
            "ebit_margin":        0.09,
            "net_margin":         0.06,
            "interest_coverage":  4.00,
            "dscr_proxy":         1.45,
            "receivables_days":   50.0,
            "revenue_growth_pct": 0.06,   # FR PDF: France 2030 reindustrialisation
        },
        "ict": {
            "current_ratio":      1.70,
            "debt_to_equity":     0.85,
            "gross_margin":       0.60,
            "ebit_margin":        0.15,
            "net_margin":         0.11,
            "interest_coverage":  6.50,
            "dscr_proxy":         2.00,
            "receivables_days":   42.0,
            "revenue_growth_pct": 0.15,   # FR PDF: fastest SME creation rate
        },
        "hospitality": {
            "current_ratio":      1.15,
            "debt_to_equity":     2.30,
            "gross_margin":       0.65,
            "ebit_margin":        0.08,
            "net_margin":         0.04,
            "interest_coverage":  2.50,
            "dscr_proxy":         1.10,
            "receivables_days":   20.0,
            "revenue_growth_pct": 0.05,
        },
        "wholesale": {
            "current_ratio":      1.30,
            "debt_to_equity":     1.80,
            "gross_margin":       0.20,
            "ebit_margin":        0.05,
            "net_margin":         0.03,
            "interest_coverage":  2.80,
            "dscr_proxy":         1.15,
            "receivables_days":   48.0,
            "revenue_growth_pct": 0.03,
        },
    },

    # ── GERMANY ──────────────────────────────────────────────────────────────
    # DE PDF: avg SME profit margin 7%, GDP contracted 2023+2024
    # Construction bankruptcies +17% in 2024
    # 96.9% of German exporters are SMEs
    "germany": {
        "construction": {
            "current_ratio":      1.40,
            "debt_to_equity":     1.90,
            "gross_margin":       0.22,
            "ebit_margin":        0.06,
            "net_margin":         0.04,
            "interest_coverage":  2.70,
            "dscr_proxy":         1.15,
            "receivables_days":   55.0,
            "revenue_growth_pct": -0.02,  # DE PDF: construction bankruptcies +17%
        },
        "retail": {
            "current_ratio":      1.30,
            "debt_to_equity":     1.60,
            "gross_margin":       0.26,
            "ebit_margin":        0.06,
            "net_margin":         0.03,
            "interest_coverage":  3.10,
            "dscr_proxy":         1.20,
            "receivables_days":   36.0,
            "revenue_growth_pct": 0.02,
        },
        "professional_services": {
            "current_ratio":      1.60,
            "debt_to_equity":     1.00,
            "gross_margin":       0.52,
            "ebit_margin":        0.12,
            "net_margin":         0.08,
            "interest_coverage":  5.20,
            "dscr_proxy":         1.70,
            "receivables_days":   44.0,
            "revenue_growth_pct": 0.06,   # DE PDF: 4.2M jobs, knowledge-intensive
        },
        "manufacturing": {
            "current_ratio":      1.55,
            "debt_to_equity":     1.20,
            "gross_margin":       0.36,
            "ebit_margin":        0.10,
            "net_margin":         0.07,   # DE PDF: avg SME margin 7%
            "interest_coverage":  4.50,
            "dscr_proxy":         1.55,
            "receivables_days":   46.0,
            "revenue_growth_pct": 0.04,   # DE PDF: Mittelstand backbone
        },
        "ict": {
            "current_ratio":      1.85,
            "debt_to_equity":     0.80,
            "gross_margin":       0.58,
            "ebit_margin":        0.14,
            "net_margin":         0.10,
            "interest_coverage":  6.80,
            "dscr_proxy":         2.05,
            "receivables_days":   40.0,
            "revenue_growth_pct": 0.14,   # DE PDF: KfW Future Fund target
        },
        "hospitality": {
            "current_ratio":      1.10,
            "debt_to_equity":     2.40,
            "gross_margin":       0.60,
            "ebit_margin":        0.07,
            "net_margin":         0.03,
            "interest_coverage":  2.30,
            "dscr_proxy":         1.05,
            "receivables_days":   18.0,
            "revenue_growth_pct": 0.03,
        },
        "wholesale": {
            "current_ratio":      1.35,
            "debt_to_equity":     1.70,
            "gross_margin":       0.18,
            "ebit_margin":        0.05,
            "net_margin":         0.03,
            "interest_coverage":  2.90,
            "dscr_proxy":         1.18,
            "receivables_days":   42.0,
            "revenue_growth_pct": 0.02,
        },
    },
}

# Fallback — used when country/sector combo not found
DEFAULT_BENCHMARK = {
    "current_ratio":      1.40,
    "debt_to_equity":     1.50,
    "gross_margin":       0.35,
    "ebit_margin":        0.09,
    "net_margin":         0.06,
    "interest_coverage":  3.50,
    "dscr_proxy":         1.35,
    "receivables_days":   45.0,
    "revenue_growth_pct": 0.05,
}

# Human-readable labels for each metric
METRIC_LABELS = {
    "current_ratio":      "Current ratio",
    "debt_to_equity":     "Debt to equity",
    "gross_margin":       "Gross margin",
    "ebit_margin":        "EBIT margin",
    "net_margin":         "Net margin",
    "interest_coverage":  "Interest coverage",
    "dscr_proxy":         "Debt service coverage",
    "receivables_days":   "Receivables days",
    "revenue_growth_pct": "Revenue growth",
}

# For these metrics, LOWER is better (opposite direction)
LOWER_IS_BETTER = {"debt_to_equity", "receivables_days"}


# ── Rating logic ─────────────────────────────────────────────────────────────

def _rate_metric(metric: str, your_value: float, peer_avg: float) -> str:
    """
    Returns 'above_average', 'average', or 'below_average'.
    Handles metrics where lower is better (debt_to_equity, receivables_days).
    Average band = within 15% of peer average.
    """
    if peer_avg == 0:
        return "average"

    ratio = your_value / peer_avg

    if metric in LOWER_IS_BETTER:
        # Lower = better, so flip the comparison
        if ratio <= 0.85:   return "above_average"
        elif ratio <= 1.15: return "average"
        else:               return "below_average"
    else:
        if ratio >= 1.15:   return "above_average"
        elif ratio >= 0.85: return "average"
        else:               return "below_average"


def _format_value(metric: str, value: float) -> str:
    """Format value for display."""
    if metric in {"gross_margin", "ebit_margin", "net_margin", "revenue_growth_pct"}:
        return f"{value * 100:.1f}%"
    elif metric == "receivables_days":
        return f"{value:.0f} days"
    else:
        return f"{value:.2f}"


# ── Main function ─────────────────────────────────────────────────────────────

def get_peer_benchmark(country: str, sector: str, ratios: dict) -> dict:
    """
    Compare an SME's ratios against sector peers in their country.

    Args:
        country: "ireland" | "france" | "germany"
        sector:  e.g. "construction", "retail", "professional_services"
        ratios:  dict from your existing run_ratio_engine() output

    Returns:
        {
          "country": str,
          "sector": str,
          "overall_peer_rating": "above_average" | "average" | "below_average",
          "above_average_count": int,
          "average_count": int,
          "below_average_count": int,
          "metrics": [
            {
              "key": str,
              "label": str,
              "your_value": float,
              "your_value_formatted": str,
              "peer_average": float,
              "peer_average_formatted": str,
              "rating": "above_average" | "average" | "below_average",
              "gap_pct": float   (how far above/below peer avg, as %)
            },
            ...
          ]
        }
    """
    # Get benchmark for this country+sector
    country_benchmarks = BENCHMARKS.get(country.lower(), {})
    peer = country_benchmarks.get(sector.lower(), DEFAULT_BENCHMARK)

    # Map ratio engine keys to benchmark keys
    ratio_key_map = {
        "current_ratio":     "current_ratio",
        "debt_to_equity":    "debt_to_equity",
        "gross_margin":      "gross_margin",
        "operating_margin":  "ebit_margin",      # your engine calls it operating_margin
        "net_margin":        "net_margin",
        "interest_coverage": "interest_coverage",
        "dscr_proxy":        "dscr_proxy",
        "dso_days":          "receivables_days",  # your engine calls it dso_days
    }

    metrics = []
    ratings = []

    for ratio_key, bench_key in ratio_key_map.items():
        your_value = ratios.get(ratio_key)
        peer_avg = peer.get(bench_key)

        if your_value is None or peer_avg is None:
            continue

        rating = _rate_metric(bench_key, your_value, peer_avg)
        ratings.append(rating)

        gap_pct = ((your_value - peer_avg) / peer_avg * 100) if peer_avg != 0 else 0.0
        # Flip gap direction for lower-is-better metrics
        if bench_key in LOWER_IS_BETTER:
            gap_pct = -gap_pct

        metrics.append({
            "key":                    bench_key,
            "label":                  METRIC_LABELS.get(bench_key, bench_key),
            "your_value":             round(float(your_value), 4),
            "your_value_formatted":   _format_value(bench_key, your_value),
            "peer_average":           round(float(peer_avg), 4),
            "peer_average_formatted": _format_value(bench_key, peer_avg),
            "rating":                 rating,
            "gap_pct":                round(gap_pct, 1),
        })

    # Overall rating — majority wins
    above = ratings.count("above_average")
    average = ratings.count("average")
    below = ratings.count("below_average")

    if above >= below and above >= average:
        overall = "above_average"
    elif below > above and below >= average:
        overall = "below_average"
    else:
        overall = "average"

    return {
        "country":              country,
        "sector":               sector,
        "overall_peer_rating":  overall,
        "above_average_count":  above,
        "average_count":        average,
        "below_average_count":  below,
        "metrics":              metrics,
    }


# ── Integration instructions ──────────────────────────────────────────────────
"""
CHANGES TO MAKE IN analysis/service.py
=======================================

1. Add import at the top:
   from benchmarks import get_peer_benchmark

2. In analyze_credit_readiness(), after baseline_ratios is computed, add:
   benchmark = get_peer_benchmark(
       country=data.country,
       sector=getattr(data, "sector", "professional_services"),
       ratios=baseline_ratios,
   )

3. Add to your AnalysisResponse return:
   peer_benchmark=benchmark,

CHANGES TO MAKE IN models.py
==============================
Add PeerMetric and PeerBenchmark response models:

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

Then add to AnalysisResponse:
    peer_benchmark: PeerBenchmark
"""


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Simulate ratio engine output for an Irish construction SME
    sample_ratios = {
        "current_ratio":    1.20,
        "debt_to_equity":   2.10,
        "gross_margin":     0.24,
        "operating_margin": 0.06,
        "net_margin":       0.03,
        "interest_coverage": 2.50,
        "dscr_proxy":       1.10,
        "dso_days":         62.0,
    }

    result = get_peer_benchmark("ireland", "construction", sample_ratios)

    print(f"\nPeer Benchmark — {result['sector'].title()} in {result['country'].title()}")
    print(f"Overall: {result['overall_peer_rating'].replace('_', ' ').title()}")
    print(f"Above avg: {result['above_average_count']} | "
          f"Average: {result['average_count']} | "
          f"Below avg: {result['below_average_count']}\n")

    for m in result["metrics"]:
        symbol = "+" if m["rating"] == "above_average" else ("=" if m["rating"] == "average" else "-")
        print(f"  [{symbol}] {m['label']:<25} "
              f"You: {m['your_value_formatted']:<10} "
              f"Peers: {m['peer_average_formatted']:<10} "
              f"Gap: {m['gap_pct']:+.1f}%")
