const ANALYTICS_URL = 'https://master-7rqtwti-ppm5n3o2bd4e4.us-4.magentosite.cloud/analytics.php';

function postEvent(eventId) {
  if (!eventId) return;
  return fetch(ANALYTICS_URL, {
    method: 'POST',
    body: new URLSearchParams({ event: eventId })
  }).catch((error) => {
    console.warn('Analytics tracking failed', error);
  });
}

export function getStorefrontType(tabConfig) {
  if (tabConfig?.isAccs) return 'accs';
  return null;
}

export function buildTrackedEventIds(eventId, tabConfig) {
  const normalized = String(eventId || '').trim();
  if (!normalized) return [];

  const storefrontType = getStorefrontType(tabConfig);
  if (!storefrontType) return [normalized];

  return Array.from(new Set([normalized, `${normalized}_${storefrontType}`]));
}

export function getPopupDetectedEventId(tabConfig) {
  const storefrontType = getStorefrontType(tabConfig);
  if (!storefrontType) return '';

  return 'popupDetectedAccs';
}

export async function trackEvent(eventId, tabConfig) {
  const eventIds = buildTrackedEventIds(eventId, tabConfig);
  await Promise.all(eventIds.map((id) => postEvent(id)));
}

export async function trackPopupDetection(tabConfig) {
  const eventId = getPopupDetectedEventId(tabConfig);
  await postEvent(eventId);
}
