# payment-services-helper

## Purpose
Extension loads useful information associated with Payment Services into the browser's console.
![browser console](https://raw.githubusercontent.com/ikruchynskyi/payment-services-helper/main/misc/console_example_1.png)

## For users (no build required)
Download the latest `dist.zip` from `https://github.com/ikruchynskyi/payment-services-helper/releases/latest/download/dist.zip`, unzip it, and load the `dist/` folder as an unpacked extension.

Steps:
1. Download `dist.zip` from `https://github.com/ikruchynskyi/payment-services-helper/releases/latest/download/dist.zip`.
2. Unzip it.
3. Open Chrome → `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the `dist/` folder.
6. Pin the extension if you want it on the toolbar.

## Development

### Prerequisites
- Node.js 18+

### Commands
- Install dependencies: `npm install`
- Build (production): `npm run build` (outputs `dist/`)
- Build (watch mode): `npm run dev`
- Tests: `npm run test`
- Lint: `npm run lint`
- Format: `npm run format`

### Load the extension in Chrome (dev)
1. Build the project (`npm run build` or `npm run dev` for watch mode).
2. Go to `chrome://extensions`.
3. Enable Developer Mode.
4. Click **Load unpacked** and select the `dist/` directory.

## Pin extension to the toolbar
![pin_extension](https://raw.githubusercontent.com/ikruchynskyi/payment-services-helper/main/misc/pin.png)
