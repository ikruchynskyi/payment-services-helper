let debuggerAttached = false;
let networkLogs = {};
let iframes = {};
let capturedErrors = [];
let iframeErrors = [];
let customElementErrors = [];
let allCollectedErrors = {};
let perplexityApiKey = ''; // Will be set from settings

// Initialize settings when extension starts
chrome.runtime.onInstalled.addListener(() => {
  // Always enable sendToPerplexity
  chrome.storage.local.set({ 'sendToPerplexity': true });
  console.log('Initialized Perplexity integration: always enabled');
});

// Function to send errors to Perplexity for analysis via URL
function sendErrorsToPerplexity(errors, pageUrl) {
  try {
    // Format the errors for analysis
    const formattedErrors = formatErrorsForPerplexity(errors, pageUrl);
    
    // Store the formatted errors for future reference
    chrome.storage.local.set({
      'lastErrorAnalysis': {
        timestamp: new Date().toISOString(),
        pageUrl: pageUrl,
        formattedErrors: formattedErrors
      }
    }, function() {
      // After storing the analysis, open the results page
      chrome.tabs.create({
        url: chrome.runtime.getURL('analysis-results.html')
      });
    });
    
    // Also log to console for reference
    console.log('Errors formatted for Perplexity analysis');
    
    // Create the Perplexity URL (for reference)
    const encodedText = encodeURIComponent(formattedErrors);
    const perplexityUrl = `https://www.perplexity.ai?q=${encodedText}`;
    console.log('Perplexity URL (for manual use):', perplexityUrl);
  } catch (error) {
    console.error('Error preparing analysis:', error);
  }
}

// Format errors for Perplexity analysis
function formatErrorsForPerplexity(allErrors, pageUrl) {
  // Create a prompt for Perplexity
  let prompt = `Analyze these JavaScript errors from ${pageUrl} and provide: 
1) A summary of the errors
2) Likely root causes
3) Potential solutions
4) Any patterns between errors
5) Debugging recommendations

Here are the errors:\n\n`;

  // Add page context
  prompt += `Page URL: ${pageUrl}\n`;
  prompt += `User Agent: ${navigator.userAgent || 'Unknown'}\n`;
  prompt += `Timestamp: ${new Date().toISOString()}\n\n`;

  // Add custom element errors
  if (allErrors.customElementErrors && allErrors.customElementErrors.length > 0) {
    prompt += `## Custom Element Errors (${allErrors.customElementErrors.length}):\n`;
    allErrors.customElementErrors.forEach((error, index) => {
      prompt += formatSingleError(error, index, 'CustomElement');
    });
  }

  // Add uncaught exceptions
  if (allErrors.uncaughtExceptions && allErrors.uncaughtExceptions.length > 0) {
    prompt += `\n## Uncaught Exceptions (${allErrors.uncaughtExceptions.length}):\n`;
    allErrors.uncaughtExceptions.forEach((error, index) => {
      prompt += formatSingleError(error, index, 'Exception');
    });
  }

  // Add failed promises
  if (allErrors.failedPromises && allErrors.failedPromises.length > 0) {
    prompt += `\n## Failed Promises (${allErrors.failedPromises.length}):\n`;
    allErrors.failedPromises.forEach((error, index) => {
      prompt += formatSingleError(error, index, 'Promise');
    });
  }

  // Add console errors
  if (allErrors.consoleErrors && allErrors.consoleErrors.length > 0) {
    prompt += `\n## Console Errors (${allErrors.consoleErrors.length}):\n`;
    allErrors.consoleErrors.forEach((error, index) => {
      prompt += formatSingleError(error, index, 'Console');
    });
  }

  // Add network errors
  if (allErrors.networkErrors && allErrors.networkErrors.length > 0) {
    prompt += `\n## Network Errors (${allErrors.networkErrors.length}):\n`;
    allErrors.networkErrors.forEach((error, index) => {
      prompt += formatSingleError(error, index, 'Network');
    });
  }

  // Add iframe errors
  if (allErrors.iframeErrors && allErrors.iframeErrors.length > 0) {
    prompt += `\n## Iframe Errors (${allErrors.iframeErrors.length}):\n`;
    
    // Group iframe errors by source
    const groupedIframeErrors = {};
    allErrors.iframeErrors.forEach(error => {
      const source = error.iframeSrc || error.iframeSource || 'unknown';
      if (!groupedIframeErrors[source]) {
        groupedIframeErrors[source] = [];
      }
      groupedIframeErrors[source].push(error);
    });
    
    // Format grouped iframe errors
    for (const [source, errors] of Object.entries(groupedIframeErrors)) {
      prompt += `\nIframe Source: ${source}\n`;
      errors.forEach((error, index) => {
        prompt += formatSingleError(error, index, 'Iframe');
      });
    }
  }

  return prompt;
}

// Format a single error for Perplexity
function formatSingleError(error, index, category) {
  let formatted = `\n### ${category} Error ${index + 1}:\n`;
  
  if (error.text) {
    formatted += `Message: ${error.text}\n`;
  }
  
  if (error.url) {
    formatted += `URL: ${error.url}\n`;
  }
  
  if (error.line && error.col) {
    formatted += `Location: Line ${error.line}, Column ${error.col}\n`;
  }
  
  if (error.stack) {
    // Limit stack trace length to avoid exceeding URL length limits
    const stackLines = error.stack.split('\n');
    const limitedStack = stackLines.slice(0, 5).join('\n');
    formatted += `Stack Trace:\n${limitedStack}\n`;
    if (stackLines.length > 5) {
      formatted += `(${stackLines.length - 5} more lines...)\n`;
    }
  }
  
  if (error.timestamp) {
    formatted += `Time: ${error.timestamp}\n`;
  }
  
  if (category === 'Iframe' && error.iframeSrc) {
    formatted += `Iframe Source: ${error.iframeSrc}\n`;
  }
  
  if (error.elementName) {
    formatted += `Element Name: ${error.elementName}\n`;
  }
  
  return formatted;
}

// Load API key from storage when extension starts
chrome.storage.local.get(['perplexityApiKey'], (result) => {
  if (result.perplexityApiKey) {
    perplexityApiKey = result.perplexityApiKey;
  }
});

// Listen for API key changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.perplexityApiKey) {
    perplexityApiKey = changes.perplexityApiKey.newValue;
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === 'ERROR_LOGGED') {
    if (request.error.type === 'CustomElementError' || 
        (request.error.text && request.error.text.includes('CustomElementRegistry')) ||
        (request.error.text && request.error.text.includes('define') && request.error.text.includes('already been used'))) {
      customElementErrors.push(request.error);
      console.log('Custom element error logged:', request.error);
    } else {
      capturedErrors.push(request.error);
    }
  }
  
  if (request.message === 'IFRAME_ERROR_LOGGED') {
    iframeErrors.push(request.error);
    console.log('Iframe error logged:', request.error);
  }
  
  if (request.message === 'ALL_ERRORS_COLLECTED') {
    allCollectedErrors = request.errors;
    
    if (!allCollectedErrors.iframeErrors) {
      allCollectedErrors.iframeErrors = [];
    }
    
    if (iframeErrors.length > 0) {
      allCollectedErrors.iframeErrors = allCollectedErrors.iframeErrors.concat(iframeErrors);
    }
    
    if (!allCollectedErrors.customElementErrors) {
      allCollectedErrors.customElementErrors = [];
    }
    
    if (customElementErrors.length > 0) {
      allCollectedErrors.customElementErrors = allCollectedErrors.customElementErrors.concat(customElementErrors);
    }
    
    console.log('All errors collected from page:', request.url);
    
    // Always send to Perplexity for analysis
    sendErrorsToPerplexity(allCollectedErrors, request.url);
    
    // Reset error arrays for next collection
    iframeErrors = [];
    customElementErrors = [];
  }
  
  // Handle toggling Perplexity integration (keep for backward compatibility)
  if (request.message === 'TOGGLE_PERPLEXITY') {
    chrome.storage.local.set({ 'sendToPerplexity': true });
  }
});

// Function to log errors to console (fallback)
function logErrorsToConsole(allCollectedErrors) {
  console.log('Collected Errors Summary:');
  
  if (allCollectedErrors.consoleErrors && allCollectedErrors.consoleErrors.length > 0) {
      console.log('Console Errors:');
      console.table(allCollectedErrors.consoleErrors);
  }
  
  if (allCollectedErrors.consoleWarnings && allCollectedErrors.consoleWarnings.length > 0) {
      console.log('Console Warnings:');
      console.table(allCollectedErrors.consoleWarnings);
  }
  
  if (allCollectedErrors.uncaughtExceptions && allCollectedErrors.uncaughtExceptions.length > 0) {
      console.log('Uncaught Exceptions:');
      console.table(allCollectedErrors.uncaughtExceptions);
  }
  
  if (allCollectedErrors.customElementErrors && allCollectedErrors.customElementErrors.length > 0) {
      console.log('Custom Element Errors:');
      console.table(allCollectedErrors.customElementErrors);
  }
  
  if (allCollectedErrors.failedPromises && allCollectedErrors.failedPromises.length > 0) {
      console.log('Failed Promises:');
      console.table(allCollectedErrors.failedPromises);
  }
  
  if (allCollectedErrors.networkErrors && allCollectedErrors.networkErrors.length > 0) {
      console.log('Network Errors:');
      console.table(allCollectedErrors.networkErrors);
  }
  
  if (allCollectedErrors.iframeErrors && allCollectedErrors.iframeErrors.length > 0) {
      console.log('Iframe Errors:');
      console.table(allCollectedErrors.iframeErrors);
      
      const groupedIframeErrors = {};
      allCollectedErrors.iframeErrors.forEach(error => {
          const source = error.iframeSrc || error.iframeSource || 'unknown';
          if (!groupedIframeErrors[source]) {
              groupedIframeErrors[source] = [];
          }
          groupedIframeErrors[source].push(error);
      });
      
      console.log('Iframe Errors by Source:');
      for (const [source, errors] of Object.entries(groupedIframeErrors)) {
          console.log(`Iframe Source: ${source}`);
          console.table(errors);
      }
  }
}

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
  fetch(screenshots[0])
      .then(response => response.blob())
      .then(blob => createImageBitmap(blob))
      .then(firstBitmap => {
        const width = firstBitmap.width;
        const height = firstBitmap.height;
        const totalHeight = height * screenshots.length;

        const canvas = new OffscreenCanvas(width, totalHeight);
        const ctx = canvas.getContext("2d");

        const bitmapPromises = screenshots.map((dataUrl, index) =>
            fetch(dataUrl)
                .then(response => response.blob())
                .then(blob => createImageBitmap(blob))
                .then(bitmap => {
                  ctx.drawImage(bitmap, 0, index * height);
                })
        );

        Promise.all(bitmapPromises)
            .then(() => {
              overlayConsoleErrors(ctx, width, totalHeight);
              return canvas.convertToBlob({ type: "image/png" });
            })
            .then(blob => {
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
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
    }
  });
}