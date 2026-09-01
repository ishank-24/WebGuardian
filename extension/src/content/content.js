// WebGuardian Spider-Sense Content Script
// Extracts DOM signals, forms, password inputs, text, buttons, and privacy policy excerpts

(() => {
  function extractPageData() {
    try {
      const url = window.location.href;
      const title = document.title || "";

      // Extract visible text (clean whitespace, cap to 15,000 chars)
      const cloneBody = document.body ? document.body.cloneNode(true) : null;
      if (cloneBody) {
        const scriptsAndStyles = cloneBody.querySelectorAll("script, style, noscript, svg, canvas");
        scriptsAndStyles.forEach(el => el.remove());
      }
      const rawText = cloneBody ? (cloneBody.innerText || cloneBody.textContent || "") : "";
      const visible_text = rawText.replace(/\s+/g, " ").trim().slice(0, 15000);

      // Forms extraction
      const formElements = Array.from(document.querySelectorAll("form"));
      let has_password_input = false;
      const forms = [];

      formElements.forEach((form, idx) => {
        const inputs = Array.from(form.querySelectorAll("input, select, textarea")).map(input => {
          const type = (input.getAttribute("type") || input.tagName.toLowerCase()).toLowerCase();
          const name = input.getAttribute("name") || "";
          const id = input.getAttribute("id") || "";
          const placeholder = input.getAttribute("placeholder") || "";
          const autocomplete = input.getAttribute("autocomplete") || "";

          if (type === "password" || name.toLowerCase().includes("pass") || id.toLowerCase().includes("pass")) {
            has_password_input = true;
          }
          return { type, name, id, placeholder, autocomplete };
        });

        forms.push({
          index: idx,
          action: form.getAttribute("action") || "",
          method: (form.getAttribute("method") || "GET").toUpperCase(),
          input_count: inputs.length,
          inputs: inputs.slice(0, 15),
          has_password: inputs.some(i => i.type === "password" || i.name.toLowerCase().includes("pass"))
        });
      });

      // Also check standalone inputs outside <form>
      const standaloneInputs = document.querySelectorAll("input[type='password']");
      if (standaloneInputs.length > 0) {
        has_password_input = true;
      }

      // Buttons and CTA texts
      const buttonElements = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], a.btn, a.button, [role='button']"));
      const buttons = buttonElements.map(b => (b.innerText || b.value || b.textContent || "").trim()).filter(Boolean).slice(0, 25);

      // Privacy policy link & text search
      let privacy_policy_text = "";
      let privacy_link = "";
      const links = Array.from(document.querySelectorAll("a[href]"));
      for (const link of links) {
        const text = (link.innerText || link.textContent || "").toLowerCase();
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (text.includes("privacy") || href.includes("privacy-policy") || href.includes("privacy")) {
          privacy_link = link.href;
          break;
        }
      }

      // Check if current page is itself a privacy policy or has privacy sections
      if (url.toLowerCase().includes("privacy") || title.toLowerCase().includes("privacy")) {
        privacy_policy_text = visible_text.slice(0, 8000);
      } else if (privacy_link) {
        privacy_policy_text = `Privacy policy link identified: ${privacy_link}. Direct extraction active.`;
      }

      return {
        url,
        title,
        visible_text,
        forms,
        buttons,
        has_password_input,
        privacy_policy_text,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error("[WebGuardian] DOM Extraction Error:", err);
      return {
        url: window.location.href,
        title: document.title || "",
        visible_text: "",
        forms: [],
        buttons: [],
        has_password_input: false,
        privacy_policy_text: "",
        error: err.message
      };
    }
  }

  // Message listener for popup requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "EXTRACT_PAGE_DATA") {
      const data = extractPageData();
      sendResponse({ success: true, data });
    }
    return true; // Keep channel open for async response
  });
})();

