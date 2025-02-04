const PROD_CLIENT_ID = "AXgJpe2oER86DpKD05zLIJa6-GgkY--5X1FK2iZG3JwlMNX6GK0JJp4jqNwUUCcjZgrOoW2zmvYklMW4";
const SANDBOX_CLIENT_ID = "AZo2s4pxyK9ZUajGazgMrWj_eWCNcz2ARYoDrLqr9LmwVbtAyJPYnZW49I_CttP2RCcImeoGJ6C_VRrT";
const MERCHANT_ID = "#MERCHANTID#";
const RANDOM_PRODUCT_SEAARCH = "/rest/V1/products-render-info?searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bfield%5D=type_id&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bvalue%5D=simple&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5BconditionType%5D=eq&searchCriteria%5BpageSize%5D=1&searchCriteria%5BcurrentPage%5D=0&storeId=0&currencyCode=*";

var recentTransaction = "https://splunk.or1.adobe.net/en-US/app/search/search?q=search%20service_name%3D%22magpay-payments-events-history%22%20message.providerMerchantId%3D%22#MERCHANTID#%22%20%7C%20table%20message.timestamp%20message.mpTransactionId%20message.mpOrderId%20message.amount%20message.currency%20message.mpParentTransactionId%20messag.cardBrand%20message.cardLastDigits%20message.mpMerchantId%20message.providerMerchantId%20message.type%20message.errorResponse%20message.issue%20message.processorResponseCode&display.page.search.mode=fast&dispatch.sample_ratio=1&earliest=-1d%40d&latest=now&display.page.search.tab=statistics&display.general.type=statistics";
var webHookList = "]https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=statistics&display.general.type=statistics&q=search%20#MERCHANTID#%20Webhook%20%7C%20table%20message.timestamp%20message.message";
var latestErrors = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.level!%3D%22INFO%22&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=raw&display.page.search.tab=events&display.general.type=events";
var ingressRequests = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20%5Bsearch%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20table%20message.mpMerchantId%20%7C%20uniq%5D%20message.trace_id!%3D%22%22%20%7C%20table%20message.trace_id%5D%20INGRESS%20%7C%20table%20message.timestamp%20message.message.remote%20message.message.requestPath%20message.message.requestMethod%20message.message.requestPath%20message.trace_id%20message.requestId%20message.message.headers.host%20message.message.headers.magento-api-key%20message.message.headers.x-request-user-agent%20message.message.headers.x-gw-metadata&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.events.type=list&display.page.search.tab=statistics&display.general.type=statistics";
var transactionStat = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20#MERCHANTID#%20message.providerTransactionId!%3Dnull%20%7C%20table%20message.type%20message.amount%20%7C%20stats%20sum(message.amount)%20by%20message.type&display.page.search.mode=fast&dispatch.sample_ratio=1&display.page.search.tab=visualizations&display.general.type=visualizations&display.visualizations.charting.chart=pie";
var debugIds = "https://splunk.or1.adobe.net/en-US/app/search/search?earliest=-1d%40d&latest=now&q=search%20%5Bsearch%20#MERCHANTID#%20message.mpMerchantId!%3D%22%22%20%7C%20rename%20message.mpMerchantId%20%20AS%20message.merchantId%20%7C%20table%20message.merchantId%20%7C%20dedup%20message.merchantId%5D%20PayPalPaymentService%20message.debugId!%3D%22%22%20%7C%20table%20message.debugId&display.page.search.mode=verbose&dispatch.sample_ratio=1&display.page.search.tab=statistics&display.general.type=statistics"
var merchantId;


printSDKHelperInfo = (src) => {
    let urlParams = new URL(src);
    let clientIdParam = urlParams.searchParams.get('client-id');
    let clientEnv = clientIdParam === PROD_CLIENT_ID ? 'production'
        : clientIdParam === SANDBOX_CLIENT_ID ? 'sandbox' : 'unknown';
    merchantId = urlParams.searchParams.get('merchant-id');
    console.table({
        "merchantID": merchantId,
        "clientID": clientEnv,
        "intent": urlParams.searchParams.get('intent'),
        "enabled-funding": urlParams.searchParams.get('enable-funding'),
    });
};

printSplunkLinks = () => {
    console.log("Recent Transactions: ", recentTransaction.replace(MERCHANT_ID, merchantId));
    console.log("Recent Webhook events: ", webHookList.replace(MERCHANT_ID, merchantId));
    console.log("Latest errors: ", latestErrors.replace(MERCHANT_ID, merchantId));
    console.log("Ingress requests: ", ingressRequests.replace(MERCHANT_ID, merchantId));
    console.log("Transaction stats:", transactionStat.replace(MERCHANT_ID, merchantId));
    console.log("Latest PayPal DebugIds: :", debugIds.replace(MERCHANT_ID, merchantId));
}

window.addEventListener('load', function () {
    const mutationCallback = function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName && node.tagName.toLowerCase() === 'script') {
                        if (node.src.includes("paypal.com/sdk")) {
                            printSDKHelperInfo(node.src)
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

chrome.runtime.onMessage.addListener(
    function (request) {
        if (request.message === "checkEnabledPaymentMethods") {
            if (document.apsBorderAdded === true) {
                let elements = document.getElementsByClassName("animated-border");
                while (elements.length > 0) {
                    elements[0].classList.remove('animated-border');
                }
                document.apsBorderAdded = false;
                return;
            }

            var css = '.animated-border { border: 2px solid red !important;}',
                head = document.head || document.getElementsByTagName('head')[0],
                style = document.createElement('style');
            head.appendChild(style);
            style.appendChild(document.createTextNode(css));


            let paymentMethods = document.getElementsByName("payment[method]");
            let smartButtons = document.getElementsByClassName("smart-buttons");


            for (let i in Object.keys(paymentMethods)) {
                if (paymentMethods[i].getAttribute("id").includes("payment_services")) {
                    paymentMethods[i].parentElement.classList.add("animated-border");
                    document.apsBorderAdded = true;
                }
            }

            for (let i in Object.keys(smartButtons)) {
                smartButtons[i].classList.add("animated-border");
                document.apsBorderAdded = true;
            }
        }

        if (request.message === "printSDKHelper") {
            for (const [key, data] of Object.entries(request.data.payments.sdkParams)) {
                console.log('SDK Params for ' + key);
                if (data[0]) {
                    src = data[0].value
                } else {
                    src = data.value
                }
                printSDKHelperInfo(src);
            }
            printSplunkLinks();
        }

        if (request.message === "getPaymentMethods") {
            injectScript(chrome.runtime.getURL('inject/getCheckoutPayments.js'), 'body');
        }

        if (request.message === "isHyva") {
            injectScript(chrome.runtime.getURL('inject/isHyva.js'), 'body');
        }

        if (request.message === "getMixins") {
            injectScript(chrome.runtime.getURL('inject/getMixins.js'), 'body');
        }

        if (request.message === "clickAddToCart") {
            document.getElementById("product_addtocart_form").querySelectorAll("[type=submit]")[0].click();
            window.open(window.origin + "/checkout/index","_self")
        }

        if (request.message === "fastCheckout") {
            let newUrl = window.origin + RANDOM_PRODUCT_SEAARCH;
            fetch(newUrl)
                .then(response => response.text())
                .then(data => {
                    data = JSON.parse(data);
                    window.location.href = window.origin + "/catalog/product/view/id/" + data["items"][0]["id"] + "/#from-helper";
                })
                .catch(error => {
                    console.error('Error fetching:', error);
                    alert("Fast checkout is not possible :(");
                });
        }
    }
);

window.onerror = function (errorMsg, url, lineNumber) {
    console.log('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}

function injectScript(file_path, tag) {
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].getAttribute('src') === file_path) {
            return;
        }
    }

    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}
