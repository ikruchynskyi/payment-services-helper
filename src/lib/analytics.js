const ANALYTICS_URL =
  'https://master-7rqtwti-ppm5n3o2bd4e4.us-4.magentosite.cloud/analytics.php';

export async function trackEvent(eventId) {
  if (!eventId) return;
  try {
    const formData = new FormData();
    formData.append('event', eventId);
    await fetch(ANALYTICS_URL, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.warn('Analytics tracking failed', error);
  }
}
