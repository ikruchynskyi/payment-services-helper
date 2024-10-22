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
                        if (target.url.includes("payments") || target.url.includes("paypal")) {
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
                chrome.debugger.sendCommand({targetId: source.targetId}, "Network.getResponseBody",
                    {"requestId": params.requestId}, function(response) {
                        networkLogs[params.requestId]['response']['body'] = response.body;
                    });
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
    chrome.storage.local.set({'networkRequests': networkLogs}, () => {});

    chrome.storage.local.set({'attachedIframes': iframes}, () => {});

    chrome.windows.create({
        url: 'results/index.html',
        type: 'popup'
    });

    setTimeout(function() {
        networkLogs = {};
    }, 1000);
}