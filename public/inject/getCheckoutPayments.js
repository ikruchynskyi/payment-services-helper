'use strict';

(() => {
  // ACCS storefront — read payment method visibility from GraphQL
  if (typeof window.DROPINS !== 'undefined') {
    const query = `
      query GetPaymentConfig($location: PaymentLocation!) {
        getPaymentConfig(location: $location) {
          hosted_fields { code is_visible }
          smart_buttons { code is_visible }
          apple_pay { code is_visible }
          google_pay { code is_visible }
        }
      }
    `;

    const getConfig = () => {
      const cached = sessionStorage.getItem('config');
      if (cached) return Promise.resolve(JSON.parse(cached));
      return fetch('/config.json').then((r) => r.json());
    };

    getConfig()
      .then((config) => {
        const endpoint = config?.public?.default?.['commerce-core-endpoint'];
        if (!endpoint) throw new Error('commerce-core-endpoint not found in /config.json');
        return fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { location: 'CHECKOUT' } })
        });
      })
      .then((r) => r.json())
      .then((data) => {
        const config = data?.data?.getPaymentConfig;
        if (!config) {
          console.warn('[APS Helper] No payment config in response:', data);
          return;
        }
        const tableData = ['hosted_fields', 'smart_buttons', 'apple_pay', 'google_pay']
          .map((key) => ({ key: config[key]?.code ?? key, isVisible: config[key]?.is_visible ?? false }));
        console.table(tableData);
      })
      .catch((err) => console.error('[APS Helper] Failed to get payment methods:', err));

    return;
  }

  // Magento 2 theme
  const payments = window?.checkoutConfig?.payment;
  if (!payments) {
    console.warn('Payment config not found on window.checkoutConfig.payment');
    return;
  }

  const tableData = Object.keys(payments).map((key) => ({
    key,
    isVisible: payments[key]?.isVisible
  }));
  console.table(tableData);
})();
