# WebGuardian — Spider-Sense for the Internet

WebGuardian is a browser-based security and privacy analysis system designed to help users understand potential privacy risks while browsing the internet.

The project combines a **Google Chrome Extension frontend** with a **FastAPI backend** and an AI-powered **Privacy Guardian**.

WebGuardian analyzes privacy policies and identifies potentially concerning practices related to:

* Data Collection
* Data Sharing
* Tracking
* Data Retention

The system transforms complex privacy policies into structured, evidence-based privacy insights that are easier for users to understand.

> **Important:** WebGuardian is implemented as a Chrome Extension and is not deployed as a traditional website. To execute the project from the submitted GitHub repository, the evaluator must clone/download the repository, start the backend locally, and load the Chrome Extension using Chrome's **Load unpacked** feature.

---

# Table of Contents

* [Quick Start — How to Run from the GitHub Repository](#quick-start--how-to-run-from-the-github-repository)
* [Project Overview](#project-overview)
* [Working Principle](#working-principle)
* [System Architecture](#system-architecture)
* [Complete Workflow](#complete-workflow)
* [Privacy Guardian](#privacy-guardian)
* [Chrome Extension Working Mechanism](#chrome-extension-working-mechanism)
* [Backend Integration Mechanism](#backend-integration-mechanism)
* [Installation](#installation)
* [Running the Complete Application](#running-the-complete-application)
* [Project Structure](#project-structure)
* [Technology Stack](#technology-stack)
* [Fallback Mechanism](#fallback-mechanism)
* [Scope and Limitations](#scope-and-limitations)

---

# Quick Start — How to Run from the GitHub Repository

## Important: How the Submitted Repository Executes

The GitHub repository link contains the complete source code for WebGuardian.

Since WebGuardian is implemented as a **Google Chrome Extension**, opening the GitHub repository link will **not directly launch the application**.

The project must be executed locally using the following process:

```text
GitHub Repository Link
        │
        ▼
Clone / Download Repository
        │
        ▼
Install Python Dependencies
        │
        ▼
Start FastAPI Backend
        │
        ▼
Open Chrome Extensions Page
        │
        ▼
Enable Developer Mode
        │
        ▼
Load WebGuardian Extension
        │
        ▼
Open Any Website
        │
        ▼
Activate WebGuardian
        │
        ▼
Website / Privacy Analysis
```

---

## Step 1: Clone the Repository

Clone the submitted GitHub repository:

```bash
git clone https://github.com/ishank-24/WebGuardian.git
cd WebGuardian
```

Alternatively:

1. Open the submitted GitHub repository.
2. Click **Code**.
3. Select **Download ZIP**.
4. Extract the downloaded project folder.

---

## Step 2: Install Dependencies

Install the required Python packages:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## Step 3: Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

The backend will run locally at:

```text
http://127.0.0.1:8000
```

API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

> Keep the backend terminal running while using the Chrome Extension.

---

## Step 4: Load the Chrome Extension

Open Google Chrome and navigate to:

```text
chrome://extensions/
```

Enable:

```text
Developer mode
```

Click:

```text
Load unpacked
```

Select the **exact folder containing `manifest.json`**.

Example:

```text
WebGuardian/
│
├── backend/
│
├── extension/
│   ├── manifest.json   ← Select this folder
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── ...
│
├── requirements.txt
└── README.md
```

> **Important:** Select the folder containing `manifest.json`, not necessarily the entire repository.

---

## Step 5: Run WebGuardian

After successfully loading the extension:

1. Open any website in Google Chrome.
2. Click the Chrome Extensions icon.
3. Locate **WebGuardian**.
4. Pin the extension if desired.
5. Click the WebGuardian icon.
6. Start the analysis.

The Chrome Extension communicates with the locally running FastAPI backend.

---

# Project Overview

Privacy policies are often long, complex, and difficult for users to understand.

WebGuardian helps simplify privacy information by analyzing policies and identifying potentially concerning privacy practices.

The Privacy Guardian focuses on four major categories:

* **Data Collection**
* **Data Sharing**
* **Tracking**
* **Data Retention**

For each identified finding, WebGuardian attempts to provide:

* Risk level
* Explanation
* Supporting evidence
* Source chunk
* Overall privacy score

---

# Working Principle

WebGuardian uses a layered architecture consisting of:

```text
User
 │
 ▼
Google Chrome
 │
 ▼
WebGuardian Chrome Extension
 │
 ▼
FastAPI Backend
 │
 ▼
Privacy Guardian
 │
 ├── Clean Text
 ├── Chunk Text
 ├── Generate Embeddings
 ├── FAISS Retrieval
 └── AI Analysis
 │
 ▼
Structured JSON Result
 │
 ▼
Chrome Extension Dashboard
 │
 ▼
User Receives Privacy Insights
```

The system separates the user interface, backend processing, and AI analysis.

---

# System Architecture

```text
┌──────────────────────────────────────┐
│            GOOGLE CHROME             │
│                                      │
│  ┌────────────────────────────────┐  │
│  │      WEBGUARDIAN EXTENSION     │  │
│  │                                │  │
│  │ • User Interface               │  │
│  │ • Active Tab Information       │  │
│  │ • Website Interaction          │  │
│  │ • Result Display               │  │
│  └───────────────┬────────────────┘  │
└──────────────────┼───────────────────┘
                   │
                   │ HTTP API Request
                   ▼
┌──────────────────────────────────────┐
│           FASTAPI BACKEND            │
│                                      │
│ • API Endpoints                      │
│ • Request Processing                 │
│ • Analysis Coordination              │
│ • Privacy Guardian Integration       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│          PRIVACY GUARDIAN            │
│                                      │
│ 1. Clean Privacy Policy              │
│ 2. Split Text into Chunks            │
│ 3. Generate Embeddings               │
│ 4. Store/Search Using FAISS          │
│ 5. Retrieve Relevant Evidence        │
│ 6. AI-Based Risk Analysis            │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│             AI LAYER                 │
│                                      │
│ Sentence Transformers                │
│ all-MiniLM-L6-v2                     │
│                                      │
│ FAISS Vector Retrieval               │
│                                      │
│ Phi-3-mini                           │
└──────────────────────────────────────┘
```

---

# Complete Workflow

WebGuardian processes information through the following workflow:

```text
1. User Opens a Website
            │
            ▼
2. WebGuardian Chrome Extension Activated
            │
            ▼
3. Required Website / Privacy Information Collected
            │
            ▼
4. Information Sent to FastAPI Backend
            │
            ▼
5. Privacy Policy Text Cleaned
            │
            ▼
6. Policy Split into Smaller Chunks
            │
            ▼
7. Sentence Embeddings Generated
            │
            ▼
8. FAISS Vector Index Used
            │
            ▼
9. Relevant Privacy Policy Sections Retrieved
            │
            ▼
10. Phi-3 AI Analyzes Retrieved Evidence
            │
            ▼
11. Structured JSON Generated
            │
            ▼
12. Privacy Score Calculated
            │
            ▼
13. Result Returned to Chrome Extension
            │
            ▼
14. User Receives Privacy Insights
```

---

# Privacy Guardian

The Privacy Guardian is the AI-powered privacy analysis component of WebGuardian.

Its processing pipeline is:

```text
PDF / Privacy Policy Text
          │
          ▼
     Clean Text
          │
          ▼
      Chunking
          │
          ▼
Sentence Embeddings
          │
          ▼
   FAISS Retrieval
          │
          ├── Data Collection
          ├── Data Sharing
          ├── Tracking
          └── Data Retention
          │
          ▼
     Phi-3-mini
          │
          ▼
   Structured JSON
          │
          ▼
 FastAPI / WebGuardian
```

---

## Step 1: Text Cleaning

Privacy policy text may contain unnecessary formatting, repeated whitespace, and irrelevant information.

The Privacy Guardian cleans the input text before processing.

```text
Raw Privacy Policy
        │
        ▼
Text Cleaning
        │
        ▼
Processed Policy Text
```

---

## Step 2: Text Chunking

Privacy policies can be very long.

Instead of processing the entire document at once, WebGuardian divides it into smaller sections called **chunks**.

```text
Large Privacy Policy
        │
        ▼
     Chunking
        │
        ├── Chunk 1
        ├── Chunk 2
        ├── Chunk 3
        └── Chunk N
```

This improves the efficiency of retrieval and analysis.

---

## Step 3: Sentence Embeddings

Each policy chunk is converted into a numerical vector representation called an embedding.

The system uses:

```text
all-MiniLM-L6-v2
```

Embeddings allow WebGuardian to understand semantic similarity.

For example:

```text
"We collect your location."

"We gather geographical information."

        │
        ▼

Similar Meaning

        │
        ▼

Similar Vector Representations
```

---

## Step 4: FAISS Semantic Retrieval

The generated embeddings are searched using FAISS.

FAISS retrieves policy sections that are most relevant to each privacy category.

The categories are:

* Data Collection
* Data Sharing
* Tracking
* Data Retention

```text
Privacy Category
       │
       ▼
Generate Query Embedding
       │
       ▼
FAISS Similarity Search
       │
       ▼
Retrieve Relevant Policy Chunks
```

---

# Privacy Analysis Categories

## 1. Data Collection

The system identifies information that a website may collect.

Examples include:

* Name
* Email address
* Phone number
* Location
* Device information
* Browsing activity

---

## 2. Data Sharing

The system analyzes whether information may be shared with:

* Third-party companies
* Advertising networks
* Analytics providers
* Business partners

Example:

```text
"We may share your information with advertising partners."
```

---

## 3. Tracking

WebGuardian checks for tracking mechanisms such as:

* Cookies
* Tracking pixels
* Analytics services
* Advertising identifiers
* Behavioral tracking

---

## 4. Data Retention

The system analyzes how long user information may be retained.

Example:

```text
"We retain your information for as long as necessary."
```

The system can identify unclear or potentially concerning retention practices.

---

# AI Analysis

After relevant privacy policy sections are retrieved, they are passed to the AI model.

WebGuardian uses:

```text
Phi-3-mini
```

The AI model analyzes the retrieved evidence and attempts to determine:

* Whether a privacy practice exists
* The potential risk level
* An explanation of the finding
* Supporting evidence

```text
Retrieved Evidence
       │
       ▼
    Phi-3-mini
       │
       ▼
Privacy Analysis
       │
       ▼
Structured Result
```

The model is instructed to rely primarily on retrieved policy excerpts to reduce unsupported conclusions.

---

# Structured Response

The Privacy Guardian returns structured JSON.

Example:

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

This structured format allows the FastAPI backend and Chrome Extension to process results efficiently.

---

# Privacy Score Mechanism

WebGuardian produces an overall privacy score between 0 and 100.

```text
0 ───────────────────────────── 100
Higher Risk                 Lower Risk
```

The score considers factors such as:

* Amount of personal data collected
* Third-party data sharing
* Tracking practices
* Data retention policies
* Severity of identified risks

> The privacy score is heuristic and intended to help users interpret privacy practices. It is not a legal or regulatory privacy rating.

---

# Chrome Extension Working Mechanism

WebGuardian uses a Google Chrome Extension as its frontend.

The extension is responsible for:

* Providing the user interface
* Interacting with the active browser tab
* Collecting required website information
* Sending requests to the FastAPI backend
* Receiving analysis results
* Displaying privacy insights to the user

A typical extension structure is:

```text
extension/
│
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── styles.css
└── assets/
```

> The actual file structure may vary depending on the implementation.

---

## Extension Components

### `manifest.json`

Defines the Chrome Extension configuration, including:

* Extension metadata
* Permissions
* Content scripts
* Background scripts

### Popup Interface

The popup provides the primary interface when the user clicks the WebGuardian extension icon.

### Content Scripts

Content scripts interact with the currently active webpage and can collect relevant information.

### Background Scripts

Background scripts handle extension-level operations and communication where required.

---

# Backend Integration Mechanism

The Chrome Extension communicates with the FastAPI backend using HTTP requests.

```text
Chrome Extension
       │
       │ HTTP Request
       ▼
FastAPI Backend
       │
       ▼
Privacy Guardian
       │
       ▼
AI Analysis
       │
       ▼
JSON Response
       │
       ▼
Chrome Extension
       │
       ▼
Display Results
```

During local development, the backend runs at:

```text
http://127.0.0.1:8000
```

The Chrome Extension sends the required information to the backend, which processes it and returns the analysis result.

---

# FastAPI Integration

The backend can integrate the Privacy Guardian as follows:

```python
from guardians.privacy_guardian import PrivacyGuardian

guardian = PrivacyGuardian()
```

The Privacy Guardian should be initialized once during application startup.

Example:

```python
@app.post("/analyze")
def analyze(policy_text: str):
    return guardian.analyze(policy_text)
```

This allows the Chrome Extension to send policy information to the backend and receive structured analysis results.

> The actual API endpoint should match the endpoint implemented in the current backend.

---

# Efficient Model Loading

The AI model should not be loaded separately for every request.

## Incorrect

```python
@app.post("/analyze")
def analyze(policy_text):
    guardian = PrivacyGuardian()
    return guardian.analyze(policy_text)
```

This can cause:

* Slow response times
* Repeated model initialization
* Increased memory usage

## Recommended

```python
guardian = PrivacyGuardian()

@app.post("/analyze")
def analyze(policy_text):
    return guardian.analyze(policy_text)
```

The model is initialized once and reused for subsequent requests.

---

# Fallback Mechanism

AI models may fail to load or occasionally produce invalid output.

WebGuardian includes a fallback mechanism to ensure that the application remains functional.

```text
Phi-3 Analysis
      │
      ├── Success
      │      │
      │      ▼
      │   AI Result
      │
      └── Failure
             │
             ▼
      Keyword-Based Analysis
             │
             ▼
        Fallback Result
```

The fallback mechanism helps prevent application failure when:

* The AI model cannot be loaded
* System resources are limited
* Invalid JSON is generated
* AI inference encounters an error

---

# Installation

## Requirements

The project requires:

* Python 3.10+
* pip
* Google Chrome
* Git

---

## Install Dependencies

From the project root:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Verify the installation:

```bash
python -c "import fastapi, uvicorn, pydantic, pytest; print('Dependencies OK')"
```

Expected output:

```text
Dependencies OK
```

> The first execution may download AI models depending on the Privacy Guardian configuration.

---

# Running Tests

From the project root:

```bash
python -m pytest -v
```

---

# Running the Complete Application

## Terminal: Start the Backend

Open a terminal in the project directory:

```bash
cd WebGuardian/backend
python -m uvicorn main:app --reload
```

The backend should now be available at:

```text
http://127.0.0.1:8000
```

Keep the terminal running.

---

## Google Chrome: Load the Extension

Open:

```text
chrome://extensions/
```

Then follow:

```text
Enable Developer Mode
        │
        ▼
Click Load Unpacked
        │
        ▼
Select Folder Containing manifest.json
        │
        ▼
WebGuardian Extension Loaded
```

---

## Use WebGuardian

```text
Open Website
     │
     ▼
Click WebGuardian Extension
     │
     ▼
Start Analysis
     │
     ▼
Chrome Extension Sends Request
     │
     ▼
FastAPI Backend
     │
     ▼
Privacy Guardian
     │
     ▼
AI Analysis
     │
     ▼
JSON Response
     │
     ▼
Results Displayed in Extension
```

---

# Complete Repository-to-Execution Mechanism

```text
                  SUBMITTED GITHUB REPOSITORY
                            │
                            ▼
                    Clone / Download Code
                            │
                            ▼
                ┌─────────────────────────┐
                │      WebGuardian        │
                │                         │
                │  Backend                │
                │  Chrome Extension       │
                └────────────┬────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
         START BACKEND              LOAD EXTENSION
                │                         │
                ▼                         ▼
       FastAPI localhost          Google Chrome
          Port: 8000              Load Unpacked
                │                         │
                └────────────┬────────────┘
                             ▼
                      USER OPENS WEBSITE
                             │
                             ▼
                    WEBGUARDIAN ACTIVATED
                             │
                             ▼
                    EXTENSION SENDS DATA
                             │
                             ▼
                      FASTAPI BACKEND
                             │
                             ▼
                       PRIVACY GUARDIAN
                             │
                             ▼
                         AI ANALYSIS
                             │
                             ▼
                        JSON RESULT
                             │
                             ▼
                  RESULTS SHOWN TO USER
```

---

# Project Structure

The recommended project structure is:

```text
WebGuardian/
│
├── backend/
│   ├── main.py
│   │
│   ├── guardians/
│   │   └── privacy_guardian.py
│   │
│   └── ...
│
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── content.js
│   ├── styles.css
│   └── assets/
│
├── tests/
│
├── requirements.txt
├── README.md
└── .gitignore
```

> Update this structure if the actual repository uses different folder or file names.

---

# Technology Stack

## Frontend

* Google Chrome Extension
* HTML
* CSS
* JavaScript

## Backend

* Python
* FastAPI
* Uvicorn

## AI and Machine Learning

* Sentence Transformers
* all-MiniLM-L6-v2
* FAISS
* Phi-3-mini

---

# Important Hackathon Notes

## Evidence-Based Analysis

WebGuardian instructs the AI system to use retrieved privacy policy excerpts as evidence.

This helps reduce unsupported conclusions and makes findings easier to verify.

---

## Fallback Support

If the AI model fails, the fallback mechanism provides a usable analysis result instead of allowing the application to crash.

---

## Efficient Model Loading

The Privacy Guardian should be initialized once when the backend starts.

This improves:

* Performance
* Response time
* Memory efficiency

---

# GitHub and Security

Do not commit:

* API keys
* Passwords
* Secrets
* Private credentials
* Large downloaded model weights

Recommended `.gitignore` entries:

```text
__pycache__/
*.pyc
.env
models/
```

---

# Scope and Limitations

WebGuardian is a hackathon prototype designed to:

* Demonstrate AI-assisted privacy analysis
* Make privacy policies easier to understand
* Identify potentially concerning privacy practices
* Provide evidence-based findings

WebGuardian is **not**:

* A legal privacy compliance auditor
* A replacement for legal advice
* A guarantee that a website is completely safe or unsafe

The privacy score is a heuristic designed to help users interpret privacy practices.

---

# Future Improvements

Potential future improvements include:

* Automatic privacy policy discovery
* Real-time website risk analysis
* Advanced tracker detection
* Privacy policy comparison over time
* User-specific privacy preferences
* Cloud deployment
* Improved risk scoring
* Support for additional browsers
* Privacy policy change notifications

---

# WebGuardian

## Spider-Sense for the Internet

WebGuardian helps users better understand privacy practices and potential risks while browsing the internet.
