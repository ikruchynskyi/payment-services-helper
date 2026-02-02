import {
  buildApplePayCertUrl,
  buildPaymentsConfigUrl,
  buildPayPalSdkCheckUrl,
  buildWikiSearchUrl
} from './urls.js';

describe('urls helpers', () => {
  const tabConfig = {
    url: new URL('https://example.com/path'),
    domain: 'example.com'
  };

  it('builds wiki search url with encoded query', () => {
    const url = buildWikiSearchUrl('payment services');
    expect(url).toContain('payment%20services');
  });

  it('builds payments config url for location', () => {
    const url = buildPaymentsConfigUrl(tabConfig, 'checkout');
    expect(url).toBe('https://example.com/rest/V1/payments-config/CHECKOUT');
  });

  it('builds apple pay cert url', () => {
    const url = buildApplePayCertUrl(tabConfig);
    expect(url).toBe(
      'https://example.com/.well-known/apple-developer-merchantid-domain-association'
    );
  });

  it('builds PayPal sdk check url', () => {
    const url = buildPayPalSdkCheckUrl(tabConfig);
    expect(url).toBe('https://example.com/customer/section/load/?sections=payments');
  });
});
