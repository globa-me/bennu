# Contributing to Bennu

Thanks for helping improve Bennu. Focused bug fixes, accessibility improvements, tests, and changes that strengthen the local-first editing workflow are welcome.

## Before you start

- Search existing issues before opening a new one.
- Keep the browser DOM as the source of truth; source mapping is intentionally out of scope for now.
- Avoid adding a backend, analytics, trackers, or project uploads without prior discussion.
- Preserve the separation between Private Preview and Safe Script Mode.
- Keep the interface usable in both English and Russian.

For larger product or architecture changes, open a feature request first so the approach can be discussed before implementation.

## Development

```bash
npm ci
npm run dev
```

Before submitting a pull request, run:

```bash
npm test
npm run test:e2e
npm run build
```

Include tests for changed behavior and update documentation when architecture, deployment, or product behavior changes.

## Pull requests

Keep each pull request centered on one clear outcome. Explain what changed, why it changed, how it was verified, and include screenshots for visible interface changes.
