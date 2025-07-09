// ===== background.js =====

// Listener for incoming messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // [Functionality: Check Domain Reputation]
  if (request.type === "checkDomainReputation") {
    const domain = request.domain; // Extract the domain to check
    const API_KEY = "${WHOIS_API}"; // WHOISXMLAPI API Key
    const apiUrl = `https://domain-reputation.whoisxmlapi.com/api/v2?apiKey=${API_KEY}&domainName=${domain}`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        const score = Number(data?.reputationScore); // Extract the reputation score
        if (isNaN(score)) {
          sendResponse({
            status: "unknown", // Indicate unknown reputation status
            message: "Invalid or missing reputation score" // Error description
          });
        } else {
          const status = score < 40 ? "bad" : "safe"; // Determine status based on score
          sendResponse({
            status,
            message: `Reputation Score: ${score}` // Include reputation score in response
          });
        }
      })
      .catch(err => {
        console.error("❌ WhoisXML fetch failed:", err);
        sendResponse({
          status: "unknown", // Indicate unknown reputation status
          message: "Fetch error or network failure" // Error description
        });
      });

    return true; // Keep sendResponse active asynchronously
  }

  // [Functionality: Get Warnings]
  if (request.type === "getWarnings") {
    const domain = request.domain; // Extract the domain to check
    const API_KEY = "${WHOIS_API}"; // WHOISXMLAPI API Key
    const apiUrl = `https://domain-reputation.whoisxmlapi.com/api/v2?apiKey=${API_KEY}&domainName=${domain}`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        const testResults = data?.testResults || []; // Extract test results
        const warningsList = testResults.map(test => ({
          testName: test.test, // Use the test field as heading
          warnings: test.warnings.map(warning => warning.warningDescription) // Extract warning descriptions
        }));

        sendResponse({
          status: "success", // Indicate successful fetch
          warnings: warningsList // Deliver the warnings list
        });
      })
      .catch(err => {
        console.error("❌ WhoisXML fetch failed while getting warnings:", err);
        sendResponse({
          status: "error", // Indicate fetch error
          message: "Failed to fetch warnings from WhoisXMLAPI" // Error description
        });
      });

    return true; // Keep sendResponse active asynchronously
  }
});
