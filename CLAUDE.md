# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Build extension to dist/
npm run dev          # Build in watch mode (development)
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint
npm run format       # Prettier (writes files)
```

To run a single test file: `npx vitest run src/lib/urls.test.js`

After building, load the `dist/` folder as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

## Domain context

This extension debugs the **Adobe Payment Services** extension for **Adobe Commerce (Magento 2)**. Some features rely on the Magento 2 REST API and others check the Magento Cloud CDN — this explains why certain network calls and endpoint patterns are Magento/Adobe Commerce-specific.

**About Payment Services:** A turnkey payment solution built into Commerce (native since v2.4.7). Supports credit/debit cards, digital wallets, PayPal products, and card vaulting. Integrates with the Commerce order management system for financial reporting. Supports both REST/SOAP and GraphQL (headless/PWA) integration patterns.

- User docs: https://experienceleague.adobe.com/en/docs/commerce/payment-services/introduction
- Headless/GraphQL API: https://developer.adobe.com/commerce/webapi/graphql/payment-services-extension/

### Adobe Commerce Cloud Service (ACCS) — new storefront target

ACCS separates the Magento 2 backend from the frontend. The frontend runs on **Edge Delivery Services (EDS)** — no RequireJS, no `window.checkoutConfig`, no `/customer/section/load`. Payment data comes from **GraphQL only**. Payment Services is delivered as a drop-in component (`@dropins/payment-services`) registered on `window.DROPINS`.

**Detection:** `typeof window.DROPINS !== 'undefined'` (already used by `inject/isAEM.js`).

**Compatibility plan:** See `ACCS_COMPATIBILITY_PLAN.md` — full per-feature breakdown of what works, what breaks, and what needs rewriting. Phase 1 is investigation (must be done on a live ACCS storefront). Phase 2 is implementation.

Key rule: all existing M2 Luma/Hyva code paths must remain unchanged. ACCS support is additive.

## Architecture

This is a **Chrome Extension (Manifest v3)** for debugging Adobe Payment Services, built with React 18 + Vite + Vitest.

### Extension entry points

The extension has three independent React UIs, each compiled separately by Vite:

- **Popup** (`src/popup/`) — Main extension UI opened from the toolbar icon. Contains all payment debugging tools: Apple Pay cert checks, payment method detection, PayPal SDK validation, MageReport integration, fast checkout automation, AEM/Hyva platform detection.
- **Results** (`src/results/`) — Separate window for analyzing failed HTTP requests captured by the background service worker.
- **Snippets** (`src/snippets/`) — Separate window with copy-paste JS snippets for common payment debugging tasks.

### Extension scripts (`public/`)

- `background.js` — Service worker; captures network requests via Chrome DevTools Protocol and coordinates messaging between the popup and content scripts.
- `content.js` — Content script injected into all pages at document start; relays messages between the popup and injected scripts.
- `inject/` — Web-accessible scripts injected into the page context (not extension context) to read page variables: `getCheckoutPayments.js`, `getMixins.js`, `isHyva.js`, `isAEM.js`, `paypalSDKHelper.js`, `errorLogger.js`.

### Messaging flow

Popup → `chrome.tabs.sendMessage` → `content.js` → injects a script from `inject/` into the page → reads page-level JS variables → sends result back up the chain to the popup.

### Utilities (`src/lib/`)

- `urls.js` — URL builders for Payment Services API endpoints and external tools (MageReport, Perplexity, documentation links).
- `chrome.js` — Wrappers around `chrome.tabs`, `chrome.windows`, and `chrome.runtime` APIs.
- `analytics.js` — Analytics event tracking.

### Code style

- ESLint with Prettier integration; single quotes, semicolons, 100-char line width, no trailing commas.
- React PropTypes checking is disabled.
- Chrome extension globals (`chrome`) are defined as read-only in ESLint config.
- Tests use Vitest with jsdom environment and `@testing-library/react`.

### Release process

Releases are triggered by pushing a `v*` tag. GitHub Actions runs `npm ci && npm run build`, zips `dist/`, and attaches `dist.zip` to a GitHub Release.
