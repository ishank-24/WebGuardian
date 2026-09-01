from fastapi import FastAPI

from models.schemas import AnalysisRequest, AnalysisResponse
from services.orchestrator import analyze_page


app = FastAPI(
    title="WebGuardian API",
    description="Backend API for WebGuardian Spider-Sense analysis",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "webguardian-backend",
    }


@app.post("/analyze", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest):
    return analyze_page(request)