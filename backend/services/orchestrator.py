from models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    GuardianResult,
)

from scoring.spider_sense import (
    calculate_spider_sense,
    get_risk_level,
)


def analyze_page(request: AnalysisRequest) -> AnalysisResponse:

    # Temporary mock results.
    # These will later be replaced by the
    # Threat, Manipulation, and Privacy Guardians.

    threat = GuardianResult(
        score=0,
        signals=[]
    )

    manipulation = GuardianResult(
        score=0,
        signals=[]
    )

    privacy = GuardianResult(
        score=0,
        signals=[]
    )

    # Calculate overall Spider-Sense score
    spider_score = calculate_spider_sense(
        threat.score,
        manipulation.score,
        privacy.score,
    )

    # Convert score to risk level
    risk_level = get_risk_level(spider_score)

    # Collect explanations from all guardians
    explanations = []

    for result in [threat, manipulation, privacy]:
        for signal in result.signals:
            explanations.append(signal.explanation)

    # Generate recommendation
    if risk_level == "SAFE":
        recommendation = "This page appears relatively safe."

    elif risk_level == "LOW":
        recommendation = "Proceed with caution."

    elif risk_level == "MEDIUM":
        recommendation = "Review the warnings before continuing."

    elif risk_level == "HIGH":
        recommendation = "Avoid entering sensitive information."

    else:
        recommendation = (
            "Do not enter sensitive information or credentials."
        )

    return AnalysisResponse(
        spider_sense_score=spider_score,
        risk_level=risk_level,
        threat=threat,
        manipulation=manipulation,
        privacy=privacy,
        explanations=explanations,
        recommendation=recommendation,
    )
