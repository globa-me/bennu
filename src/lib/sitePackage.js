import JSZip from "jszip";

const URL_ATTRS = [
  ["link", "href"],
  ["script", "src"],
  ["img", "src"],
  ["source", "src"],
  ["video", "src"],
  ["video", "poster"],
  ["audio", "src"],
  ["iframe", "src"],
  ["embed", "src"],
  ["object", "data"],
  ["input", "src"],
  ["image", "href"],
  ["image", "xlink:href"],
  ["use", "href"],
  ["use", "xlink:href"],
];

function normalizePath(path) {
  const parts = path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);

  const normalized = [];
  parts.forEach((part) => {
    if (part === ".") return;
    if (part === "..") {
      normalized.pop();
      return;
    }
    normalized.push(part);
  });

  return normalized.join("/");
}

function dirname(path) {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

function extname(path) {
  const clean = path.split(/[?#]/)[0].toLowerCase();
  const index = clean.lastIndexOf(".");
  return index === -1 ? "" : clean.slice(index);
}

function isExternalUrl(value = "") {
  const trimmed = value.trim();
  return (
    !trimmed ||
    trimmed.startsWith("#") ||
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(trimmed) ||
    /^(?:data|blob|mailto|tel|javascript):/i.test(trimmed)
  );
}

function splitUrl(value) {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const indexes = [hashIndex, queryIndex].filter((index) => index >= 0);
  const splitIndex = indexes.length ? Math.min(...indexes) : -1;
  if (splitIndex === -1) return { path: value, suffix: "" };
  return { path: value.slice(0, splitIndex), suffix: value.slice(splitIndex) };
}

function mimeForPath(path) {
  const ext = extname(path);
  const map = {
    ".css": "text/css",
    ".html": "text/html",
    ".htm": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  return map[ext] || "application/octet-stream";
}

function commonRoot(paths) {
  if (!paths.length) return "";
  const [first] = paths;
  const firstSegment = first.split("/")[0];
  if (!firstSegment || first === firstSegment) return "";
  return paths.every((path) => path.startsWith(`${firstSegment}/`)) ? firstSegment : "";
}

function chooseHtmlPath(paths) {
  const htmlPaths = paths.filter((path) => /\.html?$/i.test(path));
  if (!htmlPaths.length) throw new Error("No HTML file found in the site package.");
  return (
    htmlPaths.find((path) => /(^|\/)index\.html?$/i.test(path)) ||
    htmlPaths.sort((a, b) => a.length - b.length)[0]
  );
}

function resolvePath(value, fromPath, files, root) {
  if (isExternalUrl(value)) return "";
  const { path } = splitUrl(value.trim());
  if (!path) return "";

  const baseDir = dirname(fromPath);
  const candidates = [];

  if (path.startsWith("/")) {
    const absolute = normalizePath(path);
    candidates.push(absolute);
    if (root) candidates.push(normalizePath(`${root}/${absolute}`));
  } else {
    candidates.push(normalizePath(`${baseDir}/${path}`));
    candidates.push(normalizePath(path));
    if (root) candidates.push(normalizePath(`${root}/${path}`));
  }

  return candidates.find((candidate) => files.has(candidate)) || "";
}

function relativeFrom(fromFile, targetFile) {
  const fromParts = dirname(fromFile).split("/").filter(Boolean);
  const targetParts = normalizePath(targetFile).split("/").filter(Boolean);

  while (fromParts.length && targetParts.length && fromParts[0] === targetParts[0]) {
    fromParts.shift();
    targetParts.shift();
  }

  const rel = [...fromParts.map(() => ".."), ...targetParts].join("/");
  return rel || normalizePath(targetFile);
}

function transformSrcset(value, fromPath, resolveUrl) {
  return value
    .split(",")
    .map((candidate) => {
      const trimmed = candidate.trim();
      const [url, ...rest] = trimmed.split(/\s+/);
      return [resolveUrl(url, fromPath), ...rest].filter(Boolean).join(" ");
    })
    .join(", ");
}

function transformCssUrls(css, fromPath, resolveUrl) {
  return css
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
      if (isExternalUrl(url)) return match;
      return `url("${resolveUrl(url, fromPath)}")`;
    })
    .replace(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?/gi, (match, quote, url) => {
      if (isExternalUrl(url)) return match;
      return `@import url("${resolveUrl(url, fromPath)}")`;
    });
}

async function filesFromZip(file) {
  const zip = await JSZip.loadAsync(file);
  const files = new Map();

  await Promise.all(
    Object.values(zip.files).map(async (entry) => {
      if (entry.dir || entry.name.startsWith("__MACOSX/")) return;
      const path = normalizePath(entry.name);
      const blob = await entry.async("blob");
      files.set(path, blob);
    }),
  );

  return files;
}

function filesFromDirectory(fileList) {
  const files = new Map();
  Array.from(fileList).forEach((file) => {
    const path = normalizePath(file.webkitRelativePath || file.name);
    if (path) files.set(path, file);
  });
  return files;
}

async function readBlobText(blob) {
  return blob.text();
}

export async function createSiteSessionFromZip(file) {
  const files = await filesFromZip(file);
  return createSiteSession(files, file.name);
}

export async function createSiteSessionFromDirectory(fileList) {
  const files = filesFromDirectory(fileList);
  const first = Array.from(fileList)[0];
  const rootLabel = first?.webkitRelativePath?.split("/")?.[0] || "site-folder";
  return createSiteSession(files, rootLabel);
}

export async function createSiteSession(files, label = "site") {
  const paths = Array.from(files.keys());
  const root = commonRoot(paths);
  const htmlPath = chooseHtmlPath(paths);
  const html = await readBlobText(files.get(htmlPath));
  const objectUrls = new Map();
  const blobToOriginal = new Map();
  const cssUrlPromises = new Map();

  const makeObjectUrl = (path, blob, restorePath = relativeFrom(htmlPath, path)) => {
    if (objectUrls.has(path)) return objectUrls.get(path);
    const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeForPath(path) });
    const url = URL.createObjectURL(typedBlob);
    objectUrls.set(path, url);
    blobToOriginal.set(url, restorePath);
    return url;
  };

  const resolveUrl = (value, fromPath = htmlPath) => {
    if (isExternalUrl(value)) return value;
    const { path, suffix } = splitUrl(value.trim());
    const resolvedPath = resolvePath(path, fromPath, files, root);
    if (!resolvedPath) return value;

    if (extname(resolvedPath) === ".css" && objectUrls.has(resolvedPath)) return `${objectUrls.get(resolvedPath)}${suffix}`;
    if (extname(resolvedPath) === ".css") return `${makeObjectUrl(resolvedPath, files.get(resolvedPath))}${suffix}`;

    return `${makeObjectUrl(resolvedPath, files.get(resolvedPath))}${suffix}`;
  };

  const transformCssFile = async (path, stack = []) => {
    if (stack.includes(path)) return "";
    const css = await readBlobText(files.get(path));
    const importRegex = /@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?[^;]*;/gi;
    let output = "";
    let lastIndex = 0;

    for (const match of css.matchAll(importRegex)) {
      output += css.slice(lastIndex, match.index);
      const importUrl = match[2];
      const importedPath = resolvePath(importUrl, path, files, root);

      if (importedPath && extname(importedPath) === ".css") {
        output += await transformCssFile(importedPath, [...stack, path]);
      } else {
        output += match[0];
      }

      lastIndex = match.index + match[0].length;
    }

    output += css.slice(lastIndex);
    return transformCssUrls(output, path, resolveUrl);
  };

  const buildCssUrl = async (path) => {
    if (objectUrls.has(path)) return objectUrls.get(path);
    if (cssUrlPromises.has(path)) return cssUrlPromises.get(path);

    const promise = (async () => {
      const transformed = await transformCssFile(path);
      const url = URL.createObjectURL(new Blob([transformed], { type: "text/css" }));
      objectUrls.set(path, url);
      blobToOriginal.set(url, relativeFrom(htmlPath, path));
      return url;
    })();

    cssUrlPromises.set(path, promise);
    return promise;
  };

  // Prebuild CSS once so HTML links point at transformed stylesheets.
  for (const path of paths.filter((item) => extname(item) === ".css")) {
    await buildCssUrl(path);
  }

  const render = (sourceHtml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sourceHtml || "", "text/html");

    URL_ATTRS.forEach(([selector, attr]) => {
      doc.querySelectorAll(`${selector}[${CSS.escape(attr)}]`).forEach((node) => {
        const current = node.getAttribute(attr);
        if (!current) return;
        node.setAttribute(attr, resolveUrl(current, htmlPath));
      });
    });

    doc.querySelectorAll("[srcset]").forEach((node) => {
      node.setAttribute("srcset", transformSrcset(node.getAttribute("srcset") || "", htmlPath, resolveUrl));
    });

    doc.querySelectorAll("[style]").forEach((node) => {
      node.setAttribute("style", transformCssUrls(node.getAttribute("style") || "", htmlPath, resolveUrl));
    });

    doc.querySelectorAll("style").forEach((node) => {
      node.textContent = transformCssUrls(node.textContent || "", htmlPath, resolveUrl);
    });

    return "<!doctype html>\n" + doc.documentElement.outerHTML;
  };

  const restore = (sourceHtml) => {
    let restored = sourceHtml || "";
    Array.from(blobToOriginal.entries()).forEach(([blobUrl, originalPath]) => {
      restored = restored.split(blobUrl).join(originalPath);
    });
    return restored;
  };

  const previewUrlFor = (value) => resolveUrl(value, htmlPath);

  const cleanup = () => {
    Array.from(objectUrls.values()).forEach((url) => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    });
  };

  return {
    html,
    htmlPath,
    label,
    root,
    assetCount: Math.max(0, paths.length - 1),
    exportPackage: {
      mode: "HTML export now; package export later",
      htmlPath,
      assetPaths: paths.filter((path) => path !== htmlPath),
    },
    render,
    restore,
    previewUrlFor,
    cleanup,
  };
}

export function isZipFile(file) {
  return file?.name?.toLowerCase().endsWith(".zip") || file?.type === "application/zip";
}
