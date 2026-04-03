# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the Vite app sources. The extension UI is split into feature entry points under `src/popup/`, `src/results/`, and `src/snippets/`; each folder keeps its own `index.html`, `main.jsx`, `*App.jsx`, and CSS. Shared browser, analytics, and URL helpers live in `src/lib/`, with test bootstrap in `src/test/setup.js`. Static extension assets live in `public/`, including `manifest.json`, `background.js`, `content.js`, and `public/inject/*.js`. Build output goes to `dist/`; `misc/` holds README images.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

- `npm run build` builds the production extension into `dist/`.
- `npm run dev` rebuilds in watch mode for local extension development.
- `npm run preview` serves the built app for a quick Vite smoke check.
- `npm run test` runs the Vitest suite once.
- `npm run test:watch` starts Vitest in watch mode.
- `npm run lint` checks ESLint rules.
- `npm run format` applies Prettier formatting.

Load the unpacked extension from `dist/` at `chrome://extensions` after a build.

## Coding Style & Naming Conventions
Use ES modules, React function components, and 2-space indentation. Prettier is the source of truth: single quotes, semicolons, no trailing commas, and a 100-character print width. Name components in PascalCase (`PopupApp.jsx`), utilities in camelCase (`buildPayPalSdkCheckUrl`), and keep files grouped by feature entry point. Prefer colocated tests such as `src/lib/urls.test.js`.

## Testing Guidelines
Vitest runs in a `jsdom` environment, and Testing Library helpers are available for UI work. Add or update tests for each behavior change, especially URL builders, message-passing helpers, and popup interactions. There is no enforced coverage gate today, so contributors should cover changed logic directly and run `npm run test` before opening a PR.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `Fix fast checkout auto add and bump version` and `Improve README download instructions`. Follow that style, keep the first line focused on one change, and add issue references when helpful. PRs should include a brief summary, test/lint results, linked issues, and screenshots for changes to popup, results, or snippets UI.

## Security & Configuration Tips
Treat edits to `public/manifest.json`, `public/background.js`, and `public/inject/*.js` as security-sensitive because they affect extension permissions and page injection. Do not commit tokens, customer data, or temporary debugging artifacts.
