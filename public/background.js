'use strict';

const DEBUGGER_PROTOCOL_VERSION = '1.3';
const NETWORK_CAPTURE_TIMEOUT_MS = 15000;
const PAYMENTS_IFRAME_MATCHERS = ['payments', 'paypal'];

let debuggerAttached = false;
let captureActive = false;
let captureTimeoutId = null;
let networkLogs = {};
let attachedTargets = {};

const capturedErrors = [];

chrome.runtime.onMessage.addListener((request) => {
  if (request?.message === 'ERROR_LOGGED') {
    if (request.error) capturedErrors.push(request.error);
    return;
  }

  if (request?.message === 'getHar') {
    const tabId = request.tabId;
    if (!tabId) return;

    if (!debuggerAttached) {
      startCapture(tabId);
    } else {
      stopCapture(tabId);
    }
    return;
  }

  if (request?.action === 'capture_full_page') {
    captureFullPageScreenshot();
  }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (!captureActive) return;

  if (method === 'Network.requestWillBeSent') {
    const key = makeRequestKey(source, params.requestId);
    networkLogs[key] = {
      requestId: params.requestId,
      request: params.request,
      debuggee: source
    };
    return;
  }

  if (method === 'Network.responseReceived') {
    const key = makeRequestKey(source, params.requestId);
    const logEntry = networkLogs[key];
    if (!logEntry) return;

    if (params.response.status >= 400) {
      logEntry.response = params.response;
      chrome.debugger.sendCommand(
        source,
        'Network.getResponseBody',
        { requestId: params.requestId },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
            return;
          }
          if (response?.body) {
            logEntry.response.body = response.body;
          }
        }
      );
    } else {
      delete networkLogs[key];
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;

  if (tab.url.includes('catalog/product/view') && tab.url.includes('from-helper')) {
    chrome.tabs.sendMessage(tabId, { message: 'clickAddToCart' });
    setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs?.length) return;
        const currentTab = tabs[0];
        if (!currentTab.url) return;
        const currentUrl = new URL(currentTab.url);
        const newUrl = new URL('/checkout/index', currentUrl.origin);
        chrome.tabs.update(currentTab.id, { url: newUrl.toString() });
      });
    }, 3000);
  }
});

function startCapture(tabId) {
  debuggerAttached = true;
  captureActive = true;
  networkLogs = {};

  attachToPaymentIframes();

  chrome.debugger.attach({ tabId }, DEBUGGER_PROTOCOL_VERSION, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      debuggerAttached = false;
      captureActive = false;
      return;
    }

    chrome.debugger.sendCommand({ tabId }, 'Network.enable', {}, () => {
      if (chrome.runtime.lastError) {
        console.warn(chrome.runtime.lastError.message);
      }
      scheduleCaptureStop(tabId);
    });
  });
}

function scheduleCaptureStop(tabId) {
  if (captureTimeoutId) clearTimeout(captureTimeoutId);
  captureTimeoutId = setTimeout(() => {
    chrome.debugger.sendCommand({ tabId }, 'Network.disable', () => {
      if (debuggerAttached) {
        stopCapture(tabId);
      }
    });
  }, NETWORK_CAPTURE_TIMEOUT_MS);
}

function stopCapture(tabId) {
  captureActive = false;
  if (captureTimeoutId) {
    clearTimeout(captureTimeoutId);
    captureTimeoutId = null;
  }
  saveAndDetach(tabId);
}

function saveAndDetach(tabId) {
  detachAllTargets(tabId);

  chrome.storage.local.set({ networkRequests: networkLogs }, () => {});
  chrome.storage.local.set({ attachedIframes: attachedTargets }, () => {});

  chrome.windows.create({
    url: chrome.runtime.getURL('results/index.html'),
    type: 'popup',
    height: 800,
    width: 600
  });

  setTimeout(() => {
    networkLogs = {};
  }, 1000);
}

function detachAllTargets(tabId) {
  Object.keys(attachedTargets).forEach((iframeId) => {
    chrome.debugger.sendCommand({ targetId: iframeId }, 'Network.disable', () => {
      chrome.debugger.detach({ targetId: iframeId }, () => {});
    });
  });

  attachedTargets = {};

  chrome.debugger.sendCommand({ tabId }, 'Network.disable', () => {
    chrome.debugger.detach({ tabId }, () => {
      debuggerAttached = false;
    });
  });
}

function attachToPaymentIframes() {
  chrome.debugger.getTargets((targets) => {
    if (!targets) return;

    targets.forEach((target) => {
      if (!target?.url || !target?.id) return;
      if (!PAYMENTS_IFRAME_MATCHERS.some((match) => target.url.includes(match))) return;

      attachedTargets[target.id] = target;
      chrome.debugger.attach({ targetId: target.id }, DEBUGGER_PROTOCOL_VERSION, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        chrome.debugger.sendCommand({ targetId: target.id }, 'Network.enable', {}, () => {});
      });
    });
  });
}

function makeRequestKey(source, requestId) {
  const targetId = source?.targetId ?? source?.tabId ?? 'unknown';
  return `${targetId}:${requestId}`;
}

function captureFullPageScreenshot() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.length) return;
    const tab = tabs[0];

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getFullPageHeight
    }, (results) => {
      if (!results?.[0]) return;
      scrollAndCapture(tab.id, results[0].result);
    });
  });
}

function getFullPageHeight() {
  return document.body.scrollHeight;
}

function scrollAndCapture(tabId, totalHeight, scrollStep = 800) {
  let scrollPos = 0;
  const screenshots = [];

  function captureNext() {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: (y) => window.scrollTo(0, y),
        args: [scrollPos]
      },
      () => {
        setTimeout(() => {
          chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            screenshots.push(dataUrl);
            scrollPos += scrollStep;

            if (scrollPos < totalHeight) {
              captureNext();
            } else {
              mergeAndSaveScreenshot(screenshots);
            }
          });
        }, 500);
      }
    );
  }

  captureNext();
}

function mergeAndSaveScreenshot(screenshots) {
  if (!screenshots.length) return;

  fetch(screenshots[0])
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob))
    .then((firstBitmap) => {
      const width = firstBitmap.width;
      const height = firstBitmap.height;
      const totalHeight = height * screenshots.length;

      const canvas = new OffscreenCanvas(width, totalHeight);
      const ctx = canvas.getContext('2d');

      const bitmapPromises = screenshots.map((dataUrl, index) =>
        fetch(dataUrl)
          .then((response) => response.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            ctx.drawImage(bitmap, 0, index * height);
          })
      );

      return Promise.all(bitmapPromises).then(() => {
        overlayConsoleErrors(ctx, width, totalHeight);
        return canvas.convertToBlob({ type: 'image/png' });
      });
    })
    .then((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        saveImage(reader.result);
      };
      reader.readAsDataURL(blob);
    })
    .catch((error) => console.error('Error during merging:', error));
}

function overlayConsoleErrors(ctx, canvasWidth, canvasHeight) {
  if (!capturedErrors.length) return;

  ctx.fillStyle = '#171717';
  const margin = 10;
  const rectHeight = capturedErrors.length * 24 + 2 * margin;

  ctx.fillRect(0, canvasHeight - rectHeight, canvasWidth, rectHeight);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'top';

  const x = margin;
  const y = canvasHeight - rectHeight + margin;

  capturedErrors.forEach((error, index) => {
    ctx.fillText(JSON.stringify(error), x, y + index * 24);
  });
}

function saveImage(blobUrl) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.length) return;
    const tabUrl = tabs[0].url;
    try {
      const urlObj = new URL(tabUrl);
      const domain = urlObj.hostname;
      chrome.downloads.download({
        url: blobUrl,
        filename: `${domain}_screenshot.png`,
        saveAs: true
      });
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
  });
}
