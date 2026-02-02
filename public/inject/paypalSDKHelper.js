'use strict';

(() => {
  const PAYPAL_SDK_PREFIX = 'https://www.paypal.com/sdk/js';
  const PAYMENTS_PATH = '/customer/section/load?sections=payments';
  const NAMESPACE = 'apsHelperPaypal';

  const findFirstSdkString = (obj) => {
    const stack = [obj];
    while (stack.length) {
      const current = stack.shift();
      if (typeof current === 'string' && current.startsWith(PAYPAL_SDK_PREFIX)) return current;
      if (Array.isArray(current)) {
        current.forEach((item) => stack.push(item));
      } else if (current && typeof current === 'object') {
        Object.values(current).forEach((value) => stack.push(value));
      }
    }
    return null;
  };

  const cleanSdkUrl = (urlStr) => {
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
  };

  const generateRandomToken = (length = 20) => {
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
  };

  const injectPaypal = (cleanUrl) => {
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
  };

  const run = async () => {
    try {
      const response = await fetch(window.location.origin + PAYMENTS_PATH, {
        credentials: 'same-origin'
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      const sdkUrl = findFirstSdkString(json);
      if (!sdkUrl) {
        console.error('No PayPal SDK URL found in JSON:', json);
        return;
      }

      const cleanUrl = cleanSdkUrl(sdkUrl);
      injectPaypal(cleanUrl);
    } catch (err) {
      console.error('Failed to fetch payments JSON or parse:', err);
    }
  };

  run();
})();
