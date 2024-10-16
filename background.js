let debuggerAttached = false;
let networkLogs = {};
let iframes = {};

chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === "getHar") {
        tabId = request.tabId;
        if (!debuggerAttached) {
          debuggerAttached = true;
          chrome.debugger.getTargets((targets) => {
            if (targets) {
              for (let target of targets) {
                if (target.url.includes("payments")) {
                  iframes[target.id] = target;
                  chrome.debugger.attach({ targetId: target.id }, "1.3", () => {
                    if (chrome.runtime.lastError) {
                      console.error(chrome.runtime.lastError.message);
                      return;
                    }
                    chrome.debugger.sendCommand({ targetId: target.id }, "Network.enable", {}, () => {});
                  });
                }
              }
            }
          });

            chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
              }
              chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable", {}, () => {});
              captureHAR(tabId);
            });
          } else {
            saveAndDetach(tabId);
          }
    }
});



function captureHAR(tabId) {
  chrome.debugger.onEvent.addListener((source, method, params) => {
    if (method === "Network.requestWillBeSent") {
      networkLogs[params.requestId] = {
        request: params.request
      };
    }  else if (method === "Network.responseReceived") {
        if (networkLogs[params.requestId] && params.response.status >= 400) {
          networkLogs[params.requestId]['response'] = params['response'];
        } else {
          delete networkLogs[params.requestId];
        }
      }
  });

  setTimeout(() => {
    chrome.debugger.sendCommand({ tabId }, "Network.disable", () => {
      if (debuggerAttached) {
        saveAndDetach(tabId);
      }
    });
  }, 15000); 

}

function saveAndDetach(tabId) {
  if (iframes) {
    for (let iframeId in iframes) {
      chrome.debugger.sendCommand({ targetId: iframeId }, "Network.disable", () => {
        chrome.debugger.detach({ targetId: iframeId }, () => {});
      });
    }
    iframes = {};
  }
  chrome.debugger.sendCommand({ tabId }, "Network.disable", () => {
    chrome.debugger.detach({ tabId }, () => {
      debuggerAttached = false;
    });
  });
  chrome.storage.local.set({'networkRequests': networkLogs}, () => {
    // saveHAR(networkLogs);
  });

  chrome.windows.create({
    url: 'results.html',
    type: 'popup'
  });

  setTimeout(function() {
    networkLogs = {};
  }, 1000);
}

function saveHAR(networkLogs) {
  const harData = {
    log: {
      version: "1.2",
      creator: {
        name: "Payment Services HAR Capturer",
        version: "1.0"
      },
      entries: Object.values(networkLogs).map((log) => ({
        startedDateTime: new Date(log.timestamp).toISOString(),
        request: {
          method: log.request.method,
          url: log.request.url,
          headers: log.request.headers
        },
        response: {
          status: log.response ? log.response.status : 0,
          statusText: log.response ? log.response.statusText : ""
        },
        time: 100
      }))
    }
  };

  const harJson = JSON.stringify(harData);

  const base64Har = btoa(unescape(encodeURIComponent(harJson)));
  const dataUrl = `data:application/json;base64,${base64Har}`;

  chrome.downloads.download({
    url: dataUrl,
    filename: "page-har.json",
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error(`Download failed: ${chrome.runtime.lastError.message}`);
    } else {
      console.log(`Download started with ID: ${downloadId}`);
    }
  });
}
