def calculate_spider_sense(
    threat_score: float,
    manipulation_score: float,
    privacy_score: float,
) -> float:

    score = (
        threat_score * 0.50
        + manipulation_score * 0.25
        + privacy_score * 0.25
    )

    return round(max(0, min(100, score)), 1)


def get_risk_level(score: float) -> str:

    if score <= 25:
        return "SAFE"

    elif score <= 50:
        return "LOW"

    elif score <= 70:
        return "MEDIUM"

    elif score <= 85:
        return "HIGH"

    else:
        return "CRITICAL"
