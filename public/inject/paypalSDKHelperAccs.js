'use strict';

(() => {
  const PROD_CLIENT_ID =
    'AXgJpe2oER86DpKD05zLIJa6-GgkY--5X1FK2iZG3JwlMNX6GK0JJp4jqNwUUCcjZgrOoW2zmvYklMW4';
  const SANDBOX_CLIENT_ID =
    'AZo2s4pxyK9ZUajGazgMrWj_eWCNcz2ARYoDrLqr9LmwVbtAyJPYnZW49I_CttP2RCcImeoGJ6C_VRrT';
  const MERCHANT_ID_PLACEHOLDER = '#MERCHANTID#';
  const NAMESPACE = 'apsHelperPaypal';

  const splunkUrls = {
    recentTransaction:
      'https://splunk.or1.adobe.net/en-US/app/search/search?q=search%20index%3Ddx_magento_payments_prod%20service_name%3D%22magpay-payments-events-history%22%20message.providerMerchantId%3D%22#MERCHANTID#%22%20%7C%20table%20message.timestamp%20message.mpTransactionId%20message.mpOrderId%20message.amount%20message.currency%20message.mpParentTransactionId%20messag.cardBrand%20message.cardLastDigits%20message.mpMerchantId%20message.providerMerchantId%20message.type%20message.errorResponse%20message.issue%20message.processorResponseCode&display.page.search.mode=fast&dispatch.sample_ratio=1&earliest=-1d%40d&latest=now&display.page.search.tab=statistics&display.general.type=statistics',
    webHookList:
      'https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=statistics&display.general.type=statistics&q=search%20index%3Ddx_magento_payments_prod%20#MERCHANTID#%20Webhook%20%7C%20table%20message.timestamp%20message.message',
    latestErrors:
      'https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20index%3Ddx_magento_payments_prod%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.level!%3D%22INFO%22&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=events&display.general.type=events',
    ingressRequests:
      'https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20index%3Ddx_magento_payments_prod%20%5Bsearch%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.trace_id!%3D%22%22%20%7C%20table%20message.trace_id%5D%20INGRESS%20%7C%20table%20message.timestamp%20message.message.remote%20message.message.requestPath%20message.message.requestMethod%20message.message.requestPath%20message.trace_id%20message.requestId%20message.message.headers.host%20message.message.headers.magento-api-key%20message.message.headers.x-request-user-agent%20message.message.headers.x-gw-metadata&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=list&display.page.search.tab=statistics&display.general.type=statistics',
    transactionStat:
      'https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20index%3Ddx_magento_payments_prod%20#MERCHANTID#%20message.providerTransactionId!%3Dnull%20%7C%20table%20message.type%20message.amount%20%7C%20stats%20sum(message.amount)%20by%20message.type&display.page.search.mode=fast&dispatch.sample_ratio=1&display.page.search.tab=visualizations&display.general.type=visualizations&display.visualizations.charting.chart=pie',
    debugIds:
      'https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20index%3Ddx_magento_payments_prod%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20rename%20message.mpMerchantId%20%20AS%20message.merchantId%20%7C%20table%20message.merchantId%20%7C%20dedup%20message.merchantId%5D%20PayPalPaymentService%20message.debugId!%3D%22%22%20%7C%20table%20message.debugId&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.page.search.tab=statistics&display.general.type=statistics'
  };

  const GET_PAYMENT_CONFIG_QUERY = `
    query GetPaymentConfig($location: PaymentLocation!) {
      getPaymentConfig(location: $location) {
        hosted_fields { sdk_params { name value } is_visible }
        smart_buttons { sdk_params { name value } is_visible }
      }
    }
  `;

  let merchantId;

  async function getConfig() {
    const cached = sessionStorage.getItem('config');
    if (cached) return JSON.parse(cached);
    return fetch('/config.json').then((r) => r.json());
  }

  async function getCommerceEndpoint() {
    const config = await getConfig();
    return config?.public?.default?.['commerce-core-endpoint'];
  }

  async function fetchPaymentConfig(endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_PAYMENT_CONFIG_QUERY, variables: { location: 'CHECKOUT' } })
    });
    if (!response.ok) throw new Error(`GraphQL ${response.status}`);
    return response.json();
  }

  function findSdkSrc(sdkParams) {
    return sdkParams?.find((p) => p.name === 'src')?.value;
  }

  function printSDKHelperInfo(src) {
    try {
      const urlParams = new URL(src);
      const clientIdParam = urlParams.searchParams.get('client-id');
      const clientEnv =
        clientIdParam === PROD_CLIENT_ID
          ? 'production'
          : clientIdParam === SANDBOX_CLIENT_ID
            ? 'sandbox'
            : 'unknown';
      merchantId = urlParams.searchParams.get('merchant-id');

      console.table({
        merchantID: merchantId,
        clientID: clientEnv,
        intent: urlParams.searchParams.get('intent'),
        'enabled-funding': urlParams.searchParams.get('enable-funding'),
        'disable-funding': urlParams.searchParams.get('disable-funding'),
        components: urlParams.searchParams.get('components'),
      });
    } catch (err) {
      console.warn('Failed to parse PayPal SDK URL:', err);
    }
  }

  function printSplunkLinks() {
    if (!merchantId) {
      console.warn('Merchant ID not found. Splunk links not generated.');
      return;
    }
    console.log('Recent Transactions: ', splunkUrls.recentTransaction.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
    console.log('Recent Webhook events: ', splunkUrls.webHookList.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
    console.log('Latest errors: ', splunkUrls.latestErrors.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
    console.log('Ingress requests: ', splunkUrls.ingressRequests.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
    console.log('Transaction stats:', splunkUrls.transactionStat.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
    console.log('Latest PayPal DebugIds:', splunkUrls.debugIds.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
  }

  function cleanSdkUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      const sp = url.searchParams;
      const keep = new Set(['client-id', 'intent', 'locale', 'merchant-id', 'currency', 'components']);
      const newSp = new URLSearchParams();
      for (const [key, value] of sp.entries()) {
        if (keep.has(key)) newSp.set(key, value);
      }
      newSp.set('components', 'hosted-fields');
      url.search = newSp.toString();
      return url.toString();
    } catch (err) {
      console.error('Failed to clean PayPal SDK URL:', err);
      return urlStr;
    }
  }

  function generateRandomToken(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(length);
      window.crypto.getRandomValues(values);
      return Array.from(values, (value) => chars[value % chars.length]).join('');
    }
    let token = '';
    for (let i = 0; i < length; i += 1) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  function injectPaypal(cleanUrl) {
    if (document.querySelector(`script[data-namespace="${NAMESPACE}"]`)) return;

    const script = document.createElement('script');
    script.src = cleanUrl;
    script.async = true;
    script.setAttribute('data-namespace', NAMESPACE);
    script.setAttribute('data-client-token', generateRandomToken());

    script.addEventListener('load', () => {
      console.log('Injected script.src:', cleanUrl);
      try {
        const ns = window[NAMESPACE];
        if (ns?.HostedFields && typeof ns.HostedFields.isEligible === 'function') {
          console.log('HostedFields.isEligible():', ns.HostedFields.isEligible());
        } else {
          console.warn(`HostedFields.isEligible() not available on window.${NAMESPACE}.`);
        }
      } catch (err) {
        console.error('Error calling HostedFields.isEligible():', err);
      }
    });

    script.addEventListener('error', () => {
      console.error('Failed to load PayPal SDK script:', cleanUrl);
    });

    (document.head || document.documentElement).appendChild(script);
  }

  const run = async () => {
    try {
      const endpoint = await getCommerceEndpoint();
      if (!endpoint) {
        console.error('[APS Helper] commerce-core-endpoint not found in /config.json');
        return;
      }

      const data = await fetchPaymentConfig(endpoint);
      const config = data?.data?.getPaymentConfig;
      if (!config) {
        console.error('[APS Helper] No payment config in GraphQL response:', data);
        return;
      }

      // Prefer hosted_fields SDK URL; fall back to smart_buttons
      const sdkUrl =
        findSdkSrc(config.hosted_fields?.sdk_params) ||
        findSdkSrc(config.smart_buttons?.sdk_params);

      if (!sdkUrl) {
        console.error('[APS Helper] No PayPal SDK URL found in GetPaymentConfig response:', config);
        return;
      }

      printSDKHelperInfo(sdkUrl);
      injectPaypal(cleanSdkUrl(sdkUrl));
      printSplunkLinks();
    } catch (err) {
      console.error('[APS Helper] Failed to check PayPal SDK:', err);
    }
  };

  run();
})();
