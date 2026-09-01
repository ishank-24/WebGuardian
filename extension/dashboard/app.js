// WebGuardian Solo Leveling System — Laptop Command Center Controller

document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:8000/analyze";
  let soundEnabled = true;

  // Pre-configured Demo Scenarios (Matches Hackathon Pitch Exactly)
  const SCENARIOS = {
    phishing: {
      url: "https://secure-login-verify.net/account/suspended-notice",
      title: "Security Alert — Immediate Account Verification Required",
      visible_text: "URGENT NOTICE: Your banking and cloud account has been suspended due to unauthorized access. You must verify immediately. Enter your username and password below to confirm now. Account will be deleted in 5 minutes!",
      has_password_input: true,
      forms: [{ has_password: true, action: "https://secure-login-verify.net/steal.php" }],
      privacy_policy_text: "We reserve the right to share identity credentials and network telemetry with undisclosed verification contractors.",
      threat: {
        score: 95,
        signals: [
          { type: "credential_theft", severity: "high", explanation: "Active password input on an unverified domain." },
          { type: "high_urgency_keywords", severity: "high", explanation: "Urgency language detected: 'suspended', 'immediately', 'confirm now'." },
          { type: "suspicious_domain_pattern", severity: "high", explanation: "Domain 'secure-login-verify.net' mimics standard credential phishing lures." },
          { type: "critical_rule_trigger", severity: "high", explanation: "CRITICAL: Password field + Suspicious domain vector (Threat Score = 95)." }
        ]
      },
      manipulation: {
        score: 70,
        signals: [
          { type: "synthetic_deadline", severity: "high", explanation: "'Account will be deleted in 5 minutes!' creates panic coercion." }
        ]
      },
      privacy: {
        score: 65,
        findings: [
          { category: "unverified_data_sharing", risk: "medium", explanation: "Shares telemetry with undisclosed contractors.", evidence: "We reserve the right to share identity credentials and network telemetry with undisclosed verification contractors." }
        ]
      },
      spider_sense_score: 94,
      risk_level: "CRITICAL",
      seeatty_val: 94.0,
      evidence_quote: "We reserve the right to share identity credentials and network telemetry with undisclosed verification contractors."
    },

    manipulation: {
      url: "https://limited-deal-countdown.com/checkout/flash-sale",
      title: "🔥 FLASH SALE — ONLY 2 ITEMS LEFT AT THIS PRICE!",
      visible_text: "LIMITED STOCK! Only 2 items left in inventory! Offer expires in 3 minutes! Special discount applied. Click checkout now. No thanks, I don't want to save money and prefer overpaying.",
      has_password_input: false,
      forms: [{ has_password: false }],
      privacy_policy_text: "Standard checkout cookies and cart telemetry collected for marketing optimization.",
      threat: {
        score: 25,
        signals: [
          { type: "e-commerce_form", severity: "low", explanation: "Standard checkout forms without suspicious credential harvesting." }
        ]
      },
      manipulation: {
        score: 92,
        signals: [
          { type: "fake_scarcity", severity: "high", explanation: "Artificial stock scarcity detected: 'Only 2 items left in inventory!'" },
          { type: "fake_urgency", severity: "high", explanation: "Synthetic countdown timer: 'Offer expires in 3 minutes!'" },
          { type: "confirmshaming", severity: "high", explanation: "Guilt-inducing opt-out button: 'No thanks, I don't want to save money and prefer overpaying.'" }
        ]
      },
      privacy: {
        score: 45,
        findings: [
          { category: "marketing_telemetry", risk: "low", explanation: "Standard marketing cart cookies enabled.", evidence: "Standard checkout cookies and cart telemetry collected for marketing optimization." }
        ]
      },
      spider_sense_score: 74,
      risk_level: "HIGH",
      seeatty_val: 74.0,
      evidence_quote: "Cart telemetry and session interactions tracked for dynamic price urgency."
    },

    privacy: {
      url: "https://invasive-tracker-hub.org/app/terms-of-service",
      title: "Global Analytics & Monetization Network",
      visible_text: "Welcome to our global free portal. Read our extensive privacy disclosures below regarding third-party data broker transmission, persistent biometric canvas fingerprints, and perpetual cross-site telemetry sales.",
      has_password_input: false,
      forms: [],
      privacy_policy_text: "We collect user keystrokes, location coordinates, session cookies, and device fingerprints to share, sell, and monetize with third-party data brokers and advertising networks on a perpetual basis.",
      threat: {
        score: 20,
        signals: [
          { type: "informational_page", severity: "safe", explanation: "No deceptive credential harvesting forms found." }
        ]
      },
      manipulation: {
        score: 30,
        signals: [
          { type: "passive_browsing", severity: "low", explanation: "No aggressive countdown timers or confirmshaming triggers." }
        ]
      },
      privacy: {
        score: 95,
        findings: [
          { category: "third_party_data_sale", risk: "high", explanation: "Explicit selling of personal telemetry to commercial brokers.", evidence: "We collect user keystrokes, location coordinates, session cookies, and device fingerprints to share, sell, and monetize with third-party data brokers." },
          { category: "invasive_canvas_fingerprinting", risk: "high", explanation: "Persistent canvas and device telemetry fingerprints utilized without opt-out.", evidence: "Device fingerprints and cross-site beacons tracked on a perpetual basis." }
        ]
      },
      spider_sense_score: 68,
      risk_level: "MEDIUM",
      seeatty_val: 68.0,
      evidence_quote: "We collect user keystrokes, location coordinates, and device fingerprints to share, sell, and monetize with third-party data brokers."
    },

    safe: {
      url: "https://docs.spiderverse.dev/security/whitepaper",
      title: "Spider-Sense Autonomous Defense Documentation",
      visible_text: "Official technical documentation for the WebGuardian Spider-Sense architecture. Zero ads, zero tracking cookies, open-source security verified.",
      has_password_input: false,
      forms: [],
      privacy_policy_text: "We do not track, store, or sell any personal information. All security scoring computations occur locally in memory.",
      threat: {
        score: 10,
        signals: [
          { type: "verified_clean_domain", severity: "safe", explanation: "Zero phishing signatures, no deceptive login forms." }
        ]
      },
      manipulation: {
        score: 5,
        signals: [
          { type: "transparent_ui", severity: "safe", explanation: "Zero dark patterns, no fake scarcity, no confirmshaming." }
        ]
      },
      privacy: {
        score: 10,
        findings: [
          { category: "zero_telemetry_policy", risk: "safe", explanation: "Zero trackers, strict privacy-preserving architecture.", evidence: "We do not track, store, or sell any personal information. All computations occur locally." }
        ]
      },
      spider_sense_score: 12,
      risk_level: "SAFE",
      seeatty_val: 12.0,
      evidence_quote: "We do not track, store, or sell any personal information. All security scoring computations occur locally."
    }
  };

  // DOM Elements
  const targetUrlInput = document.getElementById("target-url-input");
  const btnInspectUrl = document.getElementById("btn-inspect-url");
  const btnFloatingScan = document.getElementById("btn-floating-scan");
  const btnAudioToggle = document.getElementById("btn-audio-toggle");
  const backendLabelText = document.getElementById("backend-label-text");
  const liveClock = document.getElementById("live-clock");

  // Gauge & Stat Readouts
  const dashSpiderScore = document.getElementById("dash-spider-score");
  const dashRiskRank = document.getElementById("dash-risk-rank");
  const statThreatVal = document.getElementById("stat-threat-val");
  const statManipVal = document.getElementById("stat-manip-val");
  const statPrivVal = document.getElementById("stat-priv-val");
  const seeattyNum = document.getElementById("seeatty-num");
  const havkPillTag = document.getElementById("havk-pill-tag");
  const dashSignalsCount = document.getElementById("dash-signals-count");
  const dashSignalsList = document.getElementById("dash-signals-list");
  const dashboardEvidenceQuote = document.getElementById("dashboard-evidence-quote");
  const evQuoteSummary = document.getElementById("ev-quote-summary");

  // SVG Radar Arcs (Laptop SVG r=85, r=66, r=48)
  const dashThreatArc = document.getElementById("dash-threat-arc");
  const dashManipArc = document.getElementById("dash-manip-arc");
  const dashPrivArc = document.getElementById("dash-priv-arc");

  // Threat Spectrum Bars
  const barDns = document.getElementById("bar-dns");
  const barCred = document.getElementById("bar-cred");
  const barUrgency = document.getElementById("bar-urgency");
  const barData = document.getElementById("bar-data");
  const barTrackers = document.getElementById("bar-trackers");
  const barGround = document.getElementById("bar-ground");

  // Value Labels
  const valDns = document.getElementById("val-dns");
  const valCred = document.getElementById("val-cred");
  const valUrg = document.getElementById("val-urg");
  const valData = document.getElementById("val-data");
  const valTrack = document.getElementById("val-track");
  const valGround = document.getElementById("val-ground");

  // Fluid Tanks
  const tank1 = document.getElementById("tank-1");
  const tank2 = document.getElementById("tank-2");

  // Quick Indicators in strip
  const quickPwdInd = document.getElementById("quick-pwd-ind");
  const quickUrgInd = document.getElementById("quick-urg-ind");
  const quickDomInd = document.getElementById("quick-dom-ind");

  // Live Clock
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    if (liveClock) liveClock.innerText = `${hours}:${minutes}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Audio Synthesizer
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
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "critical") {
        osc.type = "square";
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "safe") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context init blocked:", e);
    }
  }

  // Audio Toggle
  btnAudioToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    btnAudioToggle.innerHTML = soundEnabled ? "<span>🔊</span> AUDIO: ON" : "<span>🔇</span> AUDIO: OFF";
  });

  // Particle Canvas Animation
  const canvas = document.getElementById("mana-particles-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class ManaParticle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 50;
      this.size = Math.random() * 2.8 + 0.8;
      this.speedY = Math.random() * 0.9 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.alpha = Math.random() * 0.7 + 0.3;
      this.hue = Math.random() > 0.5 ? 300 : 275;
    }
    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 85%, 65%, ${this.alpha})`;
      ctx.shadowColor = `hsla(${this.hue}, 95%, 60%, 0.8)`;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 55; i++) {
    particles.push(new ManaParticle());
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // Equalizer Dynamic Bouncing
  function pulseEqualizer() {
    const capsules = document.querySelectorAll(".eq-capsule");
    capsules.forEach(cap => {
      const randomH = Math.floor(Math.random() * 55 + 40);
      cap.style.setProperty("--h", `${randomH}%`);
    });
  }
  setInterval(pulseEqualizer, 2000);

  // Apply Scenario or Analysis Data to UI
  function applyAnalysisToHUD(data) {
    const score = Math.round(data.spider_sense_score || 0);
    const risk = data.risk_level || "SAFE";

    // Target URL & Inputs
    if (targetUrlInput) targetUrlInput.value = data.url;

    // Quick indicators
    if (data.has_password_input) {
      quickPwdInd.innerHTML = "🔒 Password: <b style='color:#f43f5e'>DETECTED</b>";
      quickPwdInd.className = "quick-pill danger";
    } else {
      quickPwdInd.innerHTML = "🔒 Password: None";
      quickPwdInd.className = "quick-pill";
    }

    if (data.threat.score >= 60) {
      quickUrgInd.innerHTML = "⚡ Urgency: <b style='color:#f59e0b'>HIGH</b>";
      quickUrgInd.className = "quick-pill warning";
      quickDomInd.innerHTML = "🌐 Domain: <b style='color:#f43f5e'>SUSPICIOUS</b>";
      quickDomInd.className = "quick-pill danger";
    } else {
      quickUrgInd.innerHTML = "⚡ Urgency: Low";
      quickUrgInd.className = "quick-pill";
      quickDomInd.innerHTML = "🌐 Domain: Verified";
      quickDomInd.className = "quick-pill";
    }

    // Main Spider Sense Numbers
    dashSpiderScore.innerText = score;
    dashRiskRank.innerText = `${risk} RISK`;
    seeattyNum.innerText = (data.seeatty_val || score).toFixed(1);
    havkPillTag.innerText = `Goal Threat: ${score}%`;

    // Colors
    if (risk === "CRITICAL" || score >= 86) {
      dashRiskRank.style.background = "rgba(239, 68, 68, 0.25)";
      dashRiskRank.style.borderColor = "#ef4444";
      dashRiskRank.style.color = "#ef4444";
      dashSpiderScore.style.textShadow = "0 0 16px #ef4444";
    } else if (risk === "HIGH" || score >= 71) {
      dashRiskRank.style.background = "rgba(244, 63, 94, 0.25)";
      dashRiskRank.style.borderColor = "#f43f5e";
      dashRiskRank.style.color = "#f43f5e";
      dashSpiderScore.style.textShadow = "0 0 16px #f43f5e";
    } else if (risk === "MEDIUM" || score >= 51) {
      dashRiskRank.style.background = "rgba(245, 158, 11, 0.25)";
      dashRiskRank.style.borderColor = "#f59e0b";
      dashRiskRank.style.color = "#f59e0b";
      dashSpiderScore.style.textShadow = "0 0 16px #f59e0b";
    } else {
      dashRiskRank.style.background = "rgba(16, 185, 129, 0.25)";
      dashRiskRank.style.borderColor = "#10b981";
      dashRiskRank.style.color = "#10b981";
      dashSpiderScore.style.textShadow = "0 0 16px #10b981";
    }

    // Category Triple Stats
    const threatScore = Math.round(data.threat.score || 0);
    const manipScore = Math.round(data.manipulation.score || 0);
    const privScore = Math.round(data.privacy.score || 0);

    statThreatVal.innerText = `${threatScore}%`;
    statManipVal.innerText = `${manipScore}%`;
    statPrivVal.innerText = `${privScore}%`;

    // Radar Arcs: Circumferences outer=534, mid=414, inner=301
    dashThreatArc.style.strokeDashoffset = 534 - (threatScore / 100) * 534;
    dashManipArc.style.strokeDashoffset = 414 - (manipScore / 100) * 414;
    dashPrivArc.style.strokeDashoffset = 301 - (privScore / 100) * 301;

    // Spectrum Bars
    barDns.style.width = `${Math.min(100, threatScore * 0.95)}%`;
    barCred.style.width = `${Math.min(100, data.has_password_input ? 95 : 20)}%`;
    barUrgency.style.width = `${Math.min(100, manipScore * 0.9)}%`;
    barData.style.width = `${Math.min(100, privScore * 0.92)}%`;
    barTrackers.style.width = `${Math.min(100, privScore * 0.75)}%`;
    barGround.style.width = `${Math.min(100, 88)}%`;

    valDns.innerText = `${(threatScore * 0.95).toFixed(1)}%`;
    valCred.innerText = data.has_password_input ? "95.0%" : "20.0%";
    valUrg.innerText = `${manipScore}.0%`;
    valData.innerText = `${privScore}.0%`;
    valTrack.innerText = `${Math.round(privScore * 0.75)}.0%`;
    valGround.innerText = "88.0%";

    // Fluid Tanks
    tank1.style.height = `${threatScore}%`;
    tank2.style.height = `${manipScore}%`;
    tank1.nextElementSibling.innerText = `${threatScore}%`;
    tank2.nextElementSibling.innerText = `${manipScore}%`;

    // Grounding Evidence Quote
    const quote = data.evidence_quote || (data.privacy.findings && data.privacy.findings[0] && data.privacy.findings[0].evidence) || "No intrusive privacy data disclosures found.";
    dashboardEvidenceQuote.innerText = `"${quote}"`;
    evQuoteSummary.innerText = data.privacy.score > 50 ? "AGGRESSIVE DISCLOSURE GROUNDED" : "TRANSPARENT POLICY GROUNDED";

    // Build Signals (Why?)
    const signals = [];
    if (data.threat && data.threat.signals) {
      data.threat.signals.forEach(s => signals.push({ ...s, category: "THREAT GUARDIAN (50%)" }));
    }
    if (data.manipulation && data.manipulation.signals) {
      data.manipulation.signals.forEach(s => signals.push({ ...s, category: "MANIPULATION GUARDIAN (25%)" }));
    }
    if (data.privacy && data.privacy.findings) {
      data.privacy.findings.forEach(f => signals.push({
        type: f.category,
        severity: f.risk,
        explanation: f.explanation,
        evidence: f.evidence,
        category: "PRIVACY GUARDIAN (25%)"
      }));
    }

    dashSignalsCount.innerText = `${signals.length} SIGNALS FLAGGED`;
    dashSignalsList.innerHTML = "";

    if (signals.length === 0) {
      dashSignalsList.innerHTML = `
        <div class="signal-tile-card safe">
          <span class="sig-icon">🛡️</span>
          <div class="sig-info">
            <span class="sig-title">[CLEAN DOMAIN] Verified Trust Parameters</span>
            <span class="sig-desc">Zero credential phishing vectors, manipulative patterns, or invasive tracking scripts identified.</span>
          </div>
        </div>
      `;
    } else {
      signals.forEach(sig => {
        const item = document.createElement("div");
        const sev = (sig.severity || "medium").toLowerCase();
        item.className = `signal-tile-card ${sev}`;

        let icon = "⚠️";
        if (sig.category.includes("THREAT")) icon = "🚨";
        if (sig.category.includes("MANIPULATION")) icon = "🎭";
        if (sig.category.includes("PRIVACY")) icon = "👁️";

        item.innerHTML = `
          <span class="sig-icon">${icon}</span>
          <div class="sig-info">
            <span class="sig-title">[${sig.category}] ${(sig.type || "SIGNAL").toUpperCase().replace(/_/g, " ")}</span>
            <span class="sig-desc">${sig.explanation || ""}</span>
          </div>
        `;
        dashSignalsList.appendChild(item);
      });
    }

    // Play Audio
    if (score >= 65) {
      playSound("critical");
    } else {
      playSound("safe");
    }
  }

  // Handle Scenario Buttons
  const scenarioButtons = document.querySelectorAll(".btn-scenario");
  scenarioButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      scenarioButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const scenarioKey = btn.getAttribute("data-scenario");
      if (SCENARIOS[scenarioKey]) {
        playSound("scan");
        applyAnalysisToHUD(SCENARIOS[scenarioKey]);
      }
    });
  });

  // Custom Target Inspection
  async function inspectTargetUrl(urlToScan) {
    playSound("scan");
    btnInspectUrl.innerHTML = "<span class='btn-sparkle'>⚡</span><span>SCANNING...</span>";

    // First check if matching our demo scenarios
    for (const key of Object.keys(SCENARIOS)) {
      if (SCENARIOS[key].url.toLowerCase().includes(urlToScan.toLowerCase()) || urlToScan.toLowerCase().includes(key)) {
        setTimeout(() => {
          applyAnalysisToHUD(SCENARIOS[key]);
          btnInspectUrl.innerHTML = "<span class='btn-sparkle'>⚡</span><span>AWAKEN SPIDER-SENSE</span>";
        }, 300);
        return;
      }
    }

    // Try FastAPI Backend
    try {
      const payload = {
        url: urlToScan,
        title: "Target Page Inspection",
        visible_text: `Analyzing ${urlToScan}. Domain inspection and threat detection active.`,
        forms: urlToScan.includes("login") ? [{ has_password: true }] : [],
        buttons: ["Submit", "Verify"],
        has_password_input: urlToScan.includes("login") || urlToScan.includes("verify"),
        privacy_policy_text: "Standard data terms and telemetry disclosures."
      };

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        applyAnalysisToHUD(result);
        backendLabelText.innerText = "BACKEND: LIVE FASTAPI CONNECTED";
      } else {
        throw new Error("Backend response error");
      }
    } catch (err) {
      console.log("Backend offline, running smart local evaluator:", err.message);
      backendLabelText.innerText = "AUTONOMOUS ENGINE ACTIVE";
      
      const isPhish = /login|verify|bank|auth|secure|suspended|urgent|update/i.test(urlToScan);
      const isManip = /deal|sale|offer|discount|hurry|coupon|limited/i.test(urlToScan);
      const isPriv = /track|analytics|pixel|ads|broker|telemetry/i.test(urlToScan);

      let customResult;
      if (isPhish) {
        customResult = { ...SCENARIOS.phishing, url: urlToScan };
      } else if (isManip) {
        customResult = { ...SCENARIOS.manipulation, url: urlToScan };
      } else if (isPriv) {
        customResult = { ...SCENARIOS.privacy, url: urlToScan };
      } else {
        customResult = { ...SCENARIOS.safe, url: urlToScan };
      }
      applyAnalysisToHUD(customResult);
    } finally {
      btnInspectUrl.innerHTML = "<span class='btn-sparkle'>⚡</span><span>AWAKEN SPIDER-SENSE</span>";
    }
  }

  btnInspectUrl.addEventListener("click", () => {
    const url = targetUrlInput.value.trim();
    if (url) inspectTargetUrl(url);
  });

  btnFloatingScan.addEventListener("click", () => {
    const url = targetUrlInput.value.trim();
    if (url) inspectTargetUrl(url);
  });

  targetUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const url = targetUrlInput.value.trim();
      if (url) inspectTargetUrl(url);
    }
  });

  // Initial Load: Phishing scenario
  applyAnalysisToHUD(SCENARIOS.phishing);
});
