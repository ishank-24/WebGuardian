# WebGuardian — Privacy Guardian

Privacy-policy analysis module for the WebGuardian hackathon project.

This is adapted from the team's earlier RAG prototype:

**PDF/Text → Chunking → Sentence Embeddings → FAISS Retrieval → Phi-3 → Grounded JSON**

## What it does

The Privacy Guardian focuses on four categories:

- **Data collection**
- **Data sharing**
- **Tracking**
- **Data retention**

For each finding it attempts to return:

- risk level
- explanation
- evidence quote
- source chunk

It also produces an overall privacy score from 0–100.

## Architecture

```text
Privacy Policy Text
       |
       v
Clean + Chunk
       |
       v
all-MiniLM-L6-v2
       |
       v
FAISS semantic retrieval
       |
       +---- data collection
       +---- data sharing
       +---- tracking
       +---- retention
       |
       v
Phi-3-mini
       |
       v
Structured JSON
       |
       v
WebGuardian / FastAPI
```

## Setup

Python 3.10+ is recommended.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

The first run downloads the embedding model and Phi-3 model from Hugging Face.

## Run a quick test

```bash
python privacy_guardian.py
```

## Integrating with FastAPI

The team backend can import the class:

```python
from guardians.privacy_guardian import PrivacyGuardian

guardian = PrivacyGuardian()

result = guardian.analyze(policy_text)
```

Or use the convenience function:

```python
from guardians.privacy_guardian import analyze_privacy

result = analyze_privacy(policy_text)
```

Example response:

```json
{
  "score": 72,
  "risk_level": "HIGH",
  "findings": [
    {
      "category": "data_sharing",
      "risk": "MEDIUM",
      "finding": "The policy mentions sharing information with third parties.",
      "evidence": "We may share your information with advertising partners.",
      "source": "data_sharing-1"
    }
  ]
}
```

## Important hackathon notes

### 1. Evidence matters

The LLM is explicitly instructed to use only retrieved policy excerpts and return evidence. This reduces unsupported conclusions.

### 2. There is a fallback

If Phi-3 fails to load or returns invalid JSON, a small deterministic keyword-based analyzer returns a usable result instead of crashing the demo.

### 3. Keep model loading outside the API request

For FastAPI, instantiate `PrivacyGuardian()` once at application startup rather than loading the model on every request.

Bad:

```python
@app.post("/analyze")
def analyze(policy_text):
    guardian = PrivacyGuardian()
    return guardian.analyze(policy_text)
```

Better:

```python
guardian = PrivacyGuardian()

@app.post("/analyze")
def analyze(policy_text):
    return guardian.analyze(policy_text)
```

## Scope

This is a hackathon prototype, not a legal/privacy compliance auditor. The score is a heuristic intended to make privacy practices easier to understand.

## GitHub

Do **not** commit model weights, virtual environments, API keys, or secrets.

Recommended:

```text
webguardian/
├── guardians/
│   └── privacy_guardian.py
├── requirements.txt
├── README.md
└── .gitignore
```
