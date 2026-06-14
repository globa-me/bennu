# Bennu

Bennu is a lightweight live HTML document editor inspired by Phoenix Code. It focuses on one primary workflow: open an HTML file, edit the rendered page directly, adjust selected elements in an inspector, and export the changed HTML.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## What Works

- Open `.html` / `.htm` files from disk.
- Open a full site as `.zip` or a selected folder, including relative CSS, images, fonts, scripts, and `url(...)` references inside CSS.
- Edit text directly inside the rendered preview.
- Select images, links, text, and layout blocks in the preview.
- Change text, image source, local image replacement, alt text, links, spacing, width, alignment, object-fit, class, and visibility from the inspector.
- Export the current edited HTML.
- Undo and redo recent document states.
- Collapse the left file panel and right inspector to give the preview more space.

## Saving Model

Bennu uses the edited browser DOM as the source of truth and exports it as formatted HTML. This keeps the visual editor simple and predictable, but it means original source formatting, whitespace, and attribute ordering may change after export.

When a full site package is opened from a ZIP or folder, Bennu currently exports the edited HTML document only. Package-wide ZIP export is planned for a later iteration.

## Deploy

Bennu currently runs as a static client-side app on Cloudflare Pages:

- production URL: `https://bennu.pages.dev/`
- Cloudflare Pages project: `bennu`
- deploy mode: Direct Upload through Wrangler, not Git integration

It does not need a persistent backend server for editing, ZIP/folder loading, preview rendering, or exporting HTML.

Deploy from this directory:

```bash
npm run deploy
```

The deploy script runs `npm run build` and uploads `dist` to the `bennu` Pages project.

The app runs in the user's browser. Site packages are read through browser file APIs, resources are mapped to local `blob:` URLs for preview, and exported HTML is downloaded back to the user.

If local AI returns later, an online deployment will need a local bridge app or extension to talk to LM Studio/Ollama on the user's machine. Direct calls from a hosted page to `http://localhost:1234` are not reliable because of browser security restrictions.

## Notes

The preview runs the imported HTML inside an editable iframe and injects a small runtime script for selection and live editing. Treat unknown HTML files as untrusted content.
