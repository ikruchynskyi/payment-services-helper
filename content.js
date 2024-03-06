window.addEventListener('load', function () {
// Callback function to execute when a mutation is observed
    const PROD_CLIENT_ID = "AXgJpe2oER86DpKD05zLIJa6-GgkY--5X1FK2iZG3JwlMNX6GK0JJp4jqNwUUCcjZgrOoW2zmvYklMW4";
    const SANDBOX_CLIENT_ID = "AZo2s4pxyK9ZUajGazgMrWj_eWCNcz2ARYoDrLqr9LmwVbtAyJPYnZW49I_CttP2RCcImeoGJ6C_VRrT";
    const MERCHANT_ID = "#MERCHANTID#";
    let recentTransaction = "https://splunk.or1.adobe.net/en-US/app/search/search?q=search%20service_name%3D%22magpay-payments-events-history%22%20message.providerMerchantId%3D%22#MERCHANTID#%22%20%7C%20table%20message.timestamp%20message.mpTransactionId%20message.mpOrderId%20message.amount%20message%2Ccurrency%20message.mpParentTransactionId%20messag.cardBrand%20message.cardLastDigits%20message.mpMerchantId%20message.providerMerchantId%20message.type%20message.errorResponse%20message.issue%20message.processorResponseCode&display.page.search.mode=fast&dispatch.sample_ratio=1&earliest=-1d%40d&latest=now&display.page.search.tab=statistics&display.general.type=statistics";
    let webHookList = "]https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=statistics&display.general.type=statistics&q=search%20#MERCHANTID#%20Webhook%20%7C%20table%20message.timestamp%20message.message"
    let latestErrors = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.level!%3D%22INFO%22&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=events&display.general.type=events"
    let ingressRequests = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20%5Bsearch%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.trace_id!%3D%22%22%20%7C%20table%20message.trace_id%5D%20INGRESS%20%7C%20table%20message.timestamp%20message.message.remote%20message.message.requestPath%20message.message.requestMethod%20message.message.requestPath%20message.trace_id%20message.requestId%20message.message.headers.host%20message.message.headers.magento-api-key%20message.message.headers.x-request-user-agent%20message.message.headers.x-gw-metadata&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=list&display.page.search.tab=statistics&display.general.type=statistics"
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
                            console.log("Recent Transactions: ", recentTransaction.replace(MERCHANT_ID, urlParams.searchParams.get('merchant-id')))
                            console.log("Recent Webhook events: ", webHookList.replace(MERCHANT_ID, urlParams.searchParams.get('merchant-id')))
                            console.log("Latest errors: ", latestErrors.replace(MERCHANT_ID, urlParams.searchParams.get('merchant-id')))
                            console.log("Ingress requests: ", ingressRequests.replace(MERCHANT_ID, urlParams.searchParams.get('merchant-id')))

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
