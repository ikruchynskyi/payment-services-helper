let debuggerAttached = false;
let networkLogs = {};
let iframes = {};
let capturedErrors = [];

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'ERROR_LOGGED') {
    capturedErrors.push(request.error);
  }
});


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
  chrome.storage.local.set({'networkRequests': networkLogs}, () => {
    // saveHAR(networkLogs);
  });

  chrome.storage.local.set({'attachedIframes': iframes}, () => {});

  chrome.windows.create({
    url: 'results.html',
    type: 'popup',
    height: 800,
    width: 600
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


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("catalog/product/view") && tab.url.includes("from-helper")) {
    chrome.tabs.sendMessage(tabId, {"message": "clickAddToCart"});
    setTimeout(function (){
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length > 0) {
          const currentTab = tabs[0];
          const currentUrl = new URL(currentTab.url);
          const newUrl = new URL('/checkout/index', currentUrl.origin);
          chrome.tabs.update(currentTab.id, { url: newUrl.toString() });
        }
      });
    }, 3000);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture_full_page") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      let tab = tabs[0];

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getFullPageHeight
      }, (results) => {
        if (!results || !results[0]) return;

        let pageHeight = results[0].result;
        scrollAndCapture(tab.id, pageHeight);
      });
    });
  }
});

function getFullPageHeight() {
  return document.body.scrollHeight;
}

function scrollAndCapture(tabId, totalHeight, scrollStep = 800) {
  let scrollPos = 0;
  let screenshots = [];

  function captureNext() {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (y) => window.scrollTo(0, y),
      args: [scrollPos]
    }, () => {
      setTimeout(() => {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
          screenshots.push(dataUrl);
          scrollPos += scrollStep;

          if (scrollPos < totalHeight) {
            captureNext();
          } else {
            mergeAndSaveScreenshot(screenshots);
          }
        });
      }, 500);
    });
  }

  captureNext();
}

function mergeAndSaveScreenshot(screenshots) {
  // First, fetch the first image to determine dimensions.
  fetch(screenshots[0])
      .then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(firstBitmap => {
        const width = firstBitmap.width;
        const height = firstBitmap.height;
        const totalHeight = height * screenshots.length;

        // Create an OffscreenCanvas with the full size.
        const canvas = new OffscreenCanvas(width, totalHeight);
        const ctx = canvas.getContext("2d");

        // Prepare an array of promises to process each screenshot.
        const bitmapPromises = screenshots.map((dataUrl, index) =>
            fetch(dataUrl)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(bitmap => {
                  // Draw the bitmap at the appropriate vertical offset.
                  ctx.drawImage(bitmap, 0, index * height);
                })
        );

        // Once all images have been drawn, convert the canvas to a blob.
        Promise.all(bitmapPromises)
            .then(() => {
              overlayConsoleErrors(ctx, width, totalHeight);
              return canvas.convertToBlob({ type: "image/png" });
            })
            .then(blob => {
              // Since URL.createObjectURL might not be available in service workers,
              // convert the blob to a data URL using FileReader.
              const reader = new FileReader();
              reader.onloadend = function () {
                const dataUrl = reader.result;
                saveImage(dataUrl);
              };
              reader.readAsDataURL(blob);
            })
            .catch(error => console.error("Error during merging:", error));
      })
      .catch(error => console.error("Error loading first image:", error));
}

function overlayConsoleErrors(ctx, canvasWidth, canvasHeight) {
  if (!capturedErrors.length) return;


  ctx.fillStyle = "#171717";
  let margin = 10;
  let rectHeight = capturedErrors.length * 24 + 2 * margin; 

  ctx.fillRect(0, canvasHeight - rectHeight, canvasWidth, rectHeight);
  ctx.fillStyle = "#FFFFFF"; 
  ctx.font = "bold 20px monospace";
  ctx.textBaseline = "top";

  // Calculate text position
  let x = margin;
  let y = canvasHeight - rectHeight + margin;


  capturedErrors.forEach((error, index) => {
    ctx.fillText(JSON.stringify(error), x, y + index * 24);
  });
}

function saveImage(blobUrl) {

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tabUrl = tabs[0].url;
      try {
        const urlObj = new URL(tabUrl);
        const domain = urlObj.hostname;
        chrome.downloads.download({
          url: blobUrl,
          filename: domain + "_screenshot.png",
          saveAs: true
        });
        // Use the domain as needed...
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
    }
  });
}