# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bennu is primarily for people who need to change an existing HTML page or small static site without working directly in source code. The first-run experience must be understandable to users without deep HTML knowledge, while the editor may still expose technical controls progressively for experienced users.

## Product Purpose

Bennu lets a person open an HTML file, ZIP package, or site folder; edit the rendered page directly; adjust selected elements in an inspector; preview responsive widths; and export the changed HTML or site package.

Success means a first-time visitor can understand the local open–edit–export workflow, make a useful change, and retain control of their files without creating an account or uploading project contents to Bennu.

## Positioning

Bennu is a local-first visual HTML editor that runs in the browser. Project contents and edits are processed on the user's device rather than uploaded to a Bennu application backend. Hosting infrastructure still receives ordinary requests needed to deliver the application itself, and externally referenced resources in an opened document require an explicit privacy boundary in the preview.

## Operating Context

- A user visits the hosted web application and chooses the interface language on first launch.
- The selected language applies to both onboarding and the application interface.
- The user opens a local HTML file, ZIP package, or site folder through browser file APIs.
- The user edits content and layout in a sandboxed preview and inspector, then downloads the result.
- No account, cloud workspace, or server-side project storage is required.

## Capabilities and Constraints

- The edited browser DOM remains the source of truth; exported formatting, whitespace, and attribute ordering may differ from the original source.
- The current application is a static React/Vite deployment on Cloudflare Pages.
- Product settings must be stored on the user's computer, not in a Bennu backend.
- The first-run language choice persists locally and controls all application copy.
- Local recovery of an unfinished project uses IndexedDB, but downloaded HTML or ZIP remains the durable user-owned save format.
- Safe script handling and blocking external network requests are distinct controls and must be explained separately.
- The application must not include analytics, advertising trackers, or project-content uploads unless the product record is explicitly revised.
- The public custom hostname is `bennu.zakharov.asia`.

## Brand Commitments

- Product name: Bennu.
- Existing Bennu bird mark and restrained teal editor identity remain the incumbent visual authority for product extensions.
- The in-product Help surface identifies Gennady Zakharov as the creator and links to `https://zakharov.asia/ru/`, Instagram, LinkedIn, Facebook, and Telegram without interrupting the editing workflow.
- The interface and onboarding will support Russian and English; users explicitly choose the language on first launch and may change it later in settings.
- Product language should be practical, calm, and transparent about privacy and technical limitations.

## Evidence on Hand

- Working editor implementation in `src/`.
- Bennu bird assets in `src/assets/bennu-bird.png`, `src/assets/bennu-mark.svg`, and `public/favicon.svg`.
- A built-in editable demo document in `src/lib/sampleDocument.js`.
- Unit and Playwright tests covering core loading, editing, history, viewport, and export flows.
- No testimonials, public usage metrics, customer logos, or performance benchmarks are currently available and must not be fabricated.

## Product Principles

- Local first: project contents and edits remain under the user's control.
- Learn by doing: onboarding should lead to a real edit, not become a presentation to dismiss.
- Progressive disclosure: simple actions lead; technical controls remain available without overwhelming newcomers.
- Honest privacy: distinguish local project processing from ordinary hosting requests and optional third-party resource loading.
- Export is ownership: the user leaves with standard HTML or ZIP files that do not depend on Bennu.

## Accessibility & Inclusion

Onboarding, help triggers, and editor controls must be keyboard accessible, screen-reader labelled, responsive, and usable with reduced motion. Language choice must not depend on flags alone and must remain changeable after onboarding.
