"""
WebGuardian - Privacy Guardian

Lightweight rule-based privacy-policy analysis.
CPU-friendly version with no FAISS, SentenceTransformer,
Transformers, or LLM dependencies.
"""

import re
from typing import Any, Dict, List


PRIVACY_CHECKS = [
    {
        "category": "data_collection",
        "terms": [
            "personal information",
            "personal data",
            "name",
            "email address",
            "email",
            "phone number",
            "phone",
            "telephone",
            "location",
            "geolocation",
            "ip address",
            "browsing activity",
            "browsing history",
            "device information",
            "device data",
            "technical information",
            "account information",
            "payment information",
            "financial information",
            "biometric information",
            "identifiers",
        ],
        "points": 8,
        "severity": "MEDIUM",
        "explanation": (
            "The policy mentions collection of personal or user information."
        ),
    },
    {
        "category": "data_sharing",
        "terms": [
            "third parties",
            "third-party",
            "advertising partners",
            "advertisers",
            "service providers",
            "business partners",
            "affiliates",
            "partners",
            "data brokers",
            "disclose",
            "share your information",
            "share personal information",
            "sell your information",
            "sell personal information",
            "sale of personal information",
        ],
        "points": 15,
        "severity": "MEDIUM",
        "explanation": (
            "The policy mentions sharing, disclosing, or selling "
            "information to other parties."
        ),
    },
    {
        "category": "tracking",
        "terms": [
            "cookies",
            "cookie",
            "tracking technologies",
            "tracking technology",
            "web beacons",
            "pixels",
            "analytics",
            "advertising id",
            "advertising identifier",
            "device identifiers",
            "personalized advertising",
            "targeted advertising",
            "cross-site tracking",
            "online tracking",
        ],
        "points": 12,
        "severity": "MEDIUM",
        "explanation": (
            "The policy mentions cookies, analytics, advertising, "
            "or tracking technologies."
        ),
    },
    {
        "category": "retention",
        "terms": [
            "retain",
            "retains",
            "retained",
            "retention",
            "retention period",
            "stored for as long as",
            "keep your information",
            "keep personal information",
            "delete your data",
            "deletion of your data",
            "data deletion",
            "account deletion",
        ],
        "points": 8,
        "severity": "LOW",
        "explanation": (
            "The policy contains information about data retention or deletion."
        ),
    },
]


class PrivacyGuardian:
    def __init__(
        self,
        embedding_model_name: str = "",
        llm_model_name: str = "",
        load_llm: bool = False,
    ):
        # Kept for compatibility with older initialization code.
        self.embedding_model_name = embedding_model_name
        self.llm_model_name = llm_model_name
        self.embedding_model = None
        self.tokenizer = None
        self.model = None

    @staticmethod
    def clean_text(text: Any) -> str:
        """
        Safely normalize input text.

        None, empty values, or non-string input will not cause
        the privacy guardian to crash.
        """
        if text is None:
            return ""

        if not isinstance(text, str):
            text = str(text)

        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _risk_from_score(score: int) -> str:
        """
        Convert numeric privacy score to API risk level.
        """
        score = max(0, min(int(score), 100))

        if score <= 25:
            return "safe"

        if score <= 50:
            return "low"

        if score <= 70:
            return "medium"

        if score <= 85:
            return "high"

        return "critical"

    @staticmethod
    def _find_matches(
        text: str,
        terms: List[str],
    ) -> List[str]:
        """
        Find privacy keywords safely.
        """
        matches: List[str] = []

        if not text:
            return matches

        for term in terms:
            if not term:
                continue

            pattern = r"\b" + re.escape(term) + r"\b"

            if re.search(pattern, text, flags=re.IGNORECASE):
                matches.append(term)

        return matches

    @staticmethod
    def _keyword_fallback(
        policy_text: str,
    ) -> Dict[str, Any]:
        """
        Basic keyword-based privacy analysis.
        """
        text = policy_text.lower()

        signals: List[Dict[str, str]] = []
        score = 0

        for check in PRIVACY_CHECKS:
            category = check["category"]
            terms = check["terms"]
            points = check["points"]
            severity = check["severity"]
            explanation = check["explanation"]

            matches = PrivacyGuardian._find_matches(
                text,
                terms,
            )

            if matches:
                score += points

                signals.append(
                    {
                        "type": category,
                        "severity": severity,
                        "explanation": explanation,
                    }
                )

        score = min(score, 100)

        return {
            "score": score,
            "risk_level": PrivacyGuardian._risk_from_score(score),
            "signals": signals,
        }

    @staticmethod
    def _analyze_sensitive_data(
        policy_text: str,
    ) -> Dict[str, Any]:
        """
        Detect potentially sensitive personal information.
        """
        text = policy_text.lower()

        sensitive_terms = [
            "health information",
            "medical information",
            "medical data",
            "health data",
            "biometric information",
            "biometric data",
            "genetic information",
            "financial information",
            "financial data",
            "credit card",
            "bank account",
            "precise location",
        ]

        matches = PrivacyGuardian._find_matches(
            text,
            sensitive_terms,
        )

        if not matches:
            return {
                "score": 0,
                "signals": [],
            }

        return {
            "score": min(len(matches) * 10, 25),
            "signals": [
                {
                    "type": "sensitive_data",
                    "severity": "HIGH",
                    "explanation": (
                        "The policy mentions collection or processing "
                        "of potentially sensitive personal information."
                    ),
                }
            ],
        }

    @staticmethod
    def _analyze_sale(
        policy_text: str,
    ) -> Dict[str, Any]:
        """
        Detect selling of personal information or data-broker activity.
        """
        text = policy_text.lower()

        sale_terms = [
            "sell your personal information",
            "sell personal information",
            "sale of personal information",
            "sell your data",
            "sell personal data",
            "data broker",
            "data brokers",
        ]

        matches = PrivacyGuardian._find_matches(
            text,
            sale_terms,
        )

        if not matches:
            return {
                "score": 0,
                "signals": [],
            }

        return {
            "score": 25,
            "signals": [
                {
                    "type": "data_sale",
                    "severity": "HIGH",
                    "explanation": (
                        "The policy mentions selling personal information "
                        "or sharing information with data brokers."
                    ),
                }
            ],
        }

    @staticmethod
    def _analyze_location(
        policy_text: str,
    ) -> Dict[str, Any]:
        """
        Detect location-related data collection.
        """
        text = policy_text.lower()

        location_terms = [
            "precise location",
            "gps location",
            "geolocation",
            "real-time location",
            "location data",
            "location information",
        ]

        matches = PrivacyGuardian._find_matches(
            text,
            location_terms,
        )

        if not matches:
            return {
                "score": 0,
                "signals": [],
            }

        return {
            "score": 10,
            "signals": [
                {
                    "type": "location_collection",
                    "severity": "MEDIUM",
                    "explanation": (
                        "The policy mentions collection or use "
                        "of location information."
                    ),
                }
            ],
        }

    def analyze(
        self,
        policy_text: Any,
    ) -> Dict[str, Any]:
        """
        Analyze privacy-policy text.

        Always returns exactly:
            score
            risk_level
            signals
        """
        policy_text = self.clean_text(policy_text)

        # Empty or missing privacy policy.
        if not policy_text:
            return {
                "score": 0,
                "risk_level": "SAFE",
                "signals": [],
            }

        # Base keyword analysis.
        result = self._keyword_fallback(
            policy_text
        )

        # Additional privacy checks.
        sensitive_result = self._analyze_sensitive_data(
            policy_text
        )

        sale_result = self._analyze_sale(
            policy_text
        )

        location_result = self._analyze_location(
            policy_text
        )

        # Combine scores.
        total_score = (
            result["score"]
            + sensitive_result["score"]
            + sale_result["score"]
            + location_result["score"]
        )

        total_score = min(max(total_score, 0), 100)

        # Combine signals.
        signals = (
            result["signals"]
            + sensitive_result["signals"]
            + sale_result["signals"]
            + location_result["signals"]
        )

        return {
            "score": total_score,
            "risk_level": self._risk_from_score(total_score),
            "signals": signals,
        }


_guardian = None


def analyze_privacy(
    policy_text: Any,
) -> Dict[str, Any]:
    """
    Public Privacy Guardian entry point.

    Safe for normal strings, empty strings, None,
    and other accidental input types.
    """
    global _guardian

    if _guardian is None:
        _guardian = PrivacyGuardian(
            load_llm=False
        )

    return _guardian.analyze(
        policy_text
    )
