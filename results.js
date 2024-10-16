document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['networkRequests'], function(result) {
      const requests = result.networkRequests;
      if (requests && Object.keys(requests).length > 0) {
        console.log(requests);
        displayRequests(requests);
      } else {
        const heading = document.createElement('h2');
        heading.textContent = 'The issue might be in the failed JS or failed requests to PayPal. Please inspect Console and Network tab';
        document.getElementById('results').appendChild(heading);
      }
    });
  });
  
  function displayRequests(requests) {
    const resultsDiv = document.getElementById('results');
    const heading = document.createElement('h2');
    heading.textContent += "Next requests failed during checkout and might be cause of the issue:.\n";
    resultsDiv.appendChild(heading);
    resultsDiv.textContent += "Request details:\n";

    for (let requestId in requests) {
      const request = requests[requestId];
      console.log(request);
      const requestDiv = document.createElement('div');
      requestDiv.style.border = '1px solid #ccc';
      requestDiv.textContent = `URL: ${request.request.url}, Method: ${request.request.method}`;
      if (request.response) {
        requestDiv.textContent += ` ${request.response.statusText}, Status: ${request.response.status}`;
      }
      resultsDiv.appendChild(requestDiv);
    }
  }
