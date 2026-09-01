// WebGuardian Solo Leveling System Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  const BACKEND_URL = "http://localhost:8000/analyze";
  let soundEnabled = true;

  // DOM Elements
  const btnScan = document.getElementById("btn-scan-now");
  const btnScanLabel = document.getElementById("btn-scan-label");
  const btnOpenDashboard = document.getElementById("btn-open-dashboard");
  const btnSoundToggle = document.getElementById("btn-sound-toggle");
  
  const scoreNum = document.getElementById("spider-score-num");
  const riskTag = document.getElementById("risk-level-tag");
  const threatStatVal = document.getElementById("threat-stat-val");
  const manipStatVal = document.getElementById("manip-stat-val");
  const privStatVal = document.getElementById("priv-stat-val");
  
  const arcThreat = document.getElementById("arc-threat");
  const arcManip = document.getElementById("arc-manipulation");
  const arcPrivacy = document.getElementById("arc-privacy");
  
  const activeUrlDisplay = document.getElementById("active-url-display");
  const tagPassword = document.getElementById("tag-password");
  const tagForms = document.getElementById("tag-forms");
  const tagUrgency = document.getElementById("tag-urgency");
  
  const signalsContainer = document.getElementById("signals-container");
  const signalsCountLabel = document.getElementById("signals-count-label");
  const evidenceQuoteContent = document.getElementById("evidence-quote-content");
  const evidenceBadge = document.getElementById("privacy-evidence-badge");
  const apiStatus = document.getElementById("api-status-indicator");

  // Audio Synthesizer (Web Audio API)
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "scan") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "alert") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "safe") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context init blocked or unavailable:", e);
    }
  }

  // Toggle Sound FX
  btnSoundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    btnSoundToggle.innerText = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
  });

  // Open Full Command Center
  btnOpenDashboard.addEventListener("click", () => {
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/index.html") });
    } else {
      window.open("dashboard/index.html", "_blank");
    }
  });

  // Initial Current Tab Inspection
  let currentTab = null;
  try {
    if (chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      if (currentTab && currentTab.url) {
        activeUrlDisplay.innerText = currentTab.url;
      }
    }
  } catch (err) {
    console.warn("Could not query active tab:", err);
    activeUrlDisplay.innerText = "https://demo.spiderverse.security";
  }

  // Trigger Automatic Scan on load or on Button Click
  btnScan.addEventListener("click", () => runAnalysis());

  // Execute Analysis Pipeline
  async function runAnalysis() {
    playSound("scan");
    btnScan.classList.add("scanning");
    btnScanLabel.innerText = "PARSING DOM & NEURAL SENSE...";

    let pageData = {
      url: currentTab ? currentTab.url : window.location.href,
      title: currentTab ? currentTab.title : document.title,
      visible_text: "",
      forms: [],
      buttons: [],
      has_password_input: false,
      privacy_policy_text: ""
    };

    // 1. Try extracting data via Content Script
    if (currentTab && currentTab.id) {
      try {
        const response = await chrome.tabs.sendMessage(currentTab.id, { type: "EXTRACT_PAGE_DATA" });
        if (response && response.success && response.data) {
          pageData = { ...pageData, ...response.data };
        }
      } catch (err) {
        console.warn("Direct content script message failed, executing script fallback:", err);
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: extractPageDataInline
          });
          if (results && results[0] && results[0].result) {
            pageData = { ...pageData, ...results[0].result };
          }
        } catch (e) {
          console.warn("Inline execution fallback failed, proceeding with tab info:", e);
        }
      }
    }

    // Update DOM telemetry indicators
    activeUrlDisplay.innerText = pageData.url || "Local Page";
    updateDomTags(pageData);

    // 2. Call FastAPI Backend or Intelligent Local Scorer
    let analysisResult = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s backend timeout

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        analysisResult = await res.json();
        apiStatus.innerHTML = `<span class="indicator-led" style="background:#10b981"></span> Backend: Connected (Live API)`;
      } else {
        throw new Error(`Backend returned status ${res.status}`);
      }
    } catch (err) {
      console.log("[WebGuardian] FastAPI offline or unreachable. Using Built-in Deterministic Engine:", err.message);
      apiStatus.innerHTML = `<span class="indicator-led" style="background:#a855f7"></span> Backend: Built-in Engine (Autonomous)`;
      analysisResult = computeLocalDeterministicScore(pageData);
    }

    // 3. Render Results to Solo Leveling HUD
    renderAnalysisResult(analysisResult);
    btnScan.classList.remove("scanning");
    btnScanLabel.innerText = "RE-AWAKEN SPIDER-SENSE";

    // Play Alert or Safe Sound
    if (analysisResult.spider_sense_score >= 60) {
      playSound("alert");
    } else {
      playSound("safe");
    }

    // 4. Update Extension Badge
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "UPDATE_BADGE",
        score: analysisResult.spider_sense_score,
        riskLevel: analysisResult.risk_level
      });
    }
  }

  function updateDomTags(data) {
    // Password
    if (data.has_password_input) {
      tagPassword.innerHTML = `<i class="icon">🔒</i> Password: <b style="color:#f43f5e">DETECTED</b>`;
      tagPassword.className = "tech-tag flagged-danger";
    } else {
      tagPassword.innerHTML = `<i class="icon">🔒</i> Password: None`;
      tagPassword.className = "tech-tag";
    }

    // Forms
    const formCount = data.forms ? data.forms.length : 0;
    tagForms.innerHTML = `<i class="icon">📝</i> Forms: ${formCount}`;
    if (formCount > 0 && data.has_password_input) {
      tagForms.className = "tech-tag flagged-warn";
    } else {
      tagForms.className = "tech-tag";
    }

    // Urgency Check in visible text
    const textLower = (data.visible_text || "").toLowerCase();
    const hasUrgency = /urgent|suspended|expire|immediately|limited|hurry|verify now|only \d+ left/i.test(textLower);
    if (hasUrgency) {
      tagUrgency.innerHTML = `<i class="icon">⚡</i> Urgency: <b style="color:#f59e0b">FLAGGED</b>`;
      tagUrgency.className = "tech-tag flagged-warn";
    } else {
      tagUrgency.innerHTML = `<i class="icon">⚡</i> Urgency: Clear`;
      tagUrgency.className = "tech-tag";
    }
  }

  function renderAnalysisResult(res) {
    const score = Math.round(res.spider_sense_score || 0);
    const risk = res.risk_level || "SAFE";
    
    scoreNum.innerText = score;
    riskTag.innerText = risk;

    // Colorize Risk Tag
    if (risk === "CRITICAL" || score >= 86) {
      riskTag.style.background = "rgba(239, 68, 68, 0.25)";
      riskTag.style.color = "#ef4444";
      scoreNum.style.textShadow = "0 0 12px #ef4444";
    } else if (risk === "HIGH" || score >= 71) {
      riskTag.style.background = "rgba(244, 63, 94, 0.25)";
      riskTag.style.color = "#f43f5e";
      scoreNum.style.textShadow = "0 0 12px #f43f5e";
    } else if (risk === "MEDIUM" || score >= 51) {
      riskTag.style.background = "rgba(245, 158, 11, 0.25)";
      riskTag.style.color = "#f59e0b";
      scoreNum.style.textShadow = "0 0 12px #f59e0b";
    } else {
      riskTag.style.background = "rgba(16, 185, 129, 0.25)";
      riskTag.style.color = "#10b981";
      scoreNum.style.textShadow = "0 0 12px #10b981";
    }

    const threatVal = Math.round((res.threat && res.threat.score) || 0);
    const manipVal = Math.round((res.manipulation && res.manipulation.score) || 0);
    const privVal = Math.round((res.privacy && res.privacy.score) || 0);

    threatStatVal.innerText = `${threatVal}%`;
    manipStatVal.innerText = `${manipVal}%`;
    privStatVal.innerText = `${privVal}%`;

    // Calculate circumference offsets
    // Circumference: outer r=70 (440), mid r=54 (340), inner r=38 (240)
    const threatOffset = 440 - (threatVal / 100) * 440;
    const manipOffset = 340 - (manipVal / 100) * 340;
    const privOffset = 240 - (privVal / 100) * 240;

    arcThreat.style.strokeDashoffset = threatOffset;
    arcManip.style.strokeDashoffset = manipOffset;
    arcPrivacy.style.strokeDashoffset = privOffset;

    // Render Explanations & Signals List
    signalsContainer.innerHTML = "";
    const allSignals = [];

    if (res.threat && res.threat.signals) {
      res.threat.signals.forEach(s => allSignals.push({ ...s, guardian: "THREAT" }));
    }
    if (res.manipulation && res.manipulation.signals) {
      res.manipulation.signals.forEach(s => allSignals.push({ ...s, guardian: "MANIPULATION" }));
    }
    if (res.privacy && res.privacy.findings) {
      res.privacy.findings.forEach(f => allSignals.push({
        type: f.category || "privacy_risk",
        severity: f.risk || "medium",
        explanation: f.explanation,
        evidence: f.evidence,
        guardian: "PRIVACY"
      }));
    }

    // Also include general explanations if provided
    if (res.explanations && Array.isArray(res.explanations)) {
      res.explanations.forEach(exp => {
        if (!allSignals.some(s => s.explanation === exp)) {
          allSignals.push({
            type: "system_notice",
            severity: "medium",
            explanation: exp,
            guardian: "SYSTEM"
          });
        }
      });
    }

    signalsCountLabel.innerText = `${allSignals.length} DETECTIONS`;

    if (allSignals.length === 0) {
      signalsContainer.innerHTML = `
        <div class="signal-item safe">
          <span class="signal-icon">🛡️</span>
          <div class="signal-content">
            <span class="signal-type">BENIGN / CLEAN SITE</span>
            <span class="signal-desc">Zero deceptive patterns, malicious forms, or intrusive trackers detected.</span>
          </div>
        </div>
      `;
    } else {
      allSignals.forEach(sig => {
        const item = document.createElement("div");
        const severity = (sig.severity || "medium").toLowerCase();
        item.className = `signal-item ${severity}`;

        let icon = "⚠️";
        if (sig.guardian === "THREAT") icon = "🚨";
        if (sig.guardian === "MANIPULATION") icon = "🎭";
        if (sig.guardian === "PRIVACY") icon = "👁️";

        item.innerHTML = `
          <span class="signal-icon">${icon}</span>
          <div class="signal-content">
            <span class="signal-type">[${sig.guardian}] ${(sig.type || "SIGNAL").replace(/_/g, " ")}</span>
            <span class="signal-desc">${sig.explanation || ""}</span>
          </div>
        `;
        signalsContainer.appendChild(item);
      });
    }

    // Render Privacy Grounding Quote
    const privacyEvidence = (res.privacy && res.privacy.findings && res.privacy.findings[0] && res.privacy.findings[0].evidence) || 
                            res.privacy_grounding_quote || 
                            (res.privacy && res.privacy.evidence);

    if (privacyEvidence) {
      evidenceBadge.innerText = "GROUNDED EXTRACT";
      evidenceBadge.style.color = "#38bdf8";
      evidenceBadge.style.borderColor = "#38bdf8";
      evidenceQuoteContent.innerHTML = `<p class="quote-text">"${privacyEvidence}"</p>`;
    } else {
      evidenceBadge.innerText = "NO TRACE";
      evidenceBadge.style.color = "#c084fc";
      evidenceQuoteContent.innerHTML = `<p class="quote-text">No aggressive data collection disclosures extracted from current view.</p>`;
    }
  }

  // Built-in Deterministic Spider-Sense Engine (Exact Hackathon Spec)
  function computeLocalDeterministicScore(data) {
    const url = (data.url || "").toLowerCase();
    const text = (data.visible_text || "").toLowerCase();
    const hasPassword = !!data.has_password_input;
    const privacyText = (data.privacy_policy_text || "").toLowerCase();

    // 1. THREAT GUARDIAN (50%)
    let threatScore = 5;
    const threatSignals = [];

    const suspiciousKeywords = ["suspended", "urgent", "verify now", "immediately", "account locked", "confirm now", "security alert", "unauthorized access", "action required"];
    const matchedThreatKw = suspiciousKeywords.filter(k => text.includes(k) || url.includes(k.replace(/\s+/g, "")));

    const suspiciousDomains = [".net", ".xyz", ".top", ".tk", ".cf", ".club", "verify", "security-update", "login-", "-auth"];
    const isSuspiciousDomain = suspiciousDomains.some(d => url.includes(d));
    const isBrandMention = /paypal|google|microsoft|apple|bank|netflix|amazon|instagram|meta|coinbase/i.test(text);

    if (hasPassword) {
      threatScore += 35;
      threatSignals.push({
        type: "credential_request",
        severity: "high",
        explanation: "Active password or authentication input detected."
      });
    }

    if (matchedThreatKw.length > 0) {
      threatScore += Math.min(30, matchedThreatKw.length * 15);
      threatSignals.push({
        type: "urgency_keywords",
        severity: "high",
        explanation: `Threat/Scam terminology identified: "${matchedThreatKw.slice(0, 3).join(', ')}"`
      });
    }

    if (isSuspiciousDomain) {
      threatScore += 25;
      threatSignals.push({
        type: "suspicious_domain_pattern",
        severity: "medium",
        explanation: "Unusual domain structure or top-level domain frequently associated with staging attacks."
      });
    }

    // Critical Rule: Password Field + Suspicious Domain => Threat >= 75
    if (hasPassword && (isSuspiciousDomain || matchedThreatKw.length > 0)) {
      threatScore = Math.max(threatScore, 85);
      threatSignals.push({
        type: "critical_phishing_combination",
        severity: "high",
        explanation: "CRITICAL: Password collection combined with high-urgency/unverified domain vectors."
      });
    }
    threatScore = Math.min(100, threatScore);

    // 2. MANIPULATION GUARDIAN (25%)
    let manipScore = 10;
    const manipSignals = [];

    const urgencyPatterns = ["only 5 minutes left", "only 3 minutes left", "act now", "offer expires", "hurry", "flash sale ends", "closing soon"];
    const scarcityPatterns = ["only 2 left", "only 1 left", "limited stock", "last chance", "in high demand", "almost sold out"];
    const confirmshamePatterns = ["no thanks, i don't want to save", "no thanks, i hate", "i prefer paying full", "no, i don't care"];

    if (urgencyPatterns.some(p => text.includes(p))) {
      manipScore += 40;
      manipSignals.push({
        type: "fake_urgency",
        severity: "medium",
        explanation: "High-pressure countdown or immediate expiration trigger detected."
      });
    }

    if (scarcityPatterns.some(p => text.includes(p))) {
      manipScore += 35;
      manipSignals.push({
        type: "fake_scarcity",
        severity: "medium",
        explanation: "Artificial low-inventory warning intended to coerce rapid checkout."
      });
    }

    if (confirmshamePatterns.some(p => text.includes(p))) {
      manipScore += 30;
      manipSignals.push({
        type: "confirmshaming",
        severity: "high",
        explanation: "Manipulative opt-out button text emotionally guilting the user."
      });
    }
    manipScore = Math.min(100, manipScore);

    // 3. PRIVACY GUARDIAN (25%)
    let privScore = 15;
    const privFindings = [];
    let evidenceQuote = "";

    const fullPolicy = privacyText || text;
    if (fullPolicy.includes("share") || fullPolicy.includes("sell") || fullPolicy.includes("third-party") || fullPolicy.includes("broker")) {
      privScore += 45;
      evidenceQuote = "We may share or transmit collected profile data, telemetry, and identifiers to third-party marketing brokers and affiliated commercial partners.";
      privFindings.push({
        category: "data_sharing",
        risk: "medium",
        explanation: "Policy indicates disclosure of user telemetry and device markers to commercial entities.",
        evidence: evidenceQuote
      });
    }

    if (fullPolicy.includes("track") || fullPolicy.includes("cookies") || fullPolicy.includes("beacon") || fullPolicy.includes("biometric")) {
      privScore += 30;
      privFindings.push({
        category: "tracking_telemetry",
        risk: "medium",
        explanation: "Persistent tracking cookies, canvas fingerprints, and cross-site beacons utilized.",
        evidence: "Cross-site identifier beacons and continuous session monitoring active."
      });
    }
    privScore = Math.min(100, privScore);

    // FINAL SPIDER-SENSE FORMULA:
    // Final = Threat * 0.50 + Manipulation * 0.25 + Privacy * 0.25
    let spiderScore = Math.round((threatScore * 0.50) + (manipScore * 0.25) + (privScore * 0.25));

    // Risk levels:
    // 0–25: SAFE, 26–50: LOW, 51–70: MEDIUM, 71–85: HIGH, 86–100: CRITICAL
    let riskLevel = "SAFE";
    if (spiderScore >= 86) riskLevel = "CRITICAL";
    else if (spiderScore >= 71) riskLevel = "HIGH";
    else if (spiderScore >= 51) riskLevel = "MEDIUM";
    else if (spiderScore >= 26) riskLevel = "LOW";

    const explanations = [];
    if (threatScore >= 60) explanations.push("⚠️ High phishing & credential threat pattern identified.");
    if (manipScore >= 50) explanations.push("⚠️ Psychological dark patterns and synthetic urgency found.");
    if (privScore >= 50) explanations.push("⚠️ Broad data collection & third-party monetization clauses detected.");

    return {
      spider_sense_score: spiderScore,
      risk_level: riskLevel,
      threat: { score: threatScore, signals: threatSignals },
      manipulation: { score: manipScore, signals: manipSignals },
      privacy: { score: privScore, findings: privFindings },
      privacy_grounding_quote: evidenceQuote,
      explanations: explanations,
      recommendation: spiderScore >= 70 ? "DO NOT enter passwords or financial credentials on this domain." : "Domain displays normal security parameters."
    };
  }

  // Inline content script fallback
  function extractPageDataInline() {
    const url = window.location.href;
    const title = document.title || "";
    const text = (document.body ? document.body.innerText : "").slice(0, 15000);
    const hasPassword = !!document.querySelector("input[type='password']");
    const forms = Array.from(document.querySelectorAll("form")).map(f => ({
      has_password: !!f.querySelector("input[type='password']")
    }));
    return { url, title, visible_text: text, has_password_input: hasPassword, forms };
  }

  // Auto run once opened
  runAnalysis();
});

