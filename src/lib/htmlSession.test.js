import { describe, expect, test } from "vitest";
import { injectEditorRuntime, restoreUserScripts } from "./htmlSession.js";

describe("private preview", () => {
  test("blocks network resources and active embeds in the runtime copy by default", () => {
    const runtime = injectEditorRuntime(`<!doctype html><html><head>
      <meta http-equiv="refresh" content="0;url=https://bad.example">
      <link rel="stylesheet" href="https://cdn.example/app.css">
      <style>.hero { background: url("https://cdn.example/hero.png") }</style>
    </head><body style="background:url(//cdn.example/bg.png)">
      <form action="https://bad.example/send"><button formaction="https://bad.example/other">Send</button></form>
      <img src="https://cdn.example/image.png" srcset="https://cdn.example/2x.png 2x">
      <script src="https://cdn.example/app.js"></script>
      <iframe src="local-frame.html" srcdoc="<script>alert(1)</script>"></iframe><object data="asset.pdf"></object><embed src="movie.swf">
    </body></html>`, "token");
    const doc = new DOMParser().parseFromString(runtime, "text/html");

    expect(doc.querySelector('meta[data-bennu-private-runtime]')).not.toBeNull();
    expect(doc.querySelector('link[rel="stylesheet"]').hasAttribute("href")).toBe(false);
    expect(doc.querySelector("script[src]")).toBeNull();
    expect(doc.querySelector("img").hasAttribute("src")).toBe(false);
    expect(doc.querySelector("img").hasAttribute("srcset")).toBe(false);
    expect(doc.querySelector("iframe").getAttribute("src")).toBe("about:blank");
    expect(doc.querySelector("iframe").hasAttribute("srcdoc")).toBe(false);
    expect(doc.querySelector("object").hasAttribute("data")).toBe(false);
    expect(doc.querySelector("embed").hasAttribute("src")).toBe(false);
    expect(doc.querySelector("form").hasAttribute("action")).toBe(false);
    expect(doc.querySelector('meta[http-equiv="refresh"]').hasAttribute("content")).toBe(false);
    expect(doc.querySelector("style").textContent).not.toContain("https://");
    expect(doc.body.getAttribute("style")).not.toContain("//cdn.example");
  });

  test("restores private-preview changes for export", () => {
    const source = `<!doctype html><html><head><style>@import "https://cdn.example/a.css";</style></head><body>
      <form><button formaction="https://example.com/send">Send</button></form>
      <img src="https://cdn.example/image.png"><iframe src="frame.html"></iframe>
      <script src="https://cdn.example/app.js"></script>
    </body></html>`;
    const restored = restoreUserScripts(injectEditorRuntime(source));

    expect(restored).toContain('src="https://cdn.example/image.png"');
    expect(restored).toContain('src="https://cdn.example/app.js"');
    expect(restored).toContain('src="frame.html"');
    expect(restored).toContain('formaction="https://example.com/send"');
    expect(restored).toContain('@import "https://cdn.example/a.css";');
    const restoredDoc = new DOMParser().parseFromString(restored, "text/html");
    restoredDoc.querySelector("#bennu-runtime-editor")?.remove();
    expect(restoredDoc.querySelector("[data-bennu-private-runtime]")).toBeNull();
    expect(restoredDoc.documentElement.outerHTML).not.toContain("data-bennu-private-");
  });

  test("can explicitly disable private preview without changing older arguments", () => {
    const runtime = injectEditorRuntime('<img src="https://cdn.example/image.png">', "token", false, false);
    const doc = new DOMParser().parseFromString(runtime, "text/html");

    expect(doc.querySelector("img").getAttribute("src")).toBe("https://cdn.example/image.png");
    expect(doc.querySelector('[data-bennu-private-runtime]')).toBeNull();
  });
});
