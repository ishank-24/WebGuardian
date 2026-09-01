import re


URGENCY_PATTERNS = [
    r"\bact now\b",
    r"\bhurry\b",
    r"\blast chance\b",
    r"\bdon't wait\b",
    r"\bdo not wait\b",
    r"\boffer expires\b",
    r"\bexpires in\b",
    r"\bending soon\b",
    r"\btime is running out\b",
    r"\b\d+\s*(minutes?|hours?)\s*(left|remaining)\b",
    r"\bfinal hours?\b",
    r"\bfinal minutes?\b",
]

SCARCITY_PATTERNS = [
    r"\bonly\s+\d+\s+(left|remaining)\b",
    r"\bonly one left\b",
    r"\blimited stock\b",
    r"\blimited availability\b",
    r"\balmost sold out\b",
    r"\bselling fast\b",
    r"\blow stock\b",
    r"\b\d+\s+items?\s+left\b",
    r"\bonly\s+\d+\s+available\b",
]

CONFIRMSHAMING_PATTERNS = [
    r"\bno thanks\b.*\b(save|discount|protect|benefit)\b",
    r"\bi don't want to\b",
    r"\bi do not want to\b",
    r"\bcontinue without\b",
    r"\bno,?\s+i('m| am)\s+not interested\b",
    r"\bno,?\s+i don't want\b",
]


def find_matches(text, patterns):
    """Find suspicious phrases in webpage text."""

    matches = []

    for pattern in patterns:
        found = re.findall(pattern, text, re.IGNORECASE)

        for match in found:
            if isinstance(match, tuple):
                match = " ".join(match)

            matches.append(match)

    return list(dict.fromkeys(matches))


def analyze_manipulation(text):
    """
    Analyze webpage text for manipulative/dark patterns.

    Input:
        text: webpage text/content

    Output:
        JSON-compatible dictionary with:
        score
        risk_level
        signals
    """

    if not text:
        return {
            "score": 0,
            "risk_level": "low",
            "signals": []
        }

    text = str(text)

    urgency_matches = find_matches(
        text,
        URGENCY_PATTERNS
    )

    scarcity_matches = find_matches(
        text,
        SCARCITY_PATTERNS
    )

    confirmshaming_matches = find_matches(
        text,
        CONFIRMSHAMING_PATTERNS
    )

    signals = []

    # Fake urgency
    if urgency_matches:
        signals.append({
            "type": "urgency",
            "severity": "high",
            "explanation": (
                "The message creates pressure to act immediately."
            )
        })

    # Fake scarcity
    if scarcity_matches:
        signals.append({
            "type": "scarcity",
            "severity": "medium",
            "explanation": (
                "The message creates pressure by suggesting "
                "limited availability."
            )
        })

    # Confirmshaming
    if confirmshaming_matches:
        signals.append({
            "type": "confirmshaming",
            "severity": "high",
            "explanation": (
                "The message uses guilt or negative framing "
                "to discourage the user from declining."
            )
        })

    # Calculate score
    score = 0

    if urgency_matches:
        score += 30

    if scarcity_matches:
        score += 30

    if confirmshaming_matches:
        score += 40

    score = min(score, 100)

    # Risk level
    if score >= 86:
        risk_level = "critical"
    elif score >= 71:
        risk_level = "high"
    elif score >= 51:
        risk_level = "medium"
    elif score >= 26:
        risk_level = "low"
    else:
        risk_level = "safe"

    return {
        "score": score,
        "risk_level": risk_level,
        "signals": signals
    }