import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import JSZip from "jszip";
import {
  createSiteSession,
  createSiteSessionFromDirectory,
  createSiteSessionFromZip,
} from "./sitePackage.js";

let objectUrlCounter;
let objectUrlBlobs;

function fileWithPath(contents, name, webkitRelativePath, type = "") {
  const file = new File([contents], name, { type });
  Object.defineProperty(file, "webkitRelativePath", {
    value: webkitRelativePath,
    configurable: true,
  });
  return file;
}

function getCssTexts() {
  return Promise.all(
    Array.from(objectUrlBlobs.values())
      .filter((blob) => blob.type === "text/css")
      .map((blob) => blob.text()),
  );
}

beforeEach(() => {
  objectUrlCounter = 0;
  objectUrlBlobs = new Map();
  globalThis.CSS ||= {};
  globalThis.CSS.escape ||= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
    const url = `blob:mock/${++objectUrlCounter}`;
    objectUrlBlobs.set(url, blob);
    return url;
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("site package sessions", () => {
  test("loads a ZIP package and rewrites HTML, srcset, CSS url(), and @import paths", async () => {
    const zip = new JSZip();
    zip.file(
      "site/index.html",
      `<!doctype html>
      <html>
        <head><link rel="stylesheet" href="assets/app.css"></head>
        <body>
          <img src="assets/hero.png" srcset="assets/hero.png 1x, /assets/hero@2x.png 2x">
        </body>
      </html>`,
    );
    zip.file("site/assets/app.css", `@import "./reset.css"; .hero { background: url("../assets/bg.png"); }`);
    zip.file("site/assets/reset.css", `body { margin: 0; }`);
    zip.file("site/assets/hero.png", "hero");
    zip.file("site/assets/hero@2x.png", "hero2");
    zip.file("site/assets/bg.png", "bg");

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const session = await createSiteSessionFromZip(new File([zipBlob], "site.zip", { type: "application/zip" }));
    const rendered = session.render(session.html);
    const css = (await getCssTexts()).join("\n");

    expect(session.htmlPath).toBe("site/index.html");
    expect(rendered).toContain('href="blob:mock/');
    expect(rendered).toContain('src="blob:mock/');
    expect(rendered).toContain("1x, blob:mock/");
    expect(css).toContain("body { margin: 0; }");
    expect(css).toMatch(/background: url\("blob:mock\/\d+"\)/);

    const restored = session.restore(rendered);
    expect(restored).toContain('href="assets/app.css"');
    expect(restored).toContain('src="assets/hero.png"');
    expect(restored).toContain("assets/hero.png 1x, assets/hero@2x.png 2x");
  });

  test("loads a selected folder using webkitRelativePath and tracks future package export metadata", async () => {
    const files = [
      fileWithPath(
        `<!doctype html><html><head><link rel="stylesheet" href="./style.css"></head><body></body></html>`,
        "index.html",
        "project/public/index.html",
        "text/html",
      ),
      fileWithPath(`body { background: url("./pattern.svg"); }`, "style.css", "project/public/style.css", "text/css"),
      fileWithPath("<svg></svg>", "pattern.svg", "project/public/pattern.svg", "image/svg+xml"),
    ];

    const session = await createSiteSessionFromDirectory(files);
    const rendered = session.render(session.html);

    expect(session.label).toBe("project");
    expect(session.htmlPath).toBe("project/public/index.html");
    expect(session.exportPackage.mode).toBe("HTML export now; package export later");
    expect(session.exportPackage.assetPaths).toEqual(["project/public/style.css", "project/public/pattern.svg"]);
    expect(rendered).toContain('href="blob:mock/');
    expect((await getCssTexts()).join("\n")).toMatch(/url\("blob:mock\/\d+"\)/);
  });

  test("restores blob URLs back to paths relative to the edited HTML file", async () => {
    const files = new Map([
      [
        "pages/about/index.html",
        new Blob([`<!doctype html><html><body><img src="../../assets/team.png"></body></html>`], {
          type: "text/html",
        }),
      ],
      ["assets/team.png", new Blob(["team"], { type: "image/png" })],
    ]);

    const session = await createSiteSession(files, "manual");
    const rendered = session.render(session.html);

    expect(rendered).toContain('src="blob:mock/');
    expect(session.restore(rendered)).toContain('src="../../assets/team.png"');
  });
});
