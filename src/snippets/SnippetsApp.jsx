import React from 'react';

const SNIPPETS = [
  {
    title: 'Get quote object on checkout/cart pages',
    body: `quote = requirejs("Magento_Checkout/js/model/quote")
url = BASE_URL + "rest/default/V1/guest-carts/" + quote.getQuoteId() + "/totals"
res = await fetch(url, {
  "headers": {
    "accept": "*/*",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "method": "GET"
});
body = await res.json()`
  },
  {
    title: 'Check merchant is eligible for GooglePay/ ApplePay',
    body: `if (typeof paypal === 'function' && paypal.Googlepay) {
  console.log('Google Pay');
  paypal.Googlepay().config().then(config => console.log(config));
}
if (typeof paypal === 'function' && paypal.ApplePay) {
  console.log('Apple Pay');
  paypal.Applepay().config().then(config => console.log(config));
}
if (typeof PaymentServicesSDK === 'function') {
  var apssdk = new PaymentServicesSDK({"apiUrl":BASE_URL + "/graphql"});
  apssdk.Payment.init({"location":"CHECKOUT"}).then(() => console.log("Hosted Fields eligible: " + apssdk.Payment.creditCard.creditCard().component.isEligible()));
}`
  }
];

function SnippetsApp() {
  return (
    <div className="snippets-wrapper">
      {SNIPPETS.map((snippet) => (
        <div key={snippet.title} className="snippet-section">
          <h2>{snippet.title}</h2>
          <button
            className="snippet-card"
            onClick={() => navigator.clipboard.writeText(snippet.body)}
            title="Copy snippet"
          >
            <pre>{snippet.body}</pre>
          </button>
        </div>
      ))}
    </div>
  );
}

export default SnippetsApp;
