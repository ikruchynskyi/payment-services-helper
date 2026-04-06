import { vi } from 'vitest';
import {
  buildTrackedEventIds,
  getPopupDetectedEventId,
  getStorefrontType,
  trackEvent,
  trackPopupDetection
} from './analytics.js';

describe('analytics helpers', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives storefront type from ACCS tabs', () => {
    expect(getStorefrontType({ domain: 'example.com', isAccs: true })).toBe('accs');
  });

  it('does not mark non-ACCS tabs as storefront-specific analytics contexts', () => {
    expect(getStorefrontType({ domain: 'example.com', isAccs: false })).toBeNull();
  });

  it('builds companion ACCS analytics event ids', () => {
    expect(buildTrackedEventIds('magereport', { domain: 'example.com', isAccs: true })).toEqual([
      'magereport',
      'magereport_accs'
    ]);
  });

  it('keeps non-ACCS events backward compatible', () => {
    expect(buildTrackedEventIds('magereport', { domain: 'example.com', isAccs: false })).toEqual([
      'magereport'
    ]);
  });

  it('builds popup detection events only for ACCS tabs', () => {
    expect(getPopupDetectedEventId({ domain: 'example.com', isAccs: true })).toBe(
      'popupDetectedAccs'
    );
    expect(getPopupDetectedEventId({ domain: 'example.com', isAccs: false })).toBe('');
  });

  it('posts both base and storefront analytics events', async () => {
    await trackEvent('getPayPalSDK', { domain: 'example.com', isAccs: true });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].body.toString()).toBe('event=getPayPalSDK');
    expect(global.fetch.mock.calls[1][1].body.toString()).toBe('event=getPayPalSDK_accs');
  });

  it('posts popup detection analytics events', async () => {
    await trackPopupDetection({ domain: 'example.com', isAccs: true });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].body.toString()).toBe('event=popupDetectedAccs');
  });
});
