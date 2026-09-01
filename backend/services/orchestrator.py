from guardians.threat import analyze_threat
from guardians.manipulation import analyze_manipulation
from guardians.privacy import analyze_privacy


def analyze_page(request):

    threat = analyze_threat(request)

    manipulation = analyze_manipulation(
        request.visible_text or ""
    )

    privacy = analyze_privacy(
        request.privacy_policy_text or request.visible_text or ""
    )

    if hasattr(threat, "model_dump"):
        threat = threat.model_dump()

    if hasattr(manipulation, "model_dump"):
        manipulation = manipulation.model_dump()

    if hasattr(privacy, "model_dump"):
        privacy = privacy.model_dump()

    threat_score = threat["score"]
    manipulation_score = manipulation["score"]
    privacy_score = privacy["score"]

    final_score = round(
        threat_score * 0.50
        + manipulation_score * 0.25
        + privacy_score * 0.25
    )

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

    if threat_score >= 60:
        explanations.append(
            "High threat pattern detected."
        )

    if manipulation_score >= 50:
        explanations.append(
            "Manipulative or deceptive patterns detected."
        )

    if privacy_score >= 50:
        explanations.append(
            "Potentially risky privacy practices detected."
        )

    if not explanations:
        explanations.append(
            "No major risks detected."
        )

    if final_score >= 70:
        recommendation = (
            "Do not enter passwords or financial credentials."
        )
    elif final_score >= 50:
        recommendation = (
            "Proceed with caution and review the detected risks."
        )
    else:
        recommendation = (
            "No major risk detected."
        )

    return {
        "spider_sense_score": final_score,
        "risk_level": risk_level,
        "threat": threat,
        "manipulation": manipulation,
        "privacy": privacy,
        "explanations": explanations,
        "recommendation": recommendation,
    }