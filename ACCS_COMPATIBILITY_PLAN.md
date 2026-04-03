# ACCS Storefront Compatibility Plan

## Context

Adobe Commerce Cloud Service (ACCS) introduces a new storefront architecture:

- **Backend:** Magento 2 (cloud-provisioned), exposes REST + GraphQL on a **different domain** than the frontend (e.g. `na1.api.commerce.adobe.com/{storeId}/graphql`).
- **Frontend:** [Adobe Commerce Storefront](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/architecture/) — built on Edge Delivery Services (EDS). No RequireJS, no `window.checkoutConfig`, no Magento session endpoints.
- **Boilerplate:** https://github.com/hlxsites/aem-boilerplate-commerce
- **Payment Services:** Integrated as a [drop-in component](https://experienceleague.adobe.com/developer/commerce/storefront/dropins/payment-services/) (`@dropins/payment-services`). Registered on `window.DROPINS`. Uses **GraphQL** for all payment data — `/customer/section/load` does not exist.
- **Detection signal (already in use):** `typeof window.DROPINS !== 'undefined'` → `inject/isAEM.js`

---

## Phase 1 — Investigation findings (completed 2026-04-03)

Investigated using https://www.optp.com as a live ACCS storefront reference.

### 1.1 ✅ GraphQL query for PayPal SDK parameters

**Confirmed query:** `GetPaymentConfig($location: PaymentLocation!)`

```graphql
query GetPaymentConfig($location: PaymentLocation!) {
  getPaymentConfig(location: $location) {
    hosted_fields {
      code
      sdk_params { name value }
      is_visible
      payment_source
      three_ds_mode
      is_vault_enabled
      cc_vault_code
    }
    smart_buttons {
      code
      sdk_params { name value }
      is_visible
      display_message
      button_styles { layout color shape height label tagline use_default_height }
    }
    apple_pay {
      code
      sdk_params { name value }
      is_visible
    }
    google_pay {
      code
      sdk_params { name value }
      is_visible
    }
  }
}
```

**Variable `location`** — valid values: `CHECKOUT`, `PRODUCT_DETAIL`, `CART`, `MINICART`

**No cart ID required.** Works for any session/page.

**Extracting the PayPal SDK URL:**
```js
const srcParam = response.data.getPaymentConfig.hosted_fields.sdk_params.find(p => p.name === 'src');
const sdkUrl = srcParam.value; // full PayPal SDK URL with client-id, merchant-id, etc.
```

Additional `sdk_params` in `hosted_fields`: `data-partner-attribution-id` (`"Adobe_ACCS_US"`), `data-client-token` (JWT), `data-expires-in` (`3600`).

**Endpoint discovery — `/config.json`:**

Every ACCS storefront exposes a config file at the site root:
```
GET /config.json
```
```json
{
  "public": {
    "default": {
      "commerce-core-endpoint": "https://na1.api.commerce.adobe.com/{storeId}/graphql",
      "commerce-endpoint": "https://edge-graph.adobe.io/api/{meshId}/graphql"
    }
  }
}
```
Use `commerce-core-endpoint` for Payment Services queries. `commerce-endpoint` is the catalog Edge graph (products/categories only).

**CORS confirmed:** The backend sends `access-control-allow-origin: <storefront-origin>` — inject scripts can fetch it cross-origin from the page context.

---

### 1.2 ✅ DOM structure of Payment Services drop-in on ACCS

Confirmed on optp.com checkout page:

- **Payment block container:** `.checkout__payment-methods` (also has class `dropin-design`)
- **Payment method items:** `.checkout-payment-methods__method` (2 methods found: PayPal buttons + Credit Card)
- **Selected method:** additionally has `.dropin-toggle-button__selected`
- **Credit card (Hosted Fields) container:** `.payment-services_paypal-credit-card-container`
- **Loading state:** `.dropin-skeleton.payment-services-credit-card-form__loading`

No `input[name="payment[method]"]` elements — Luma selector is entirely absent.

All drop-in elements carry the `dropin-design` class on their root. The `dropin-` prefix is the reliable namespace for all drop-in components.

---

### 1.3 ✅ APS Config endpoint — use GraphQL instead

The REST endpoint `/rest/V1/payments-config/{LOCATION}` lives on the Magento backend domain (`na1.api.commerce.adobe.com`), not the storefront domain. No same-domain access possible.

**Decision:** Replace with `GetPaymentConfig` GraphQL — same data, cross-origin CORS-allowed, endpoint discoverable from `/config.json`. The existing 4 "Get APS configuration" buttons (PDP, Checkout, Cart, Minicart) should be rewired to call this query with the corresponding `location` value.

---

### 1.4 ✅ Fast Checkout — ACCS approach identified

No `/rest/V1/products-render-info` from the frontend domain. No `#product_addtocart_form` in DOM.

Add to Cart button selector on ACCS PDP: `button.dropin-button--primary.dropin-button--with-icon`

A GraphQL-based approach is possible:
1. Use the catalog `commerce-endpoint` to query `products` for a simple product SKU
2. Use the `commerce-core-endpoint` to run `addProductsToCart` mutation with the found SKU
3. Navigate to `/cart`

This is significantly more complex than the M2 approach. **Recommend deferring** as low-priority until core features are done.

---

### 1.5 ✅ Is Magento Cloud? — fix confirmed

On ACCS, `window.DROPINS` is present on all pages including the homepage. The current REST check fails on the frontend domain, wrongly showing "NOT MAGENTO. PROBABLY PWA".

**Fix:** Check `window.DROPINS` first via inject. If present → show `"ACCS / MAGENTO CLOUD WEBSITE"` and skip REST/DNS checks entirely.

---

### Additional findings

**Checkout-page globals:**
- `window.PaymentServicesSDK` — constructor function (1 arg). The existing snippet `new PaymentServicesSDK({"apiUrl": ...})` works but must use `commerce-core-endpoint` as `apiUrl`, not `window.location.origin + "/graphql"`.
- `window.paypalCreditCardCheckout` — has `FUNDING`, `getCorrelationID`, `HostedFields` — confirming PayPal SDK is loaded and functional.

**sessionStorage on ACCS:**
- `config` — cached contents of `/config.json`; includes `commerce-core-endpoint`, `commerce-endpoint`, and store headers
- `DROPINS_CART_ID` — current cart id maintained by the drop-ins event bus

**localStorage on ACCS:**
- `cartItems` — cart item data (not the cart ID string itself)
- `customerGroup`, `DROPIN__WISHLIST__WISHLIST__DATA`, `__paypalCreditCardCheckout_storage__`

**Page shell markers:**
- Cart page root: `.commerce-cart`
- Checkout page root: `.commerce-checkout`
- PDP root: `.product-details`

These selectors are useful for quick ACCS page-type detection even before the payment drop-in finishes rendering.

---

## Phase 2 — Implementation

Order: highest-value / most-requested first.

### 2.1 "Check PayPal SDK" — ACCS GraphQL path

**Current code:** `paypalSDKHelper.js` fetches `/customer/section/load?sections=payments`. The "Storefront Utils → Check PayPal SDK" button (`accs-getPayPalSDK`) currently reuses the same handler — wrong.

**New behavior (when on ACCS):**
1. Detect ACCS: `typeof window.DROPINS !== 'undefined'`
2. Fetch `/config.json` to get `commerce-core-endpoint`
3. POST `GetPaymentConfig` with `location: "CHECKOUT"` to that endpoint
4. Extract SDK URL: `hosted_fields.sdk_params.find(p => p.name === 'src').value`
5. Pass through existing `cleanSdkUrl()` + `injectPaypal()` logic unchanged

**Implementation approach:** Add an ACCS branch to `paypalSDKHelper.js` (keep the M2 path unchanged). Wire the `accs-getPayPalSDK` popup button to inject this ACCS-aware script instead of calling `buildPayPalSdkCheckUrl()`.

**Files to change:**
- `public/inject/paypalSDKHelper.js` — add ACCS detection branch at the top of `run()`
- `src/popup/PopupApp.jsx` — wire `handleAccsGetPayPalSdk` to inject the script into the active tab (same as `handleGetPayPalSdk` but via content script injection, not a direct fetch)

---

### 2.2 "Get APS Configuration" — GraphQL replacement for ACCS

**Current code:** Opens `/rest/V1/payments-config/{LOCATION}` in a new tab. Won't work on ACCS frontend domain.

**New behavior (ACCS):** Call `GetPaymentConfig($location)` via inject and display result in console / alert (same UX as the "Check PayPal SDK" output).

**Location mapping:**
- PDP button → `PRODUCT_DETAIL`
- Checkout button → `CHECKOUT`
- Cart button → `CART`
- Minicart button → `MINICART`

**Files to change:**
- `public/inject/` — new `getPaymentConfigAccs.js` that accepts a location, fetches `/config.json`, calls GraphQL, logs result
- `public/content.js` — handle new message `getPaymentConfigAccs`
- `src/popup/PopupApp.jsx` — detect ACCS and route APS Config buttons accordingly

---

### 2.3 "Locate Payment Services on Page" — ACCS selectors

**Current code:** `togglePaymentBorders()` in `content.js` — Luma selectors only.

**New ACCS selectors:**
```js
// Payment method items
document.querySelectorAll('.checkout-payment-methods__method')
// Credit card container
document.querySelector('.payment-services_paypal-credit-card-container')
```

Apply `.animated-border` to matched elements (same existing style).

**Files to change:** `public/content.js` — add ACCS branch in `togglePaymentBorders()`.

---

### 2.4 "Is Magento Cloud?" — fix ACCS false-negative

**Files to change:** `public/content.js` — add `isAccsStorefront` message handler that checks `window.DROPINS`.

`src/popup/PopupApp.jsx` — in `handleIsFastly()`, before REST/DNS checks, send a quick `isAccsStorefront` message to the tab; if response is true, show `"ACCS / MAGENTO CLOUD WEBSITE"` and return early.

---

### 2.5 Disable M2-only buttons on ACCS

Buttons that are meaningless on ACCS:
- "Is Hyva?" — no `window.hyva`
- "Checkout Mixins" — no RequireJS
- "Check MageReport" — may not apply to ACCS-specific domains

**Approach:** Add `isAccs` to `tabConfig` state (populated on popup open via a quick inject). Pass as a disable condition same as `tabReady`.

**Files to change:** `src/lib/chrome.js` → `getActiveTabConfig()`, `src/popup/PopupApp.jsx` → add `isAccs` state and disable conditions.

---

### 2.6 Snippets — ACCS GraphQL equivalents

Add to `SnippetsApp.jsx`:

**Get payment config on ACCS (replaces the `/customer/section/load` approach):**
```js
config = await fetch('/config.json').then(r => r.json())
endpoint = config.public.default['commerce-core-endpoint']
res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query { getPaymentConfig(location: CHECKOUT) {
      hosted_fields { sdk_params { name value } is_visible }
      smart_buttons { sdk_params { name value } is_visible }
    }}`
  })
})
data = await res.json()
console.log(JSON.stringify(data.data.getPaymentConfig, null, 2))
```

**Check PaymentServicesSDK on ACCS:**
```js
config = await fetch('/config.json').then(r => r.json())
apiUrl = config.public.default['commerce-core-endpoint'].replace('/graphql', '')
sdk = new PaymentServicesSDK({ apiUrl })
await sdk.Payment.init({ location: 'CHECKOUT' })
console.log('Hosted Fields eligible:', sdk.Payment.creditCard.creditCard().component.isEligible())
```

---

### 2.7 "Get Checkout Payment Methods" — ACCS alternative

**Current code:** Reads `window.checkoutConfig.payment` — not available on ACCS.

**New ACCS behavior:** Use `GetPaymentConfig(location: CHECKOUT)` and log `code` + `is_visible` for each method.

**Files to change:** `public/inject/getCheckoutPayments.js` — add ACCS branch.

---

### 2.8 "Fast Checkout" — ACCS (low priority, defer)

Requires GraphQL product search + `addProductsToCart` mutation + EDS cart update. Significantly more complex than the M2 approach. Defer until all other features are done.

---

## Architectural notes

- **ACCS detection in popup:** `getActiveTabConfig()` should be extended to inject a quick check for `window.DROPINS` and return `isAccs: boolean`. This single flag gates all ACCS-specific UI behavior.

- **GraphQL endpoint in inject scripts:** Always fetch `/config.json` dynamically — do not hardcode. Different merchants have different store IDs in the URL.

- **Optional optimization:** If `/config.json` was already loaded by the storefront, inject scripts can read `sessionStorage.config` first and fall back to fetching `/config.json` only when missing or expired.

- **Keep M2 paths unchanged:** All existing behavior for M2 Luma/Blank and Hyva must remain completely unchanged. ACCS support is purely additive.

- **Two endpoints, two purposes:**
  - `commerce-core-endpoint` → Payment Services, cart, checkout (Magento GraphQL)
  - `commerce-endpoint` → Product catalog (Edge graph) — not needed for payments
