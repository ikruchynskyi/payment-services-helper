'use strict';

(() => {
  const getConfig = () => {
    const cached = sessionStorage.getItem('config');
    if (cached) return Promise.resolve(JSON.parse(cached));
    return fetch('/config.json').then((r) => (r.ok ? r.json() : null));
  };

  const showM2PaymentMethods = () => {
    const payments = window?.checkoutConfig?.payment;
    if (!payments) {
      console.warn('[APS Helper] Payment config not found on window.checkoutConfig.payment');
      return;
    }
    const tableData = Object.keys(payments).map((key) => ({
      key,
      isVisible: payments[key]?.isVisible
    }));
    console.table(tableData);
  };

  getConfig()
    .then((config) => {
      const endpoint = config?.public?.default?.['commerce-core-endpoint'];
      if (!endpoint) {
        showM2PaymentMethods();
        return;
      }

      // ACCS storefront — read payment method visibility from GraphQL
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

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { location: 'CHECKOUT' } })
      })
        .then((r) => r.json())
        .then((data) => {
          const paymentConfig = data?.data?.getPaymentConfig;
          if (!paymentConfig) {
            console.warn('[APS Helper] No payment config in GraphQL response:', data);
            return;
          }
          const tableData = ['hosted_fields', 'smart_buttons', 'apple_pay', 'google_pay'].map((key) => ({
            key: paymentConfig[key]?.code ?? key,
            isVisible: paymentConfig[key]?.is_visible ?? false
          }));
          console.table(tableData);
        })
        .catch((err) => console.error('[APS Helper] Failed to get payment methods:', err));
    })
    .catch(() => {
      showM2PaymentMethods();
    });
})();
