"""
STEP 3: Drop-in integration for your existing FastAPI backend.
This replaces the hand-coded credit_score() in credit.py with
the trained ML model, while keeping all your existing ratio
engine, cashflow engine, and country adapter logic intact.

HOW TO USE:
1. Copy this file into your backend/ directory as ml_scorer.py
2. In analysis/service.py, replace the call to the old scoring
   function with: from ml_scorer import MLScorer
3. See the bottom of this file for the exact lines to change.
"""

import os
import json
import pickle
import numpy as np
from pathlib import Path

# ── Model loader ─────────────────────────────────────────────────────────────

class MLScorer:
    """
    Loads the trained per-country logistic regression models and
    provides a predict() method that maps your existing AnalysisRequest
    data into the feature vector the model expects.
    """

    # Where models are stored relative to backend/
    MODEL_DIR = Path(__file__).parent / "models"
    REPORT_DIR = Path(__file__).parent / "reports"

    def __init__(self):
        self._models = {}
        self._load_all()

    def _load_all(self):
        """Load all available country models at startup."""
        for country in ["ireland", "france", "germany", "eu_combined"]:
            path = self.MODEL_DIR / f"{country}_logistic.pkl"
            if path.exists():
                with open(path, "rb") as f:
                    self._models[country] = pickle.load(f)
                print(f"[MLScorer] Loaded model: {country}")
            else:
                print(f"[MLScorer] WARNING: model not found at {path}")

    def _build_feature_vector(self, country: str, ratios: dict,
                               cashflow: dict, data) -> dict:
        """
        Convert your existing ratio engine output + AnalysisRequest
        into the flat feature dict the ML model expects.
        This maps field names from your AnalysisResponse to the
        column names used during training.
        """
        pl = data.pl
        bs = data.bs
        facility = data.facility

        # Compute revenue growth from monthly data if available
        monthly_rev = data.bank.monthly_revenue
        if any(v > 0 for v in monthly_rev):
            first_half = sum(monthly_rev[:6])
            second_half = sum(monthly_rev[6:])
            rev_growth = (second_half - first_half) / first_half if first_half > 0 else 0.0
        else:
            rev_growth = 0.0

        # Determine size band from employee count — you'll need to add
        # employee_count to your AnalysisRequest model (see notes below)
        employee_count = getattr(data, "employee_count", 10)
        if employee_count <= 9:
            size_band = "micro"
        elif employee_count <= 49:
            size_band = "small"
        else:
            size_band = "medium"

        # Sector — add sector field to AnalysisRequest (see notes)
        sector = getattr(data, "sector", "professional_services")

        # Sector bankruptcy rate lookup (from your PDFs)
        sector_bankruptcy_rates = {
            "construction": 0.09,
            "retail": 0.04,
            "professional_services": 0.02,
            "manufacturing": 0.04,
            "ict": 0.02,
            "hospitality": 0.06,
            "wholesale": 0.03,
        }

        base_features = {
            # From ratio engine (already computed in your service.py)
            "gross_margin":             ratios.get("gross_margin", 0.0),
            "ebit_margin":              ratios.get("operating_margin", 0.0),
            "net_margin":               ratios.get("net_margin", 0.0),
            "current_ratio":            ratios.get("current_ratio", 1.0),
            "debt_to_equity":           ratios.get("debt_to_equity", 1.0),
            "interest_coverage":        ratios.get("interest_coverage", 2.0),
            "dscr_proxy":               ratios.get("dscr_proxy", 1.0),
            "receivables_days":         ratios.get("dso_days", 45.0),
            # From cashflow engine
            "revenue_growth_pct":       rev_growth,
            # From AnalysisRequest — fields you need to add
            "consecutive_loss_months":  getattr(data, "consecutive_loss_months", 0),
            "existing_loan_count":      facility.outstanding_debt / 50000,  # proxy
            "sector_bankruptcy_rate":   sector_bankruptcy_rates.get(sector, 0.04),
            "business_age_years":       getattr(data, "business_age_years", 5),
            # Categorical (will be one-hot encoded)
            "sector":                   sector,
            "size_band":                size_band,
        }

        return base_features

    def _add_country_features(self, country: str, base: dict, data) -> dict:
        """Append country-specific features to the base vector."""
        ctx = data.country_context
        features = base.copy()

        if country == "ireland":
            ie = ctx.ireland
            features.update({
                "ccr_arrears":              float(ie.ccr_arrears),
                "ccr_restructures":         float(ie.ccr_restructures),
                "sbci_eligible":            float(getattr(data, "sbci_eligible", True)),
                "repayment_history_score":  float(getattr(data, "repayment_history_score", 3)),
            })

        elif country == "france":
            fr = ctx.france
            features.update({
                "fiben_score":                    float(fr.bdf_credit_score_digit or 5),
                "late_payment_flag":              float(getattr(data, "late_payment_flag", False)),
                "bpifrance_guarantee_eligible":   float(fr.wants_bpifrance_guarantee),
                "cir_eligible":                   float(getattr(data, "cir_eligible", False)),
            })

        elif country == "germany":
            de = ctx.germany
            features.update({
                "schufa_score":                 float(getattr(data, "schufa_score", 650)),
                "hausbank_relationship_years":  float(getattr(data, "hausbank_years", 3)),
                "kfw_eligible":                 float(de.wants_kfw_route),
                "company_register_ok":          float(de.company_register_extract_available),
            })

        return features

    def _align_to_model_features(self, features: dict, model_feature_cols: list) -> np.ndarray:
        """
        One-hot encode categoricals and align to the exact column order
        the model was trained on. Missing columns get 0.
        """
        row = {}

        # One-hot encode sector
        for col in model_feature_cols:
            if col.startswith("sector_"):
                sector_val = col.replace("sector_", "")
                row[col] = 1.0 if features.get("sector") == sector_val else 0.0
            elif col.startswith("size_band_"):
                size_val = col.replace("size_band_", "")
                row[col] = 1.0 if features.get("size_band") == size_val else 0.0
            elif col.startswith("country_"):
                country_val = col.replace("country_", "")
                row[col] = 1.0 if features.get("country") == country_val else 0.0
            else:
                row[col] = float(features.get(col, 0.0))

        return np.array([row[col] for col in model_feature_cols]).reshape(1, -1)

    def predict(self, country: str, ratios: dict, cashflow: dict, data) -> dict:
        """
        Main prediction method. Returns:
        {
          "score": int (0-100),
          "band": "Green" | "Amber" | "Red",
          "probabilities": {"Green": float, "Amber": float, "Red": float},
          "top_factors": [{"feature": str, "direction": str, "weight": float}],
          "model_used": str
        }
        """
        # Pick the best available model for this country
        if country in self._models:
            model_key = country
        elif "eu_combined" in self._models:
            model_key = "eu_combined"
            print(f"[MLScorer] Using EU combined model for country: {country}")
        else:
            # Fallback: return neutral score if no model loaded
            return {"score": 50, "band": "Amber", "probabilities": {},
                    "top_factors": [], "model_used": "fallback"}

        loaded = self._models[model_key]
        model = loaded["model"]
        feature_cols = loaded["feature_cols"]
        label_map = loaded["label_map"]  # {0: "Red", 1: "Amber", 2: "Green"}

        # Build feature vector
        base = self._build_feature_vector(country, ratios, cashflow, data)
        if model_key != "eu_combined":
            features = self._add_country_features(country, base, data)
        else:
            features = base
            features["country"] = country

        # Align to model's expected columns
        X = self._align_to_model_features(features, feature_cols)

        # Predict
        pred_class = int(model.predict(X)[0])
        pred_proba = model.predict_proba(X)[0]

        band = label_map[pred_class]

        # Convert to 0-100 score from probability
        # Green=2, Amber=1, Red=0 → weighted sum
        score = int(np.clip(
            pred_proba[2] * 100 * 0.95 +   # Green prob → high score
            pred_proba[1] * 100 * 0.50 +   # Amber prob → mid score
            pred_proba[0] * 100 * 0.05,    # Red prob → low score
            0, 100
        ))

        # Top contributing factors (from logistic regression coefficients)
        top_factors = self._get_top_factors(model, feature_cols, pred_class, X[0])

        return {
            "score": score,
            "band": band,
            "probabilities": {
                "Green": round(float(pred_proba[2]), 3),
                "Amber": round(float(pred_proba[1]), 3),
                "Red":   round(float(pred_proba[0]), 3),
            },
            "top_factors": top_factors,
            "model_used": f"{model_key}_logistic",
        }

    def _get_top_factors(self, model, feature_cols, pred_class, x_row, top_n=5):
        """
        Returns the top N features driving the prediction for explainability.
        EU AI Act requires this — each SME can see WHY their score is what it is.
        """
        try:
            clf = model.named_steps["clf"]
            coefs = clf.coef_[pred_class]
            contributions = coefs * x_row  # element-wise: coef × feature value

            # Get top N by absolute contribution
            top_idx = np.argsort(np.abs(contributions))[::-1][:top_n]
            factors = []
            for i in top_idx:
                factors.append({
                    "feature": feature_cols[i],
                    "direction": "positive" if contributions[i] > 0 else "negative",
                    "weight": round(float(contributions[i]), 4),
                })
            return factors
        except Exception:
            return []


# ── Integration instructions ──────────────────────────────────────────────────
"""
HOW TO WIRE THIS INTO YOUR EXISTING analysis/service.py
=======================================================

1. At the top of analysis/service.py, add:
   from ml_scorer import MLScorer
   _scorer = MLScorer()  # loads models once at startup

2. In analyze_credit_readiness(), find where _score_readiness() is called:

   BEFORE (your current code):
   baseline_score = _score_readiness(
       ratios=baseline_ratios,
       cashflow=baseline_cashflow,
       documentation=documentation,
       adapter=baseline_adapter,
   )
   baseline_band = _band_for_score(baseline_score)

   AFTER (replace with):
   ml_result = _scorer.predict(
       country=data.country,
       ratios=baseline_ratios,
       cashflow=baseline_cashflow,
       data=data,
   )
   baseline_score = ml_result["score"]
   baseline_band = ml_result["band"]
   # ml_result["top_factors"] → use for explainability in the why[] list
   # ml_result["probabilities"] → optionally expose in AnalysisResponse

3. Add to your AnalysisRequest model (models.py) — new optional fields:
   employee_count: int = Field(10, ge=0, le=10000)
   business_age_years: int = Field(5, ge=0, le=200)
   sector: str = Field("professional_services", min_length=1, max_length=50)
   consecutive_loss_months: int = Field(0, ge=0, le=24)
   repayment_history_score: int = Field(3, ge=1, le=5)   # Ireland
   fiben_score: int = Field(5, ge=1, le=8)                # France
   schufa_score: int = Field(650, ge=100, le=999)         # Germany
   hausbank_years: float = Field(3.0, ge=0)               # Germany
   sbci_eligible: bool = False                             # Ireland
   late_payment_flag: bool = False                         # France
   cir_eligible: bool = False                              # France

4. The models/ and reports/ directories should sit alongside your backend/:
   your_project/
   ├── backend/
   │   ├── main.py
   │   ├── models.py
   │   ├── ml_scorer.py   ← this file
   │   ├── models/        ← trained .pkl files from step2
   │   └── reports/       ← feature importance JSONs
   └── data/              ← CSVs from step1
"""

# ── Quick test (run standalone to verify) ────────────────────────────────────
if __name__ == "__main__":
    scorer = MLScorer()
    if scorer._models:
        print("\nModel keys loaded:", list(scorer._models.keys()))
        for k, v in scorer._models.items():
            print(f"  {k}: {len(v['feature_cols'])} features")
        print("\nMLScorer is ready. Integrate into service.py using the instructions above.")
    else:
        print("No models found. Run step2_train_models.py first.")
