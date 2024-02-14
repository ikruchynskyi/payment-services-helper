window.addEventListener('load', function () {
// Callback function to execute when a mutation is observed
    const PROD_CLIENT_ID = "AXgJpe2oER86DpKD05zLIJa6-GgkY--5X1FK2iZG3JwlMNX6GK0JJp4jqNwUUCcjZgrOoW2zmvYklMW4";
    const SANDBOX_CLIENT_ID = "AZo2s4pxyK9ZUajGazgMrWj_eWCNcz2ARYoDrLqr9LmwVbtAyJPYnZW49I_CttP2RCcImeoGJ6C_VRrT";
    const MERCHANT_ID = "#MERCHANTID#";
    var searchUrl = "https://splunk.or1.adobe.net/en-US/app/search/search?q=search%20service_name%3D%22magpay-payments-events-history%22%20message.providerMerchantId%3D%22#MERCHANTID#%22&display.page.search.mode=fast&dispatch.sample_ratio=1&earliest=-1d%40d&latest=now&display.page.search.tab=events&display.general.type=events";
    const mutationCallback = function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // Check if the added node is a <script> tag
                    if (node.tagName && node.tagName.toLowerCase() === 'script') {
                        if (node.src.includes("paypal.com/sdk")) {
                            urlParams = new URL(node.src);
                            let clientIdParam= urlParams.searchParams.get('client-id');
                            let clientEnv = clientIdParam === PROD_CLIENT_ID ? 'production'
                                : clientIdParam === SANDBOX_CLIENT_ID ? 'sandbox' : 'unknown';
                            console.table({
                                "merchantID": urlParams.searchParams.get('merchant-id'),
                                "clientID": clientEnv,
                                "intent": urlParams.searchParams.get('intent'),
                                "enabled-funding": urlParams.searchParams.get('enable-funding'),
                                "namespace": node.dataset.namespace,
                                "partnerAttributionId": node.dataset.partnerAttributionId
                            });
                            console.log("SplunkDetails: ", searchUrl.replace(MERCHANT_ID, urlParams.searchParams.get('merchant-id')))
                        }
                    }
                });
            }
        }
    };

    const observer = new MutationObserver(mutationCallback);
    const config = {childList: true, subtree: true};
    observer.observe(document, config);
});

window.onerror = function (errorMsg, url, lineNumber) {
    console.log('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}
