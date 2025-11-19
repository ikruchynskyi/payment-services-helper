(function () {
    const PAYPAL_SDK_PREFIX = 'https://www.paypal.com/sdk/js';
    const PAYMENTS_PATH = '/customer/section/load?sections=payments';

    // Recursively find first PayPal SDK URL in JSON
    function findFirstSdkString(obj) {
        const stack = [obj];
        while (stack.length) {
            const cur = stack.shift();
            if (typeof cur === 'string' && cur.startsWith(PAYPAL_SDK_PREFIX)) return cur;
            if (Array.isArray(cur)) cur.forEach(item => stack.push(item));
            else if (cur && typeof cur === 'object') Object.values(cur).forEach(v => stack.push(v));
        }
        return null;
    }

    // Keep only desired params and force components=hosted-fields
    function cleanSdkUrl(urlStr) {
        try {
            const url = new URL(urlStr);
            const sp = url.searchParams;
            const keep = new Set(['client-id', 'intent', 'locale', 'merchant-id', 'currency', 'components']);
            const newSp = new URLSearchParams();

            for (const [k, v] of sp.entries()) {
                if (keep.has(k)) newSp.set(k, v);
            }

            // Force hosted-fields
            newSp.set('components', 'hosted-fields');

            url.search = newSp.toString();
            return url.toString();
        } catch (err) {
            console.error('Failed to clean PayPal SDK URL:', err);
            return urlStr;
        }
    }

    // Generate a random string for data-client-token
    function generateRandomToken(length = 20) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // Inject PayPal SDK with namespace apsHelperPaypal and random client token
    function injectPaypal(cleanUrl, originalUrl) {
        const script = document.createElement('script');
        script.src = cleanUrl;
        script.async = true;
        script.setAttribute('data-namespace', 'apsHelperPaypal');
        script.setAttribute('data-client-token', generateRandomToken());

        script.onload = function () {
            console.log('Injected script.src:', cleanUrl);
            try {
                const ns = window.apsHelperPaypal;
                if (ns && ns.HostedFields && typeof ns.HostedFields.isEligible === 'function') {
                    console.log('HostedFields.isEligible():', ns.HostedFields.isEligible());
                } else {
                    console.warn('HostedFields.isEligible() not available on window.apsHelperPaypal.');
                }
            } catch (err) {
                console.error('Error calling HostedFields.isEligible():', err);
            }
        };

        script.onerror = () => console.error('Failed to load PayPal SDK script:', cleanUrl);
        (document.head || document.documentElement).appendChild(script);
    }

    // Main flow
    fetch(window.location.origin + PAYMENTS_PATH, { credentials: 'same-origin' })
        .then(res => {
            if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
            return res.json();
        })
        .then(json => {
            const sdkUrl = findFirstSdkString(json);
            if (!sdkUrl) {
                console.error('No PayPal SDK URL found in JSON:', json);
                return;
            }

            const cleanUrl = cleanSdkUrl(sdkUrl);
            injectPaypal(cleanUrl, sdkUrl);
        })
        .catch(err => console.error('Failed to fetch/payments JSON or parse:', err));
})();
