from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from analysis import analyze_credit_readiness
from models import AnalysisRequest, AnalysisResponse


app = FastAPI(
    title="SME Credit Readiness API",
    version="2.0.0",
    description="Shared-core SME readiness analysis with country adapters, document checks, and what-if simulation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResponse)
def analyze(data: AnalysisRequest) -> AnalysisResponse:
    return analyze_credit_readiness(data)
