from typing import List, Optional
from pydantic import BaseModel, Field


class FormInfo(BaseModel):
    type: Optional[str] = None
    has_password: bool = False
    action: Optional[str] = None


class AnalysisRequest(BaseModel):
    url: str
    title: str = ""
    visible_text: str = ""
    forms: List[FormInfo] = Field(default_factory=list)
    buttons: List[str] = Field(default_factory=list)
    has_password_input: bool = False
    privacy_policy_text: str = ""


class Signal(BaseModel):
    type: str
    severity: str
    explanation: str


class ManipulationResult(BaseModel):
    score: int
    risk_level: str
    signals: List[Signal]


class GuardianResult(BaseModel):
    score: float = 0
    risk_level: str = "safe"
    signals: List[Signal] = Field(default_factory=list)


class AnalysisResponse(BaseModel):
    spider_sense_score: float
    risk_level: str

    threat: GuardianResult
    manipulation: ManipulationResult
    privacy: GuardianResult

    explanations: List[str]
    recommendation: str
