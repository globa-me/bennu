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

Verify:

```bash
npm test
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

- `src/App.jsx`: top-level app state, file loading, preview session, history, export, iframe messaging, layout.
- `src/lib/htmlSession.js`: HTML runtime injection, iframe editor script, HTML formatting/download helpers.
- `src/lib/sitePackage.js`: ZIP/folder loading, path normalization, asset URL rewriting to `blob:`, restore from `blob:` URLs to relative paths.
- `src/components/PreviewFrame.jsx`: sandboxed editable iframe wrapper.
- `src/components/InspectorPanel.jsx`: selected element inspector.
- `src/lib/sitePackage.test.js`: Vitest coverage for ZIP/folder path resolving and restore behavior.
- `src/styles.css`: main app styling.

## Recent Changes

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

## Last Known Verification

As of 2026-06-14:

- `npm test` passes.
- `npm run build` passes.
- `https://bennu.pages.dev/` returns `HTTP 200` through Cloudflare.
- Cloudflare Pages has recent production deployment `1b27a1e4-a5b7-4fe6-ad28-a1628eb7352f`.

Manual/Playwright QA previously verified:

- App loads with title `Bennu`.
- No console warnings/errors during main flow.
- Hover marks a preview element.
- Click selects `<h1>`.
- Inspector can update `id`, `title`, and `font-size`.
- Duplicate creates a second `<h1>`.
- Undo returns to one `<h1>`.
- Redo returns to two `<h1>`.
- Save downloads formatted `bennu-demo.html`.

## Known Limitations

- Package-wide ZIP export is not implemented. Opening ZIP/folder works, but saving exports only the edited HTML document.
- Replacing an image currently writes a `data:` URL into HTML. Future package export should store new assets as files and rewrite `src`.
- User HTML scripts can still execute inside the sandboxed iframe. The sandbox is stricter now, but there is no user-facing scripts on/off toggle yet.
- Browser plugin cannot directly interact with the opaque sandboxed iframe after removing `allow-same-origin`; use local Playwright for iframe interaction QA.
- Source mapping is intentionally not implemented. Bennu does not preserve original formatting, whitespace, or attribute ordering after export.
- `App.jsx` is large and handles too many concerns.
- There are no e2e tests committed yet.
- There is no git repository metadata in this folder.

## Recommended Next Work

Priority 1: Add e2e tests for the real editor workflow.

- Use Playwright.
- Cover load demo, hover, select, inspector edit, duplicate, undo, redo, export.
- Add a script such as `npm run test:e2e`.

Priority 2: Refactor `App.jsx` into hooks.

Suggested hooks:

- `usePreviewSession`
- `useHistory`
- `useSiteLoader`
- `useExportHtml`

Priority 3: Implement package-wide ZIP export.

Recommended shape:

- Keep original files map in `siteSession`.
- Track edited HTML separately.
- Track added/replaced assets separately.
- Export ZIP with edited HTML at `htmlPath` and original plus new assets.

Priority 4: Improve asset replacement.

- Avoid embedding large images as `data:` URLs when a site package is loaded.
- Add generated asset names under an asset folder.
- Update `src` to relative asset paths.

Priority 5: Add preview controls.

- Responsive widths: Desktop, Tablet, Mobile, Custom.
- Script execution toggle: safer no-script mode vs full preview mode.
- Parent/child selection controls and breadcrumbs.

Priority 6: Add production smoke checks.

- Verify `https://bennu.pages.dev/` title.
- Verify referenced JS/CSS assets return 200.
- Optionally run a lightweight headless interaction smoke.

## Design Direction

Keep the architecture simple for now:

- DOM remains source of truth.
- Do not start full source mapping yet.
- Prefer making the visual editor reliable before copying more Phoenix-like internals.
- Avoid adding backend requirements unless package export or AI features genuinely need them.
