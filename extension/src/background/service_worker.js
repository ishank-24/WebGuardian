
// WebGuardian Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "SYS" });
  chrome.action.setBadgeBackgroundColor({ color: "#8b5cf6" }); // Violet
  console.log("[WebGuardian] System initialized. Solo-Leveling Hunter Core Online.");
});

// Update badge based on analysis score
async function updateExtensionBadge(score, riskLevel) {
  let badgeColor = "#10b981"; // Safe Green
  let badgeText = `${score}`;

  if (score >= 86 || riskLevel === "CRITICAL") {
    badgeColor = "#ef4444"; // Red
    badgeText = "CRIT";
  } else if (score >= 71 || riskLevel === "HIGH") {
    badgeColor = "#f43f5e"; // Rose
    badgeText = "HIGH";
  } else if (score >= 51 || riskLevel === "MEDIUM") {
    badgeColor = "#f59e0b"; // Amber
    badgeText = "WARN";
  } else if (score >= 26 || riskLevel === "LOW") {
    badgeColor = "#3b82f6"; // Blue
    badgeText = "LOW";
  } else {
    badgeColor = "#10b981"; // Emerald
    badgeText = "SAFE";
  }

  await chrome.action.setBadgeText({ text: badgeText });
  await chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// Handle runtime messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BADGE") {
    updateExtensionBadge(message.score, message.riskLevel)
      .then(() => sendResponse({ status: "badge_updated" }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
  
  if (message.type === "SAVE_HISTORY") {
    chrome.storage.local.get({ scan_history: [] }, (res) => {
      const history = res.scan_history || [];
      history.unshift(message.record);
      if (history.length > 50) history.pop();
      chrome.storage.local.set({ scan_history: history });
    });
    sendResponse({ status: "history_saved" });
    return true;
  }
});
