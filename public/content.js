'use strict';

(() => {
  const PROD_CLIENT_ID =
    'AXgJpe2oER86DpKD05zLIJa6-GgkY--5X1FK2iZG3JwlMNX6GK0JJp4jqNwUUCcjZgrOoW2zmvYklMW4';
  const SANDBOX_CLIENT_ID =
    'AZo2s4pxyK9ZUajGazgMrWj_eWCNcz2ARYoDrLqr9LmwVbtAyJPYnZW49I_CttP2RCcImeoGJ6C_VRrT';
  const MERCHANT_ID_PLACEHOLDER = '#MERCHANTID#';
  const RANDOM_PRODUCT_SEARCH =
    '/rest/V1/products-render-info?searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bfield%5D=type_id&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bvalue%5D=simple&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5BconditionType%5D=eq&searchCriteria%5BpageSize%5D=1&searchCriteria%5BcurrentPage%5D=0&storeId=0&currencyCode=*';

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

  let merchantId;
  let borderAdded = false;

  const errors = [];
  const errorsLimit = 100;

  function handleNewError(error) {
    const lastError = errors[errors.length - 1];
    const isSameAsLast =
      lastError &&
      lastError.text === error.text &&
      lastError.url === error.url &&
      lastError.line === error.line &&
      lastError.col === error.col;
    const isWrongUrl = !error.url || !error.url.includes('://');

    if (!isSameAsLast && !isWrongUrl) {
      errors.push(error);
      if (errors.length > errorsLimit) {
        errors.shift();
      }
      chrome.runtime.sendMessage({
        message: 'ERROR_LOGGED',
        error,
        url: window.top.location.href
      });
    }
  }

  function setupErrorLogging() {
    injectScript(chrome.runtime.getURL('inject/errorLogger.js'), 'head');

    document.addEventListener('ErrorToExtension', (event) => {
      const error = event.detail;
      if (error) handleNewError(error);
    });
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
        'enabled-funding': urlParams.searchParams.get('enable-funding')
      });
    } catch (error) {
      console.warn('Failed to parse PayPal SDK URL:', error);
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
    console.log('Latest PayPal DebugIds: :', splunkUrls.debugIds.replace(MERCHANT_ID_PLACEHOLDER, merchantId));
  }

  function observePaypalScripts() {
    const mutationCallback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node?.tagName?.toLowerCase() === 'script' && node.src.includes('paypal.com/sdk')) {
              printSDKHelperInfo(node.src);
            }
          });
        }
      }
    };

    const observer = new MutationObserver(mutationCallback);
    observer.observe(document, { childList: true, subtree: true });
  }

  function ensureBorderStyles() {
    if (document.getElementById('aps-helper-border-style')) return;
    const style = document.createElement('style');
    style.id = 'aps-helper-border-style';
    style.textContent = '.animated-border { border: 2px solid red !important; }';
    document.head?.appendChild(style);
  }

  function togglePaymentBorders() {
    if (borderAdded) {
      document.querySelectorAll('.animated-border').forEach((element) => {
        element.classList.remove('animated-border');
      });
      borderAdded = false;
      return;
    }

    ensureBorderStyles();

    const paymentMethods = document.getElementsByName('payment[method]');
    for (const method of paymentMethods) {
      if (method?.id?.includes('payment_services')) {
        method.parentElement?.classList.add('animated-border');
        borderAdded = true;
      }
    }

    const smartButtons = document.getElementsByClassName('smart-buttons');
    for (const button of smartButtons) {
      button.classList.add('animated-border');
      borderAdded = true;
    }
  }

  function handlePrintSdkHelper(data) {
    const sdkParams = data?.payments?.sdkParams;
    if (!sdkParams) {
      console.warn('No SDK params found in response.');
      return;
    }

    Object.entries(sdkParams).forEach(([key, value]) => {
      console.log(`SDK Params for ${key}`);
      const sdkValue = Array.isArray(value) ? value?.[0]?.value : value?.value;
      if (sdkValue) {
        printSDKHelperInfo(sdkValue);
      }
    });

    injectScript(chrome.runtime.getURL('inject/paypalSDKHelper.js'), 'body');
    printSplunkLinks();
  }

  function handleFastCheckout() {
    const newUrl = `${window.origin}${RANDOM_PRODUCT_SEARCH}`;
    fetch(newUrl)
      .then((response) => response.json())
      .then((data) => {
        const productId = data?.items?.[0]?.id;
        if (!productId) {
          alert('Fast checkout is not possible :(');
          return;
        }
        window.location.href = `${window.origin}/catalog/product/view/id/${productId}/#from-helper`;
      })
      .catch((error) => {
        console.error('Error fetching:', error);
        alert('Fast checkout is not possible :(');
      });
  }

  function waitForAddToCart({ clearHash = false } = {}) {
    const maxAttempts = 40;
    let attempts = 0;

    const timer = setInterval(() => {
      const form = document.getElementById('product_addtocart_form');
      const submitButton =
        form?.querySelector('[type=submit]') ||
        document.querySelector('#product-addtocart-button');
      const ready = submitButton && !submitButton.disabled && submitButton.offsetParent !== null;

      if (ready) {
        clearInterval(timer);
        if (form?.requestSubmit) {
          form.requestSubmit(submitButton);
        } else {
          submitButton.click();
        }

        if (clearHash) {
          const cleanedUrl = window.location.href.replace('#from-helper', '');
          history.replaceState({}, '', cleanedUrl);
        }
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn('Add to cart button not found or not ready.');
      }
    }, 300);
  }

  function handleClickAddToCart() {
    waitForAddToCart();
  }

  function maybeAutoAddToCart() {
    if (window.location.hash.includes('from-helper')) {
      waitForAddToCart({ clearHash: true });
    }
  }

  function handleMessage(request) {
    if (!request?.message) return;

    switch (request.message) {
      case 'checkEnabledPaymentMethods':
        togglePaymentBorders();
        break;
      case 'printSDKHelper':
        handlePrintSdkHelper(request.data);
        break;
      case 'getPaymentMethods':
        injectScript(chrome.runtime.getURL('inject/getCheckoutPayments.js'), 'body');
        break;
      case 'isHyva':
        injectScript(chrome.runtime.getURL('inject/isHyva.js'), 'body');
        break;
      case 'isAEM':
        injectScript(chrome.runtime.getURL('inject/isAEM.js'), 'body');
        break;
      case 'getMixins':
        injectScript(chrome.runtime.getURL('inject/getMixins.js'), 'body');
        break;
      case 'clickAddToCart':
        handleClickAddToCart();
        break;
      case 'fastCheckout':
        handleFastCheckout();
        break;
      default:
        break;
    }
  }

  function injectScript(filePath, tag) {
    const existing = document.querySelector(`script[src="${filePath}"]`);
    if (existing) return;

    const parent = document.getElementsByTagName(tag)[0];
    if (!parent) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = filePath;
    parent.appendChild(script);
  }

  window.addEventListener('DOMContentLoaded', setupErrorLogging);
  window.addEventListener('load', observePaypalScripts);
  window.addEventListener('load', maybeAutoAddToCart);
  chrome.runtime.onMessage.addListener(handleMessage);
})();
