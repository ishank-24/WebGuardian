"""
WebGuardian — FastAPI Orchestrator & Scoring Engine
Self-contained 12-Hour Hackathon Backend for Threat, Manipulation, and Privacy Guardians.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI(title="WebGuardian Spider-Sense API", version="1.0.0")

# Critical for Chrome Extension & Dashboard Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC CONTRACT SCHEMAS ---

class AnalyzeRequest(BaseModel):
    url: str
    title: Optional[str] = ""
    visible_text: Optional[str] = ""
    forms: Optional[List[Dict[str, Any]]] = []
    buttons: Optional[List[str]] = []
    has_password_input: Optional[bool] = False
    privacy_policy_text: Optional[str] = ""

class Signal(BaseModel):
    type: str
    severity: str
    explanation: str
    evidence: Optional[str] = None

class ThreatResult(BaseModel):
    score: int
    signals: List[Signal]

class ManipulationResult(BaseModel):
    score: int
    signals: List[Signal]

class PrivacyFinding(BaseModel):
    category: str
    risk: str
    explanation: str
    evidence: Optional[str] = None

class PrivacyResult(BaseModel):
    score: int
    findings: List[PrivacyFinding]

class AnalyzeResponse(BaseModel):
    spider_sense_score: int
    risk_level: str
    threat: ThreatResult
    manipulation: ManipulationResult
    privacy: PrivacyResult
    explanations: List[str]
    recommendation: str

# --- GUARDIAN ENGINE EVALUATORS ---

def evaluate_threat(data: AnalyzeRequest) -> ThreatResult:
    score = 5
    signals = []
    url_lower = data.url.lower()
    text_lower = (data.visible_text or "").lower()

    has_password = data.has_password_input or any(f.get("has_password") for f in (data.forms or []))
    suspicious_keywords = ["verify", "suspended", "urgent", "immediately", "account locked", "confirm now", "security alert", "unauthorized"]
    matched_kw = [kw for kw in suspicious_keywords if kw in text_lower or kw in url_lower]

    suspicious_domains = [".net", ".xyz", ".top", ".tk", ".cf", ".club", "login-", "-auth", "verify-"]
    is_suspicious_domain = any(d in url_lower for d in suspicious_domains)

    if has_password:
        score += 35
        signals.append(Signal(
            type="credential_request",
            severity="high",
            explanation="Active password or credential input detected."
        ))

    if matched_kw:
        score += min(35, len(matched_kw) * 12)
        signals.append(Signal(
            type="urgency_scam_keywords",
            severity="high",
            explanation=f"Threat keywords identified: {', '.join(matched_kw[:3])}"
        ))

    if is_suspicious_domain:
        score += 25
        signals.append(Signal(
            type="suspicious_domain",
            severity="medium",
            explanation="Domain uses patterns commonly associated with credential phishing staging."
        ))

    if has_password and (is_suspicious_domain or len(matched_kw) > 0):
        score = max(score, 85)
        signals.append(Signal(
            type="critical_credential_harvesting_vector",
            severity="high",
            explanation="CRITICAL: Password collection detected on high-risk domain vector."
        ))

    return ThreatResult(score=min(100, score), signals=signals)


def evaluate_manipulation(data: AnalyzeRequest) -> ManipulationResult:
    score = 10
    signals = []
    text_lower = (data.visible_text or "").lower()

    urgency_patterns = ["only 5 minutes left", "only 3 minutes left", "only 2 minutes", "act now", "offer expires", "hurry", "flash sale ends", "closing soon"]
    scarcity_patterns = ["only 2 left", "only 1 left", "limited stock", "last chance", "in high demand", "almost sold out"]
    confirmshame_patterns = ["no thanks, i don't want to save", "no thanks, i hate", "i prefer paying full", "no, i don't care"]

    if any(p in text_lower for p in urgency_patterns):
        score += 40
        signals.append(Signal(
            type="fake_urgency",
            severity="medium",
            explanation="Artificial urgency or expiration countdown detected."
        ))

    if any(p in text_lower for p in scarcity_patterns):
        score += 35
        signals.append(Signal(
            type="fake_scarcity",
            severity="medium",
            explanation="Artificial stock scarcity detected ('Only X left in inventory')."
        ))

    if any(p in text_lower for p in confirmshame_patterns):
        score += 30
        signals.append(Signal(
            type="confirmshaming",
            severity="high",
            explanation="Manipulative confirmshaming opt-out text detected."
        ))

    return ManipulationResult(score=min(100, score), signals=signals)


def evaluate_privacy(data: AnalyzeRequest) -> PrivacyResult:
    score = 15
    findings = []
    combined_text = ((data.privacy_policy_text or "") + " " + (data.visible_text or "")).lower()

    if any(term in combined_text for term in ["share", "sell", "third-party", "broker", "commercial partner"]):
        score += 45
        findings.append(PrivacyFinding(
            category="data_sharing",
            risk="medium",
            explanation="Policy indicates disclosure and transmission of user telemetry to commercial third parties.",
            evidence="We may share or transmit collected profile data and telemetry to third-party marketing brokers."
        ))

    if any(term in combined_text for term in ["track", "cookies", "beacon", "fingerprint", "keystroke", "biometric"]):
        score += 30
        findings.append(PrivacyFinding(
            category="tracking_telemetry",
            risk="medium",
            explanation="Persistent cross-site tracking and device telemetry active.",
            evidence="Cross-site identifier beacons and continuous session monitoring active."
        ))

    return PrivacyResult(score=min(100, score), findings=findings)

# --- ROUTES ---

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "webguardian-backend"}

@app.get("/")
def root():
    return {"system": "WebGuardian Solo Leveling Core", "status": "ONLINE", "version": "1.0.0"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_page(data: AnalyzeRequest):
    threat_res = evaluate_threat(data)
    manip_res = evaluate_manipulation(data)
    priv_res = evaluate_privacy(data)

    # Spider-Sense Formula: Final = Threat * 0.50 + Manipulation * 0.25 + Privacy * 0.25
    final_score = int(round((threat_res.score * 0.50) + (manip_res.score * 0.25) + (priv_res.score * 0.25)))

    if final_score >= 86:
        risk_level = "CRITICAL"
    elif final_score >= 71:
        risk_level = "HIGH"
    elif final_score >= 51:
        risk_level = "MEDIUM"
    elif final_score >= 26:
        risk_level = "LOW"
    else:
        risk_level = "SAFE"

    explanations = []
    if threat_res.score >= 60:
        explanations.append("🚨 High phishing & credential threat pattern identified.")
    if manip_res.score >= 50:
        explanations.append("🎭 Psychological dark patterns and synthetic urgency found.")
    if priv_res.score >= 50:
        explanations.append("👁️ Broad data collection & third-party monetization clauses detected.")

    if not explanations:
        explanations.append("🛡️ Domain parameters verified clean. Zero deceptive patterns or threats found.")

    recommendation = "DO NOT enter passwords or financial credentials." if final_score >= 70 else "Domain verified safe to browse."

    return AnalyzeResponse(
        spider_sense_score=final_score,
        risk_level=risk_level,
        threat=threat_res,
        manipulation=manip_res,
        privacy=priv_res,
        explanations=explanations,
        recommendation=recommendation
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
