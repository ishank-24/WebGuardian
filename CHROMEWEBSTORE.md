# Chrome Web Store Listing — WebGuardian Spider-Sense

## Listing Metadata

- **Name**: WebGuardian — Spider-Sense Security Shield
- **Short Name**: WebGuardian
- **Version**: 1.0.0
- **Category**: Productivity / Security
- **Summary**: Real-time explainable phishing, dark pattern manipulation, and privacy analysis with a Solo Leveling styled Spider-Sense HUD.

## Detailed Description

WebGuardian transforms web security into an explainable, real-time protection shield inspired by the Solo Leveling System. While browsing, WebGuardian dynamically analyzes active page DOM elements, authentication forms, urgency language, psychological manipulation triggers, and privacy policies.

### Key Capabilities:
- **Spider-Sense Threat Matrix**: Real-time detection of deceptive login forms, password credential harvesting, and suspicious domain patterns.
- **Manipulation Guardian**: Identifies dark patterns, synthetic countdown timers, fake stock scarcity, and manipulative confirmshaming.
- **Privacy Policy Grounding**: Extracts and evaluates real data sharing, tracker persistence, and third-party broker clauses with exact textual citations.
- **Explainable Why Engine**: Provides clear, human-readable rationale for every flagged risk score.
- **Solo Leveling Cyberpunk HUD**: Sleek neon-purple hunter status dashboard with animated concentric circular radar gauges, real-time equalizer telemetry, and sound synthesis.

---

## Permissions Justification

| Permission | Technical Reason | Plain-English Justification |
|---|---|---|
| `tabs` | Required to read the URL and title of the active tab being evaluated. | Needed so WebGuardian can inspect the security reputation of the current website URL you are viewing. |
| `activeTab` | Temporary permission on extension click to evaluate DOM elements. | Needed to safely extract visible text, login forms, and privacy links from the active webpage on user request. |
| `scripting` | Executes the content extraction routine when analyzing target pages. | Allows the extension to parse password fields and form structures for credential safety verification. |
| `storage` | Stores user audio preferences and local analysis history. | Saves your recent security score logs and UI settings locally on your machine. |

## Host Permissions Justification

| Host Pattern | Justification |
|---|---|
| `<all_urls>` | Needed to allow users to trigger WebGuardian security scans on any domain they navigate to across the web. |

---

## Privacy & Data Use Disclosure
- **Does this extension sell user data?**: No.
- **Does this extension track browsing history?**: No. Scans are executed strictly on-demand or locally in-memory.
- **Data retention**: All scan logs remain locally stored on the client browser via `chrome.storage.local`.
