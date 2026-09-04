# Bennu Agent Handoff

This file is for future agents working on Bennu. Keep it current when changing architecture, deployment, tests, or major product behavior.

## Project Snapshot

Bennu is a static React/Vite app for editing HTML visually in an iframe. It is inspired by Phoenix Code, but it does not import or vendor Phoenix source code. The current design intentionally uses the edited browser DOM as the source of truth and exports formatted HTML.

Production is Cloudflare Pages:

- Production URL: `https://bennu.pages.dev/`
- Cloudflare Pages project: `bennu`
- Deploy mode: Direct Upload with Wrangler, not Git integration
- Config: `wrangler.jsonc`

Local git metadata is present on branch `main`. Check `git status` before editing because other agents may have uncommitted work.

## Commands

Run locally:

```bash
npm install
npm run dev
```

Verify Unit Tests:

```bash
npm test
```

Verify E2E Tests (Playwright):

```bash
npm run test:e2e
```

Verify Build:

```bash
npm run build
```

Deploy:

```bash
npm run deploy
```

The deploy script builds the app and runs:

```bash
npx wrangler pages deploy dist --project-name bennu
```

## Current Architecture

Key files:

- `src/App.jsx`: top-level layout, component orchestration, styling, and hook integration.
- `src/hooks/useHistory.js`: custom hook managing the document's undo/redo history stacks.
- `src/hooks/useExportHtml.js`: custom hook wrapping Prettier formatting and smart file/ZIP package download exports.
- `src/hooks/useSiteLoader.js`: custom hook managing folder, ZIP, and virtual single-file loading sessions.
- `src/hooks/usePreviewSession.js`: custom hook handling iframe `postMessage` boundary communications and script toggle status.
- `src/lib/htmlSession.js`: HTML runtime injection, iframe editor script, HTML formatting/download helpers.
- `src/lib/sitePackage.js`: ZIP/folder loading, path normalization, asset URL rewriting to `blob:`, restore from `blob:` URLs to relative paths.
- `src/components/PreviewFrame.jsx`: sandboxed editable iframe wrapper supporting responsive widths simulator.
- `src/components/InspectorPanel.jsx`: selected element inspector.
- `src/lib/sitePackage.test.js`: Vitest coverage for ZIP/folder path resolving and restore behavior.
- `src/styles.css`: main app styling.

## Recent Changes

Codex editor UX overhaul, 2026-09-04:

- Simplified the primary flow: the left panel now leads with one `Open project` action, keeps folder loading secondary, removes duplicate export controls, and moves technical editing details into a disclosure.
- Added a lightweight document outline for landmark/container elements.
- Added selected-element breadcrumbs with direct ancestor selection plus parent, move up/down, duplicate, and remove actions.
- Reorganized the inspector with progressive disclosure. Content/media/link controls remain prominent; layout, appearance, HTML attributes, and the technical selector are grouped separately.
- Added four-sided margin/padding controls, property reset buttons, color pickers, and typography controls for weight, line height, and letter spacing.
- Preview measurements now refresh when the iframe viewport changes instead of remaining stale.
- Added custom preview width and rotate controls alongside Desktop/Tablet/Mobile presets.
- Added dirty/saved UI state, a page-close warning for unsaved edits, global Cmd/Ctrl+S export handling, clearer export errors, and an ARIA live status announcer.
- Added `aria-pressed` state to toggle-style toolbar controls, stronger `:focus-visible` treatment, larger interaction affordances, themed selection, and clearer empty-state guidance.
- The iframe runtime now supplies ancestor metadata and supports selecting ancestors and moving selected siblings without changing the DOM-source-of-truth architecture.
- Verification: `npm test`, `npm run test:e2e` (4 specs), and `npm run build` pass. The Impeccable detector was run; its width-transition warning was resolved.

Security:

- Removed `allow-same-origin` from the preview iframe sandbox.
- Added per-preview session token.
- Host checks `event.source === iframeRef.current?.contentWindow`.
- Host no longer trusts only `message.source`.
- `postMessage` still uses `targetOrigin: "*"` because `srcdoc` without `allow-same-origin` has an opaque origin. The trust boundary is the session token plus `contentWindow` check.

Export:

- Added lazy-loaded Prettier HTML formatting before download.
- `downloadHtml()` now formats the DOM HTML before creating the file.
- README now states that Bennu saves the edited DOM as formatted HTML and original source formatting may change.

History:

- Stabilized undo/redo by tracking the current history index in a ref.
- Added `runtimeKey` remounting for the iframe so undo/redo reloads `srcDoc` even when React state string equality would otherwise skip a visible iframe reset.

Inspector:

- Added editing for `id`, `title`, link `target`, `height`, `color`, `background-color`, and `font-size`.
- Added `duplicate` element action.
- Existing inspector still edits text, class, media source, alt text, object fit, width, max width, margin, padding, text align, visibility, and removal.

Preview UX:

- Added hover outline in the iframe before selection.
- Click still selects an element and opens inspector controls.

Site package loading:

- Fixed path normalization for `.` and `..` segments.
- Added `exportPackage` metadata on site sessions as a placeholder for future package-wide export.
- Removed unused `TEXT_TYPES` and unused CSS rebuild helper.

Cleanup:

- Removed unused CSS classes for older AI/screenshot/error surfaces.
- Added `wrangler.jsonc`.
- Added `npm run deploy`.

Tests:

- Added Vitest + jsdom.
- Current tests cover:
  - ZIP package loading.
  - Folder loading via `webkitRelativePath`.
  - HTML asset URL rewriting.
  - `srcset` rewriting.
  - CSS `url(...)` rewriting.
  - CSS `@import` inlining/rewrite behavior.
  - Restore from `blob:` URLs back to HTML-relative paths.
  - Initial React app shell render smoke test.

Codex correction note, 2026-06-14:

- Previous agent added package ZIP export, asset upload, multi-page routing UI, and related tests, but introduced a startup crash in `src/App.jsx`.
- The specific mistake was referencing `handleExportHtml` in the `handleMessage` `useCallback` dependency array before `handleExportHtml` was initialized. Vite build and the existing tests passed, but the React app crashed on first browser render with `ReferenceError: Cannot access 'handleExportHtml' before initialization`.
- Codex fixed this in commit `ecef72a` by moving `handleExportHtml` above `handleMessage`, adding `src/App.test.jsx` to smoke-test the initial React shell render, and updating this handoff file to note that git metadata exists locally.
- Codex verified `npm test`, `npm run build`, local browser smoke, and production Playwright smoke against `https://bennu.pages.dev/`.

Antigravity refactoring and features note, 2026-06-14:

- Refactored `src/App.jsx` by extracting core state and logic concern blocks into reusable custom React hooks: `useHistory`, `useExportHtml`, `useSiteLoader`, and `usePreviewSession`.
- Implemented **Safe Script Mode** toggle. If active, user script tags and inline event handlers are neutralized inside the preview iframe to prevent alert loops or redirect hijacks. They are fully restored on HTML export.
- Implemented **Device Viewport Simulator** (Desktop 100%, Tablet 768px, Mobile 375px) in the top bar with smooth width transitions and card shadows on the preview frame.
- Implemented **Smart Single-file virtual sessions**. Single HTML files are wrapped in virtual sessions so that any local image replacement stores files relatively instead of using Base64 strings. If no assets were replaced, it downloads raw HTML on save; if assets were added, it bundles them into a ZIP package.
- Setup **Playwright integration testing** in `e2e/editor.spec.js` and added `npm run test:e2e` to package script. Tests verify loading, selection, editing, duplication, undo, and viewports.
- Configured Vitest to exclude `e2e` directories to ensure unit tests run clean.

## Last Known Verification

As of 2026-06-14:

- `npm test` passes.
- `npm run test:e2e` passes (all 4 specs passing).
- `npm run build` passes.
- `https://bennu.pages.dev/` returns `HTTP 200` through Cloudflare.

## Known Limitations

- Browser plugin cannot directly interact with the opaque sandboxed iframe after removing `allow-same-origin`; use local Playwright for iframe interaction QA.
- Source mapping is intentionally not implemented. Bennu does not preserve original formatting, whitespace, or attribute ordering after export.

## Recommended Next Work

Priority 1: Add parent/child selection controls and breadcrumbs.

- Show breadcrumbs for the selected element's DOM path (e.g. `div > main > section > h1`).
- Allow selecting parent elements directly from breadcrumbs or parent selector button to ease layout editing.

Priority 2: Add production smoke checks.

- Verify `https://bennu.pages.dev/` title.
- Verify referenced JS/CSS assets return 200.
- Optionally run a lightweight headless interaction smoke.

Priority 3: Extend E2E test coverage.

- Add playwright coverage for folder loading, multi-page page switching, and asset upload/ZIP packaging flows.

## Design Direction

Keep the architecture simple for now:

- DOM remains source of truth.
- Do not start full source mapping yet.
- Prefer making the visual editor reliable before copying more Phoenix-like internals.
- Avoid adding backend requirements unless package export or AI features genuinely need them.
