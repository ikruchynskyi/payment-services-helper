document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['networkRequests'], function(result) {
      const requests = result.networkRequests;
      if (requests && Object.keys(requests).length > 0) {
        displayRequests(requests);
      } else {
        document.getElementById('results').textContent = 'The issue might be in the failed JS or failed requests to PayPal. Please inspect Console and Network tab';
      }
    });
  });
  
  function displayRequests(requests) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.textContent += "Any error bellow indicates that server returned error code and Merhcnats dev. team might need to inspect logs. Provide them data listed below.\n";
    for (let requestId in requests) {
      const request = requests[requestId];
      console.log(request);
      const requestDiv = document.createElement('div');
      requestDiv.textContent = `URL: ${request.request.url}, Method: ${request.request.method}`;
      if (request.response) {
        requestDiv.textContent += ` ${request.response.statusText}, Status: ${request.response.status}`;
      }
      resultsDiv.appendChild(requestDiv);
    }
  }
