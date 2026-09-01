"""
WebGuardian - Threat Guardian

Detects:
- suspicious domains
- credential harvesting
- phishing language
- account threats
- scam language
- brand impersonation
- urgency indicators
"""

import re
from urllib.parse import urlparse

from models.schemas import AnalysisRequest


# ---------------------------------
# Detection Configuration
# ---------------------------------

SUSPICIOUS_KEYWORDS = [
    "verify",
    "verification",
    "secure",
    "login",
    "signin",
    "account",
    "confirm",
    "update",
    "authenticate",
]

URGENCY_KEYWORDS = [
    "act now",
    "immediately",
    "urgent",
    "hurry",
    "limited time",
    "expires today",
    "last chance",
    "respond immediately",
    "within 24 hours",
]

ACCOUNT_THREAT_KEYWORDS = [
    "account suspended",
    "account locked",
    "account will be disabled",
    "account will be suspended",
    "unusual activity",
    "security alert",
]

SCAM_KEYWORDS = [
    "verify your account",
    "confirm your identity",
    "avoid suspension",
    "failure to respond",
    "click here immediately",
    "claim your reward",
]

KNOWN_BRANDS = [
    "paypal",
    "google",
    "microsoft",
    "amazon",
    "apple",
    "netflix",
    "facebook",
    "instagram",
]


# ---------------------------------
# Helper Functions
# ---------------------------------

def get_domain(url: str) -> str:
    """Extract the domain from a URL."""
    try:
        parsed = urlparse(url)

        if not parsed.netloc:
            parsed = urlparse("https://" + url)

        return parsed.netloc.lower().replace("www.", "")

    except Exception:
        return ""


def contains_ip_address(domain: str) -> bool:
    """Check whether the domain is an IPv4 address."""
    pattern = r"^\d{1,3}(\.\d{1,3}){3}$"
    return bool(re.match(pattern, domain))


def detect_keyword_matches(text: str, keywords):
    """Return all matching keywords."""
    text = text.lower()

    return [
        keyword
        for keyword in keywords
        if keyword in text
    ]


def risk_from_score(score: int) -> str:
    """Convert score to lowercase risk level."""
    if score <= 25:
        return "safe"

    if score <= 50:
        return "low"

    if score <= 70:
        return "medium"

    if score <= 85:
        return "high"

    return "critical"


def add_signal(
    signals,
    signal_type,
    severity,
    explanation,
):
    """Add a signal to the result."""
    signals.append(
        {
            "type": signal_type,
            "severity": severity,
            "explanation": explanation,
        }
    )


# ---------------------------------
# Main Threat Analysis
# ---------------------------------

def analyze_threat(request: AnalysisRequest):
    """Analyze a webpage request for threat indicators."""

    score = 0
    signals = []

    url = request.url
    title = request.title
    visible_text = request.visible_text
    forms = request.forms

    domain = get_domain(url)

    page_text = (
        f"{title} {visible_text}"
    ).lower()

    suspicious_domain = False
    has_password = False
    has_urgency = False

    # ---------------------------------
    # 1. Domain Analysis
    # ---------------------------------

    if contains_ip_address(domain):
        score += 20
        suspicious_domain = True

        add_signal(
            signals,
            "ip_address_domain",
            "high",
            "The website uses an IP address instead of a normal domain name.",
        )

    hyphen_count = domain.count("-")

    if hyphen_count >= 3:
        score += 10
        suspicious_domain = True

        add_signal(
            signals,
            "excessive_hyphens",
            "medium",
            (
                f"The domain contains {hyphen_count} hyphens, "
                "which can be associated with suspicious domains."
            ),
        )

    matched_domain_keywords = detect_keyword_matches(
        domain,
        SUSPICIOUS_KEYWORDS,
    )

    if len(matched_domain_keywords) >= 2:
        score += 15
        suspicious_domain = True

        add_signal(
            signals,
            "suspicious_domain_pattern",
            "medium",
            (
                "The domain contains multiple suspicious keywords: "
                + ", ".join(matched_domain_keywords)
                + "."
            ),
        )

    # ---------------------------------
    # 2. Credential Harvesting
    # ---------------------------------

    for form in forms:
        if form.has_password:
            has_password = True
            break

    if has_password:
        score += 10

        add_signal(
            signals,
            "credential_request",
            "low",
            "The page contains a password input field.",
        )

    # ---------------------------------
    # 3. Urgency Detection
    # ---------------------------------

    urgency_matches = detect_keyword_matches(
        page_text,
        URGENCY_KEYWORDS,
    )

    if urgency_matches:
        has_urgency = True

        score += min(
            len(urgency_matches) * 5,
            15,
        )

        add_signal(
            signals,
            "urgency_language",
            "medium",
            (
                "Urgency language detected: "
                + ", ".join(urgency_matches)
                + "."
            ),
        )

    # ---------------------------------
    # 4. Account Threat Detection
    # ---------------------------------

    account_threat_matches = detect_keyword_matches(
        page_text,
        ACCOUNT_THREAT_KEYWORDS,
    )

    if account_threat_matches:
        score += 15

        add_signal(
            signals,
            "account_threat_language",
            "high",
            (
                "Account threat language detected: "
                + ", ".join(account_threat_matches)
                + "."
            ),
        )

    # ---------------------------------
    # 5. Scam Language Detection
    # ---------------------------------

    scam_matches = detect_keyword_matches(
        page_text,
        SCAM_KEYWORDS,
    )

    if scam_matches:
        score += min(
            len(scam_matches) * 5,
            15,
        )

        add_signal(
            signals,
            "scam_language",
            "medium",
            (
                "Suspicious scam language detected: "
                + ", ".join(scam_matches)
                + "."
            ),
        )

    # ---------------------------------
    # 6. Brand Impersonation
    # ---------------------------------

    for brand in KNOWN_BRANDS:
        if brand in page_text:
            if brand not in domain:
                score += 25
                suspicious_domain = True

                add_signal(
                    signals,
                    "possible_brand_impersonation",
                    "high",
                    (
                        f"The page references {brand.title()} "
                        "but the domain does not appear to belong "
                        "to that brand."
                    ),
                )

                break

    # ---------------------------------
    # 7. Combination Rules
    # ---------------------------------

    if has_password and suspicious_domain:
        score += 20

        add_signal(
            signals,
            "credential_harvesting_risk",
            "high",
            (
                "A password field appears together with "
                "suspicious domain indicators."
            ),
        )

    if (
        has_password
        and suspicious_domain
        and has_urgency
    ):
        score += 15

        add_signal(
            signals,
            "high_phishing_pattern",
            "critical",
            (
                "The page combines credential requests, "
                "suspicious domain signals, and urgency language."
            ),
        )

    # ---------------------------------
    # Final Score
    # ---------------------------------

    score = min(score, 100)

    return {
        "score": score,
        "risk_level": risk_from_score(score),
        "signals": signals,
    }