// ===== content.js =====

// [Functionality: Extract Base Domain]
// Extracts the base domain from a hostname (e.g., "sub.example.com" -> "example.com")
function getBaseDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length > 2) {
    const tlds = ["co.uk", "com", "org", "net", "io", "gov", "edu", "in"];
    const lastTwo = parts.slice(-2).join(".");
    const lastThree = parts.slice(-3).join(".");
    if (tlds.includes(lastTwo) || tlds.includes(lastThree)) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }
  return hostname;
}

// [Functionality: Extract Real URL]
// Extracts the actual URL from redirector links (e.g., links with parameters like "redirect=?http...")
function extractRealURL(href) {
  try {
    const url = new URL(href);
    const paramNames = ["q", "u", "url", "redirect", "target"];
    for (const param of paramNames) {
      const value = url.searchParams.get(param);
      if (value && value.startsWith("http")) {
        return value;
      }
    }
    return href;
  } catch (e) {
    console.warn("Invalid URL:", href);
    return href;
  }
}

// [Functionality: Check URL with Safe Browsing]
// Sends a URL to Google Safe Browsing API to check if it's flagged as malicious
async function checkURLWithSafeBrowsing(url) {
  const apiKey = "AIzaSyCteteKXR9GHUEJ8J-17Nhv8i3unRR3lic"; // Replace with your actual API key
  const apiEndpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const requestPayload = {
    client: {
      clientId: "zephyr-extension",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();
    return !!data.matches; // Returns true if the URL is flagged
  } catch (err) {
    console.error("❌ Safe Browsing API error:", err);
    return false; // Default to safe if there's an error
  }
}

// [Functionality: Check Domain Reputation]
// Sends a domain name to the background script to check its reputation via WHOISXMLAPI
function checkDomainReputation(input) {
  let domain;
  try {
    domain = new URL(input).hostname; // Extract domain from URL
  } catch {
    domain = input; // Use input directly if not a valid URL
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "checkDomainReputation",
        domain,
      },
      (response) => {
        console.log("🔁 Reputation (from background):", response);
        resolve(
          response || {
            status: "unknown",
            message: "No response from background",
          }
        );
      }
    );
  });
}

// [Functionality: Get Warnings]
// Sends a domain name to the background script to fetch warnings via WHOISXMLAPI
function getWarnings(input) {
  let domain;
  try {
    domain = new URL(input).hostname; // Extract domain from URL
  } catch {
    domain = input; // Use input directly if not a valid URL
  }
// const simulatedWarnings = `
//     <div>
//       <h4>WHOIS Domain check</h4>
//       <ul>
//         <li>Owner details are publicly available</li>
//       </ul>
//       <h4>SSL certificate validity</h4>
//       <ul>
//         <li>Recently obtained certificate, valid from 2022-05-09 08:32:32</li>
//       </ul>
//       <h4>SSL vulnerabilities</h4>
//       <ul>
//         <li>HTTP Strict Transport Security not set</li>
//         <li>TLSA record not configured or configured wrong</li>
//         <li>OCSP stapling not configured</li>
//       </ul>
//     </div>
//   `;

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "getWarnings",
        domain,
      },
      (response) => {
        if (response && response.status === "success") {
          const warningsHTML = response.warnings
            .map((warning) => {
              const heading = `<h4>${warning.testName}</h4>`;
              const warningsList = `<ul>${warning.warnings
                .map((w) => `<li>${w}</li>`)
                .join("")}</ul>`;
              return heading + warningsList;
            })
            .join("");
          resolve(warningsHTML);
        } else {
          resolve("<p>No warnings available or failed to fetch warnings.</p>");
        }
      }
    );
  });

  // Simulated Response (Resolve Immediately)
//  return Promise.resolve(simulatedWarnings);
}

// [Event Listener: Intercept Clicks]
// Listens for clicks on anchor tags and handles navigation logic
document.addEventListener(
  "click",
  (e) => {
    if (e.button !== 0) return; // Only handle left mouse button clicks

    let target = e.target;
    while (target && target.tagName.toLowerCase() !== "a") {
      target = target.parentElement; // Traverse up to find anchor tag
    }
    if (!target || !target.href) return;

    e.preventDefault(); // Prevent default navigation

    const realHref = extractRealURL(target.href);
    const currentBase = getBaseDomain(window.location.hostname);
    const clickedBase = getBaseDomain(new URL(realHref).hostname);

    console.log("Clicked HREF:", target.href);
    console.log("Real HREF:", realHref);
    console.log("Current base:", currentBase);
    console.log("Clicked base:", clickedBase);

    // [Async Checks: Safe Browsing, Domain Reputation, and Warnings]
    (async () => {
      const isSuspicious = await checkURLWithSafeBrowsing(realHref);
      const reputation = await checkDomainReputation(realHref);
      const warningsHTML = await getWarnings(realHref);

      console.log("Is Suspicious:", isSuspicious);
      console.log("Reputation:", reputation);
      console.log("Warnings:", warningsHTML);

      if (
        clickedBase !== currentBase ||
        isSuspicious ||
        reputation.status === "bad"
      ) {
        loadModalResources(() => {
          showModal(
            () => {
              window.location.href = realHref;
            },
            () => {
              console.log("Navigation cancelled");
            },
            { isSuspicious, reputation, warningsHTML }
          );
        });
      } else {
        window.location.href = realHref;
      }
    })();
  },
  true
);

// [Functionality: Load Modal Resources]
// Dynamically loads modal HTML and CSS
let modalLoaded = false;
function loadModalResources(callback) {
  if (modalLoaded) return callback(); // Skip if already loaded

  Promise.all([
    fetch(chrome.runtime.getURL("modal.html")).then((res) => res.text()),
    fetch(chrome.runtime.getURL("modal.css")).then((res) => res.text()),
  ])
    .then(([html, css]) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      modalLoaded = true;
      console.log("Modal resources loaded");
      callback();
    })
    .catch((err) => {
      console.error("Failed to load modal resources:", err);
      callback(false);
    });
}

// [Functionality: Show Modal]
// Displays a warning modal with data from Safe Browsing, WHOISXMLAPI, and warnings
function showModal(onConfirm, onCancel, { isSuspicious, reputation, warningsHTML }) {
  const modal = document.getElementById("domain-warning-modal");
  if (!modal) return onConfirm(); // Proceed if modal not found

  let warningMsg = "";
  if (isSuspicious) {
    warningMsg += "⚠️ This site is flagged as potentially harmful\n";
  }
  if (reputation && reputation.status && reputation.status !== "unknown") {
    warningMsg += `🛡️ ${reputation.message}`;
  }
  if (!warningMsg) {
    warningMsg = "You're navigating to a different domain. Proceed?";
  }

  const modalText = modal.querySelector(".modal-text p");
  if (modalText) modalText.innerHTML = warningMsg; // Update modal text with warnings

  // Add warningsHTML inside a scrollable container
  const scrollableWarningsContainer = `
    <div class="warnings-container">
      ${warningsHTML}
    </div>
  `;
  modalText.insertAdjacentHTML("beforeend", scrollableWarningsContainer); // Append the scrollable container

  modal.style.display = "flex"; // Show modal

  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  const cleanup = () => {
    modal.style.display = "none";
    confirmBtn.removeEventListener("click", onConfirmClick);
    cancelBtn.removeEventListener("click", onCancelClick);
  };

  const onConfirmClick = () => {
    cleanup();
    onConfirm();
  }; // Confirm navigation
  const onCancelClick = () => {
    cleanup();
    onCancel();
  }; // Cancel navigation

  confirmBtn.addEventListener("click", onConfirmClick);
  cancelBtn.addEventListener("click", onCancelClick);
}