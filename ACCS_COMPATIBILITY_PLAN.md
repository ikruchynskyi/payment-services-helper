# ACCS Storefront Compatibility Plan

## Context

Adobe Commerce Cloud Service (ACCS) introduces a new storefront architecture:

- **Backend:** Magento 2 (cloud-provisioned), exposes REST + GraphQL on a **different domain** than the frontend (e.g. `na1.api.commerce.adobe.com/{storeId}/graphql`).
- **Frontend:** [Adobe Commerce Storefront](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/architecture/) — built on Edge Delivery Services (EDS). No RequireJS, no `window.checkoutConfig`, no Magento session endpoints.
- **Boilerplate:** https://github.com/hlxsites/aem-boilerplate-commerce
- **Payment Services:** Integrated as a [drop-in component](https://experienceleague.adobe.com/developer/commerce/storefront/dropins/payment-services/) (`@dropins/payment-services`). Registered on `window.DROPINS`. Uses **GraphQL** for all payment data — `/customer/section/load` does not exist.
- **Detection signal:** Every ACCS/AEM storefront exposes `/config.json` at the site root containing `public.default.commerce-core-endpoint`. Presence of this key reliably identifies ACCS. Used consistently across all features — popup (`getActiveTabConfig`), content script (`togglePaymentBorders`), and inject scripts (`isAEM.js`, `getCheckoutPayments.js`). `window.DROPINS` is NOT used for detection because content scripts run in an isolated JS world and cannot read page-level globals.

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
- If `window.PaymentServicesSDK` is not present on the page, it can be loaded from the public CDN bundle: `https://commerce-payments-sdk.adobe.io/v0/4/PaymentSDK.js?ext=2.14.0`

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

## Phase 2 — Implementation (completed 2026-04-03)

### Feature status matrix

| Feature | M2 Luma/Hyva | ACCS/AEM |
|---|---|---|
| Validate Apple Pay Certificate | ✅ Works | ✅ Works (domain-based) |
| Locate Payment Services on Page | ✅ Works | ✅ Works (drop-in selectors, detected via `/config.json`) |
| Check PayPal SDK | ✅ Works (REST path) | ✅ Works (GraphQL via `paypalSDKHelperAccs.js`) |
| Get Checkout Payment Methods | ✅ Works (`window.checkoutConfig`) | ✅ Works (GraphQL `GetPaymentConfig`) |
| Analyze web requests | ✅ Works | ✅ Works |
| Is Magento Cloud? | ✅ Works | ⛔ Disabled (irrelevant on ACCS) |
| Is Hyva? | ✅ Works | ⛔ Disabled (no `window.hyva` on EDS) |
| Is AEM/ACCS Storefront? | ✅ Works | ✅ Works (detects via `/config.json`) |
| Checkout Mixins | ✅ Works | ⛔ Disabled (no RequireJS on EDS) |
| Fast Checkout | ✅ Works | ⛔ Disabled (deferred — see 2.8) |
| Check MageReport | ✅ Works | ⛔ Disabled (M2-specific security scanner) |
| Get APS Configuration (PDP/Checkout/Cart/Minicart) | ✅ Opens REST endpoint | ✅ GraphQL `GetPaymentConfig` logged to console |
| Snippets — ACCS equivalents | N/A | ✅ Added to SnippetsApp |

---

### 2.1 ✅ "Check PayPal SDK" — ACCS GraphQL path

Two separate inject scripts:
- **M2:** `paypalSDKHelper.js` — fetches `/customer/section/load?sections=payments`
- **ACCS:** `paypalSDKHelperAccs.js` — fetches `/config.json` → GraphQL `GetPaymentConfig` → extracts SDK URL

Routing: popup detects `isAccs` via `/config.json` in `getActiveTabConfig()` and sends `accsGetPayPalSdk` message instead of making a direct REST fetch.

**Files changed:**
- `public/inject/paypalSDKHelperAccs.js` — new ACCS-specific inject script
- `src/popup/PopupApp.jsx` — `handleGetPayPalSdk` routes to ACCS path when `isAccs`

---

### 2.2 ✅ "Get APS Configuration" — GraphQL replacement for ACCS

When `isAccs`, the 4 location buttons send `accsGetPaymentConfig` message to `content.js`, which fetches `/config.json` → posts `GetPaymentConfig($location)` → logs full result to the page console.

Location mapping: PDP → `PRODUCT_DETAIL`, Checkout → `CHECKOUT`, Cart → `CART`, Minicart → `MINICART`.

**Files changed:**
- `public/content.js` — `handleAccsGetPaymentConfig()` handles the message and fetches via GraphQL
- `src/popup/PopupApp.jsx` — `handleApsConfigOpen` routes to `accsGetPaymentConfig` message when `isAccs`

---

### 2.3 ✅ "Locate Payment Services on Page" — ACCS selectors

`togglePaymentBorders()` in `content.js` is async and self-detects ACCS by fetching `/config.json` (with `sessionStorage.config` cache). ACCS branch applies `.animated-border` to `.checkout-payment-methods__method` and `.payment-services_paypal-credit-card-container`. M2 branch unchanged.

Note: content scripts run in an isolated JS world and cannot read `window.DROPINS`. Detection via `/config.json` fetch is required here.

**Files changed:** `public/content.js`

---

### 2.4 ✅ "Is Magento Cloud?" — disabled on ACCS

Button is disabled when `isAccs`. The REST+DNS check is M2-specific and would always return false on EDS frontends.

**Files changed:** `src/popup/PopupApp.jsx`

---

### 2.5 ✅ Disable M2-only buttons on ACCS

Buttons disabled when `isAccs`: Is Magento Cloud?, Is Hyva?, Checkout Mixins, Fast Checkout, Check MageReport.

Detection: `getActiveTabConfig()` in `src/lib/chrome.js` fetches `/config.json` from the active tab URL. Presence of `public.default.commerce-core-endpoint` → `isAccs = true`.

**Files changed:** `src/lib/chrome.js`, `src/popup/PopupApp.jsx`

---

### 2.6 ✅ Snippets — ACCS GraphQL equivalents

Added to `SnippetsApp.jsx`:
- `[ACCS] Get payment config` — `GetPaymentConfig` via GraphQL
- `[ACCS] Check PaymentServicesSDK eligibility` — uses `commerce-core-endpoint` as `apiUrl` directly

**Files changed:** `src/snippets/SnippetsApp.jsx`

---

### 2.7 ✅ "Get Checkout Payment Methods" — ACCS alternative

`getCheckoutPayments.js` detects ACCS via `/config.json`. If ACCS, posts `GetPaymentConfig(CHECKOUT)` and logs `code` + `is_visible` per method. Falls back to `window.checkoutConfig.payment` for M2.

**Files changed:** `public/inject/getCheckoutPayments.js`

---

### 2.8 ⛔ "Fast Checkout" — ACCS (deferred)

Requires GraphQL product search + `addProductsToCart` mutation + EDS cart update. Button remains disabled on ACCS.

---

## Architectural notes

- **ACCS detection:** Fetch `/config.json` and check `public.default.commerce-core-endpoint`. Use `sessionStorage.config` as cache when available. Never use `window.DROPINS` for detection — content scripts cannot access page-level globals (isolated world). Inject scripts (MAIN world) could use `window.DROPINS` but `/config.json` is preferred for consistency across all contexts.

- **GraphQL endpoint:** Always read `commerce-core-endpoint` from `/config.json` dynamically. Never hardcode — store IDs differ per merchant.

- **Keep M2 paths unchanged:** All existing behavior for M2 Luma/Blank and Hyva remains completely unchanged. ACCS support is purely additive.

- **Two endpoints, two purposes:**
  - `commerce-core-endpoint` → Payment Services, cart, checkout (Magento GraphQL) — use this for all payment queries
  - `commerce-endpoint` → Product catalog (Edge graph) — not needed for payments
