document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['networkRequests'], function(result) {
        const iframes = result.attachedIframes;
        if (iframes) {
            for (let iframeId in iframes) {
                chrome.debugger.sendCommand({ targetId: iframeId }, "Network.disable", () => {});
            }
        }
    });
    chrome.storage.local.get(['networkRequests'], function(result) {
        const requests = result.networkRequests;
        if (requests && Object.keys(requests).length > 0) {
            console.log(requests);
            displayRequests(requests);
        } else {
            const heading = document.getElementById('heading');
            const h2 = document.createElement('h2');
            h2.textContent = 'No failed requests found. If Checkout was failed, please inspect Console and Network tab';
            heading.appendChild(h2);
        }
    });
});

function displayRequests(requests) {
    const resultsDiv = document.getElementById('results');
    const heading = document.getElementById('heading');
    const h2 = document.createElement('h2');
    h2.textContent = "Next requests failed during checkout and might be cause of the issue:";
    heading.appendChild(h2);

    for (let requestId in requests) {
        const request = requests[requestId];
        console.log(request);
        const requestDiv= document.createElement('div');
        requestDiv.title = "COPY";
        requestDiv.textContent = `URL: ${request.request.url}, Method: ${request.request.method}\n`;
        if (request.response) {
            requestDiv.textContent += `${request.response.statusText}, Status: ${request.response.status}`;
            if (request.response.body) {
                let pre = document.createElement('pre');
                let jsonObject = JSON.parse(request.response.body);
                let prettyJson = JSON.stringify(jsonObject, null, 2);
                pre.textContent = prettyJson;
                requestDiv.appendChild(pre);
            }
        }
        resultsDiv.appendChild(requestDiv);
    }

    document.querySelectorAll("#results div").forEach(function(div) {
        div.addEventListener("click", function() {
            let divText = this.textContent;
            navigator.clipboard.writeText(divText);
            let encodedText = encodeURIComponent(divText);
            let url = `https://www.perplexity.ai?q=${encodedText}`;
            window.open(url, '_blank');
        });
    });
}