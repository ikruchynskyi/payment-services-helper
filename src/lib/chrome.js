export async function getActiveTabConfig() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs?.[0];
  if (!tab?.url) return null;
  const url = new URL(tab.url);

  let isAccs = false;
  try {
    const config = await fetch(`${url.protocol}//${url.hostname}/config.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    isAccs = Boolean(config?.public?.default?.['commerce-core-endpoint']);
  } catch {
    isAccs = false;
  }

  return {
    activeTab: tab,
    activeTabUrl: tab.url,
    url,
    domain: url.hostname,
    isAccs,
  };
}

export function sendToActiveTab(tabId, message) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, message);
}

export function openPopupWindow(path, options = {}) {
  chrome.windows.create({
    url: chrome.runtime.getURL(path),
    type: 'popup',
    height: options.height || 800,
    width: options.width || 600
  });
}

export function openNewTab(url) {
  if (!url) return;
  chrome.tabs.create({ url });
}
