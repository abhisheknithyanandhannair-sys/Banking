import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from analysis import analyze_credit_readiness
from models import AgentRequest, AgentRequestReceipt, AnalysisRequest, AnalysisResponse


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


@app.post("/agent-request", response_model=AgentRequestReceipt)
def capture_agent_request(data: AgentRequest) -> AgentRequestReceipt:
    request_id = str(uuid4())
    project_root = Path(__file__).resolve().parents[1]
    log_dir = project_root / "local-run-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "agent-requests.jsonl"
    payload = {
        "request_id": request_id,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        **data.model_dump(),
    }
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")

    return AgentRequestReceipt(
        request_id=request_id,
        status="received",
        message="Your request has been captured. Our team can now follow up on the funding opportunity.",
    )
