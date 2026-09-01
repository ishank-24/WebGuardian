"""
WebGuardian - Privacy Guardian
Adapted from the original RAG notebook:
PDF -> text -> chunks -> MiniLM embeddings -> FAISS -> Phi-3

For the hackathon this module accepts privacy-policy text directly, but it
also supports PDF files for local testing.
"""

import json
import re
from typing import Any, Dict, List, Optional

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer


DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_LLM_MODEL = "microsoft/Phi-3-mini-4k-instruct"

# Terms that help retrieve privacy-policy passages relevant to our four
# hackathon categories.
PRIVACY_QUERIES = {
    "data_collection": (
        "What personal information and user data does the company collect, "
        "including name email phone location IP address device browsing and "
        "sensitive information?"
    ),
    "data_sharing": (
        "Does the company share, sell, disclose, or transfer personal data "
        "to third parties, advertisers, affiliates, service providers, "
        "partners, or data brokers?"
    ),
    "tracking": (
        "Does the company use cookies, analytics, tracking technologies, "
        "advertising identifiers, personalized advertising, or cross-site tracking?"
    ),
    "retention": (
        "How long does the company retain personal information and what does "
        "the policy say about deletion, account deletion, or retention periods?"
    ),
}


class PrivacyGuardian:
    def __init__(
        self,
        embedding_model_name: str = DEFAULT_EMBEDDING_MODEL,
        llm_model_name: str = DEFAULT_LLM_MODEL,
        load_llm: bool = True,
    ):
        self.embedding_model_name = embedding_model_name
        self.llm_model_name = llm_model_name

        self.embedding_model = SentenceTransformer(embedding_model_name)

        self.tokenizer = None
        self.model = None
        if load_llm:
            self.tokenizer = AutoTokenizer.from_pretrained(llm_model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                llm_model_name,
                device_map="auto",
            )

    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r"\s+", " ", text or "").strip()
        return text

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> List[str]:
        """Character-based chunks, improved over the original notebook."""
        text = text.strip()
        if not text:
            return []

        chunks = []
        start = 0
        step = max(1, chunk_size - overlap)

        while start < len(text):
            chunk = text[start:start + chunk_size].strip()
            if chunk:
                chunks.append(chunk)
            start += step

        return chunks

    def build_index(self, chunks: List[str]):
        if not chunks:
            raise ValueError("No policy text was provided.")

        embeddings = self.embedding_model.encode(
            chunks,
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")

        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        return index, embeddings

    def retrieve(
        self,
        query: str,
        chunks: List[str],
        index,
        top_k: int = 3,
    ) -> List[str]:
        query_embedding = self.embedding_model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")

        top_k = min(top_k, len(chunks))
        _, indices = index.search(query_embedding, top_k)

        return [chunks[i] for i in indices[0] if i >= 0]

    def retrieve_all_categories(
        self,
        policy_text: str,
        top_k_per_category: int = 3,
    ) -> Dict[str, List[str]]:
        chunks = self.chunk_text(self.clean_text(policy_text))
        index, _ = self.build_index(chunks)

        retrieved = {}
        for category, query in PRIVACY_QUERIES.items():
            retrieved[category] = self.retrieve(
                query, chunks, index, top_k=top_k_per_category
            )
        return retrieved

    def _generate(self, prompt: str, max_new_tokens: int = 700) -> str:
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("LLM is not loaded. Initialize with load_llm=True.")

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=3500,
        ).to(self.model.device)

        outputs = self.model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=0.0,
        )

        # Decode only newly generated tokens, not the prompt.
        generated = outputs[0][inputs["input_ids"].shape[1]:]
        return self.tokenizer.decode(generated, skip_special_tokens=True).strip()

    @staticmethod
    def _extract_json(text: str) -> Optional[Dict[str, Any]]:
        """Extract a JSON object even if the model wraps it in markdown."""
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None

        candidate = match.group(0)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            return None

    @staticmethod
    def _risk_from_score(score: int) -> str:
        if score <= 25:
            return "SAFE"
        if score <= 50:
            return "LOW"
        if score <= 70:
            return "MEDIUM"
        if score <= 85:
            return "HIGH"
        return "CRITICAL"

    @staticmethod
    def _keyword_fallback(policy_text: str) -> Dict[str, Any]:
        """
        Deterministic fallback so the demo still returns a result if the LLM
        is unavailable or returns invalid JSON.
        """
        text = policy_text.lower()
        findings = []
        score = 0

        checks = [
            (
                "data_collection",
                ["location", "ip address", "browsing activity", "device information"],
                10,
                "The policy mentions collection of user/device or browsing information.",
            ),
            (
                "data_sharing",
                ["third parties", "third-party", "advertising partners", "service providers"],
                15,
                "The policy mentions sharing information with third parties or partners.",
            ),
            (
                "tracking",
                ["cookies", "tracking technologies", "analytics", "advertising id"],
                15,
                "The policy mentions cookies, analytics, or tracking technologies.",
            ),
            (
                "retention",
                ["retain", "retention", "stored for as long as", "delete your data"],
                10,
                "The policy contains information about data retention or deletion.",
            ),
        ]

        for category, terms, points, finding_text in checks:
            matched = next((t for t in terms if t in text), None)
            if matched:
                score += points
                findings.append({
                    "category": category,
                    "risk": "MEDIUM",
                    "finding": finding_text,
                    "evidence": matched,
                })

        score = min(score, 100)
        return {
            "score": score,
            "risk_level": PrivacyGuardian._risk_from_score(score),
            "findings": findings,
            "note": "Fallback rule-based analysis was used.",
        }

    def analyze(self, policy_text: str) -> Dict[str, Any]:
        policy_text = self.clean_text(policy_text)
        if len(policy_text) < 50:
            return {
                "score": 0,
                "risk_level": "SAFE",
                "findings": [],
                "note": "Insufficient privacy-policy text to analyze.",
            }

        retrieved = self.retrieve_all_categories(policy_text)

        context_parts = []
        for category, chunks in retrieved.items():
            context_parts.append(f"\n### {category.upper()}")
            for i, chunk in enumerate(chunks, 1):
                context_parts.append(f"[{category}-{i}] {chunk}")

        context = "\n".join(context_parts)

        prompt = f"""
You are WebGuardian's Privacy Guardian.

Analyze ONLY the supplied privacy-policy excerpts.
Do not use outside knowledge. Do not invent facts.
If something is not stated in the excerpts, say "Not stated".

Analyze these four categories:
1. data_collection
2. data_sharing
3. tracking
4. retention

For every finding:
- give a risk: LOW, MEDIUM, or HIGH
- explain the finding briefly
- provide a short exact evidence quote from the supplied excerpts
- include the source label such as data_sharing-2

Return ONLY valid JSON. No markdown.

Required format:
{{
  "score": 0,
  "risk_level": "SAFE",
  "findings": [
    {{
      "category": "data_collection",
      "risk": "MEDIUM",
      "finding": "Brief explanation.",
      "evidence": "Exact short quote.",
      "source": "data_collection-1"
    }}
  ]
}}

The score must be an integer from 0 to 100.
Use this interpretation:
0-25 SAFE
26-50 LOW
51-70 MEDIUM
71-85 HIGH
86-100 CRITICAL

SUPPLIED POLICY EXCERPTS:
{context}
"""

        try:
            raw = self._generate(prompt)
            result = self._extract_json(raw)

            if not result:
                return self._keyword_fallback(policy_text)

            # Normalize/validate the model response.
            score = int(result.get("score", 0))
            score = max(0, min(100, score))

            findings = result.get("findings", [])
            if not isinstance(findings, list):
                findings = []

            cleaned_findings = []
            for finding in findings:
                if not isinstance(finding, dict):
                    continue
                cleaned_findings.append({
                    "category": finding.get("category", "unknown"),
                    "risk": finding.get("risk", "MEDIUM"),
                    "finding": finding.get("finding", "Not stated"),
                    "evidence": finding.get("evidence", "Not stated"),
                    "source": finding.get("source", "unknown"),
                })

            return {
                "score": score,
                "risk_level": self._risk_from_score(score),
                "findings": cleaned_findings,
            }

        except Exception as exc:
            fallback = self._keyword_fallback(policy_text)
            fallback["error"] = str(exc)
            return fallback


def analyze_privacy(policy_text: str) -> Dict[str, Any]:
    """
    Convenience function for integration with the team's FastAPI backend.
    """
    guardian = PrivacyGuardian()
    return guardian.analyze(policy_text)


if __name__ == "__main__":
    demo_policy = """
    We collect your name, email address, IP address, device information,
    and browsing activity. We may share your information with advertising
    partners, analytics providers, and other third parties. We use cookies
    and similar tracking technologies to personalize advertisements.
    We retain personal information for as long as necessary for our business
    purposes.
    """

    guardian = PrivacyGuardian()
    result = guardian.analyze(demo_policy)
    print(json.dumps(result, indent=2))
