const BENNU_SCRIPT_ID = "bennu-runtime-editor";
const SELECTED_ATTR = "data-bennu-selected";
const EDITABLE_ATTR = "data-bennu-editable";
const HOVERED_ATTR = "data-bennu-hovered";
const PRIVATE_RUNTIME_ATTR = "data-bennu-private-runtime";
const PRIVATE_ORIGINAL_PREFIX = "data-bennu-private-original-";
const PRIVATE_HAD_PREFIX = "data-bennu-private-had-";

const PRIVATE_URL_ATTRS = [
  ["base", "href"],
  ["link", "href"],
  ["script", "src"],
  ["img", "src"],
  ["source", "src"],
  ["video", "src"],
  ["video", "poster"],
  ["audio", "src"],
  ["input", "src"],
  ["image", "href"],
  ["image", "xlink:href"],
  ["use", "href"],
  ["use", "xlink:href"],
];

function privateMarkerSuffix(attributeName) {
  return attributeName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

function rememberAndReplaceAttribute(node, attributeName, replacement = null) {
  const suffix = privateMarkerSuffix(attributeName);
  if (node.hasAttribute(`${PRIVATE_HAD_PREFIX}${suffix}`)) return;
  node.setAttribute(
    `${PRIVATE_HAD_PREFIX}${suffix}`,
    node.hasAttribute(attributeName) ? "true" : "false",
  );
  node.setAttribute(
    `${PRIVATE_ORIGINAL_PREFIX}${suffix}`,
    node.getAttribute(attributeName) || "",
  );
  if (replacement == null) node.removeAttribute(attributeName);
  else node.setAttribute(attributeName, replacement);
}

function isNetworkUrl(value = "") {
  return /^(?:https?:)?\/\//i.test(value.trim());
}

function neutralizeExternalCss(css = "") {
  return css
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) =>
      isNetworkUrl(url) ? 'url("data:,")' : match,
    )
    .replace(
      /@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?[^;]*;?/gi,
      (match, quote, url) => (isNetworkUrl(url) ? "" : match),
    );
}

function applyPrivatePreview(doc) {
  PRIVATE_URL_ATTRS.forEach(([selector, attributeName]) => {
    const attributeSelector = attributeName.replace(":", "\\:");
    doc
      .querySelectorAll(`${selector}[${attributeSelector}]`)
      .forEach((node) => {
        const value = node.getAttribute(attributeName) || "";
        if (isNetworkUrl(value))
          rememberAndReplaceAttribute(node, attributeName);
      });
  });

  doc.querySelectorAll("[srcset]").forEach((node) => {
    const candidates = (node.getAttribute("srcset") || "").split(",");
    if (
      candidates.some((candidate) =>
        isNetworkUrl(candidate.trim().split(/\s+/)[0] || ""),
      )
    ) {
      rememberAndReplaceAttribute(node, "srcset");
    }
  });

  doc.querySelectorAll("[style]").forEach((node) => {
    const original = node.getAttribute("style") || "";
    const safe = neutralizeExternalCss(original);
    if (safe !== original) rememberAndReplaceAttribute(node, "style", safe);
  });

  doc.querySelectorAll("style").forEach((node) => {
    const original = node.textContent || "";
    const safe = neutralizeExternalCss(original);
    if (safe !== original) {
      node.setAttribute(`${PRIVATE_HAD_PREFIX}text`, "true");
      node.setAttribute(`${PRIVATE_ORIGINAL_PREFIX}text`, original);
      node.textContent = safe;
    }
  });

  doc.querySelectorAll('meta[http-equiv="refresh" i]').forEach((node) => {
    rememberAndReplaceAttribute(node, "content");
  });

  doc
    .querySelectorAll("form")
    .forEach((node) => rememberAndReplaceAttribute(node, "action"));
  doc
    .querySelectorAll("[formaction]")
    .forEach((node) => rememberAndReplaceAttribute(node, "formaction"));
  doc.querySelectorAll("iframe").forEach((node) => {
    rememberAndReplaceAttribute(node, "src", "about:blank");
    rememberAndReplaceAttribute(node, "srcdoc");
  });
  doc
    .querySelectorAll("object")
    .forEach((node) => rememberAndReplaceAttribute(node, "data"));
  doc
    .querySelectorAll("embed")
    .forEach((node) => rememberAndReplaceAttribute(node, "src"));

  const policy = doc.createElement("meta");
  policy.setAttribute("http-equiv", "Content-Security-Policy");
  policy.setAttribute(PRIVATE_RUNTIME_ATTR, "true");
  policy.setAttribute(
    "content",
    "default-src 'none'; img-src data: blob:; media-src data: blob:; font-src data: blob:; style-src 'unsafe-inline' blob:; script-src 'unsafe-inline' blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'",
  );
  doc.head.prepend(policy);
}

function restorePrivatePreviewDocument(doc) {
  doc
    .querySelectorAll(`[${PRIVATE_RUNTIME_ATTR}]`)
    .forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (!attribute.name.startsWith(PRIVATE_HAD_PREFIX)) return;
      const suffix = attribute.name.slice(PRIVATE_HAD_PREFIX.length);
      const originalName = suffix === "xlink-href" ? "xlink:href" : suffix;
      const originalValue =
        node.getAttribute(`${PRIVATE_ORIGINAL_PREFIX}${suffix}`) || "";
      if (suffix === "text") node.textContent = originalValue;
      else if (attribute.value === "true")
        node.setAttribute(originalName, originalValue);
      else node.removeAttribute(originalName);
      node.removeAttribute(attribute.name);
      node.removeAttribute(`${PRIVATE_ORIGINAL_PREFIX}${suffix}`);
    });
  });
}

export function injectEditorRuntime(
  html,
  sessionToken = "",
  disableUserScripts = false,
  privatePreview = true,
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");

  restorePrivatePreviewDocument(doc);

  if (!doc.querySelector("title")) {
    const title = doc.createElement("title");
    title.textContent = "Untitled document";
    doc.head.appendChild(title);
  }

  doc
    .querySelectorAll(`#${BENNU_SCRIPT_ID}, style[data-bennu-runtime]`)
    .forEach((node) => node.remove());
  doc
    .querySelectorAll(
      `[${SELECTED_ATTR}], [${EDITABLE_ATTR}], [${HOVERED_ATTR}]`,
    )
    .forEach((node) => {
      node.removeAttribute(SELECTED_ATTR);
      node.removeAttribute(EDITABLE_ATTR);
      node.removeAttribute(HOVERED_ATTR);
      node.removeAttribute("contenteditable");
      node.removeAttribute("spellcheck");
    });

  // Antigravity: Disable user scripts inside the iframe to prevent loops/hijacking if safe mode is enabled
  if (disableUserScripts) {
    doc.querySelectorAll("script").forEach((el) => {
      if (el.id === BENNU_SCRIPT_ID) return;
      if (el.hasAttribute("type")) {
        el.setAttribute("data-bennu-orig-type", el.getAttribute("type"));
      }
      el.setAttribute("type", "text/bennu-disabled");
    });

    // Disable inline on* event handlers (e.g. onclick, onload)
    const allElements = doc.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const attrsToRemove = [];
      const attrsToAdd = [];
      for (let j = 0; j < el.attributes.length; j++) {
        const attr = el.attributes[j];
        if (attr.name.startsWith("on")) {
          attrsToAdd.push({
            name: `data-bennu-orig-${attr.name}`,
            value: attr.value,
          });
          attrsToRemove.push(attr.name);
        }
      }
      attrsToRemove.forEach((name) => el.removeAttribute(name));
      attrsToAdd.forEach(({ name, value }) => el.setAttribute(name, value));
    }
  }

  if (privatePreview) applyPrivatePreview(doc);

  const style = doc.createElement("style");
  style.setAttribute("data-bennu-runtime", "true");
  style.textContent = `
    [data-bennu-selected="true"] {
      outline: 2px solid #0f766e !important;
      outline-offset: 3px !important;
      cursor: text !important;
    }

    img[data-bennu-selected="true"],
    video[data-bennu-selected="true"],
    svg[data-bennu-selected="true"] {
      cursor: default !important;
    }

	    [data-bennu-editable="true"] {
	      min-width: 1ch;
	    }

	    [data-bennu-hovered="true"]:not([data-bennu-selected="true"]) {
	      outline: 1px dashed #14b8a6 !important;
	      outline-offset: 3px !important;
	      cursor: pointer !important;
	    }
	  `;
  doc.head.appendChild(style);

  const script = doc.createElement("script");
  script.id = BENNU_SCRIPT_ID;
  script.textContent = `(() => {
    const SELECTED_ATTR = "${SELECTED_ATTR}";
    const EDITABLE_ATTR = "${EDITABLE_ATTR}";
    const HOVERED_ATTR = "${HOVERED_ATTR}";
    const SESSION_TOKEN = ${JSON.stringify(sessionToken)};
    const ignored = new Set(["HTML", "HEAD", "BODY", "SCRIPT", "STYLE", "LINK", "META"]);
    const selectableSelector = "a, button, img, video, section, article, header, footer, main, div, h1, h2, h3, h4, h5, h6, p, span, li, blockquote, figcaption";
    let selected = null;
    let hovered = null;
    let counter = 0;

    function ensureId(node) {
      if (!node.dataset.bennuId) node.dataset.bennuId = "bennu-" + Date.now().toString(36) + "-" + (++counter).toString(36);
      return node.dataset.bennuId;
    }

    function selectorFor(node) {
      if (!node || !node.tagName) return "";
      const parts = [];
      let current = node;
      while (current && current.nodeType === 1 && current.tagName !== "HTML") {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          part += "#" + CSS.escape(current.id);
          parts.unshift(part);
          break;
        }
        const parent = current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((item) => item.tagName === current.tagName);
          if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(" > ");
    }

    function selectedPayload(node) {
      const styles = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const textTags = new Set(["A", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "BLOCKQUOTE", "FIGCAPTION", "LABEL", "STRONG", "EM"]);
      const canEditText = textTags.has(node.tagName) || node.children.length === 0;
      const ancestors = [];
      let ancestor = node;
      while (ancestor && ancestor.nodeType === 1 && !ignored.has(ancestor.tagName)) {
        ancestors.unshift({
          id: ensureId(ancestor),
          tagName: ancestor.tagName.toLowerCase(),
          label: ancestor.id ? "#" + ancestor.id : ancestor.classList.length ? "." + ancestor.classList[0] : ancestor.tagName.toLowerCase()
        });
        ancestor = ancestor.parentElement;
      }
      return {
        id: ensureId(node),
        tagName: node.tagName.toLowerCase(),
        canEditText,
        selector: selectorFor(node),
        text: node.innerText || node.textContent || "",
        html: node.innerHTML || "",
	        src: node.getAttribute("src") || "",
	        href: node.getAttribute("href") || "",
	        alt: node.getAttribute("alt") || "",
	        domId: node.getAttribute("id") || "",
	        className: node.getAttribute("class") || "",
	        title: node.getAttribute("title") || "",
	        target: node.getAttribute("target") || "",
	        display: styles.display,
	        position: styles.position,
	        width: node.style.width || styles.width,
	        height: node.style.height || styles.height,
	        maxWidth: node.style.maxWidth || styles.maxWidth,
	        marginTop: node.style.marginTop || styles.marginTop,
	        marginBottom: node.style.marginBottom || styles.marginBottom,
	        paddingTop: node.style.paddingTop || styles.paddingTop,
	        paddingBottom: node.style.paddingBottom || styles.paddingBottom,
	        textAlign: node.style.textAlign || styles.textAlign,
	        objectFit: node.style.objectFit || styles.objectFit,
	        backgroundColor: node.style.backgroundColor || styles.backgroundColor,
	        color: node.style.color || styles.color,
	        fontSize: node.style.fontSize || styles.fontSize,
	        fontWeight: node.style.fontWeight || styles.fontWeight,
	        lineHeight: node.style.lineHeight || styles.lineHeight,
	        letterSpacing: node.style.letterSpacing || styles.letterSpacing,
	        marginRight: node.style.marginRight || styles.marginRight,
	        marginLeft: node.style.marginLeft || styles.marginLeft,
	        paddingRight: node.style.paddingRight || styles.paddingRight,
	        paddingLeft: node.style.paddingLeft || styles.paddingLeft,
	        ancestors,
	        rect: { width: Math.round(rect.width), height: Math.round(rect.height) }
	      };
	    }

    function cleanClone() {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll("#${BENNU_SCRIPT_ID}, style[data-bennu-runtime]").forEach((node) => node.remove());
	      clone.querySelectorAll("[${PRIVATE_RUNTIME_ATTR}]").forEach((node) => node.remove());
	      clone.querySelectorAll("*").forEach((node) => {
	        Array.from(node.attributes).forEach((attribute) => {
	          if (!attribute.name.startsWith("${PRIVATE_HAD_PREFIX}")) return;
	          const suffix = attribute.name.slice("${PRIVATE_HAD_PREFIX}".length);
	          const originalName = suffix === "xlink-href" ? "xlink:href" : suffix;
	          const originalValue = node.getAttribute("${PRIVATE_ORIGINAL_PREFIX}" + suffix) || "";
	          if (suffix === "text") node.textContent = originalValue;
	          else if (attribute.value === "true") node.setAttribute(originalName, originalValue);
	          else node.removeAttribute(originalName);
	          node.removeAttribute(attribute.name);
	          node.removeAttribute("${PRIVATE_ORIGINAL_PREFIX}" + suffix);
	        });
	      });
	      clone.querySelectorAll("[data-bennu-id], [${SELECTED_ATTR}], [${EDITABLE_ATTR}], [${HOVERED_ATTR}]").forEach((node) => {
	        node.removeAttribute("data-bennu-id");
	        node.removeAttribute("${SELECTED_ATTR}");
	        node.removeAttribute("${EDITABLE_ATTR}");
	        node.removeAttribute("${HOVERED_ATTR}");
	        node.removeAttribute("contenteditable");
	        node.removeAttribute("spellcheck");
	      });
      return "<!doctype html>\\n" + clone.outerHTML;
    }

	    function post(type, payload = {}) {
	      parent.postMessage({ source: "bennu-preview", token: SESSION_TOKEN, type, ...payload }, "*");
	    }

    function select(node) {
      if (!node || ignored.has(node.tagName)) return;
	      if (selected) {
	        selected.removeAttribute(SELECTED_ATTR);
	        selected.removeAttribute(EDITABLE_ATTR);
	        selected.removeAttribute("contenteditable");
	      }
	      if (hovered) hovered.removeAttribute(HOVERED_ATTR);
	      selected = node;
	      hovered = null;
	      selected.setAttribute(SELECTED_ATTR, "true");

      const textTags = new Set(["A", "BUTTON", "H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "BLOCKQUOTE", "FIGCAPTION", "LABEL", "STRONG", "EM"]);
      const canEditText = textTags.has(node.tagName) || node.children.length === 0;
      if (canEditText) {
        selected.setAttribute(EDITABLE_ATTR, "true");
        selected.setAttribute("contenteditable", "true");
        selected.setAttribute("spellcheck", "false");
        selected.focus({ preventScroll: true });
      }

      post("select", { element: selectedPayload(selected), html: cleanClone() });
    }

    window.addEventListener("click", (event) => {
	      const target = event.target.closest(selectableSelector);
	      if (!target) return;
	      event.preventDefault();
	      event.stopPropagation();
	      select(target);
	    }, true);

	    window.addEventListener("mouseover", (event) => {
	      const target = event.target.closest(selectableSelector);
	      if (!target || ignored.has(target.tagName) || target === selected) return;
	      if (hovered && hovered !== target) hovered.removeAttribute(HOVERED_ATTR);
	      hovered = target;
	      hovered.setAttribute(HOVERED_ATTR, "true");
	    }, true);

	    window.addEventListener("mouseout", (event) => {
	      if (!hovered) return;
	      const next = event.relatedTarget;
	      if (next && hovered.contains(next)) return;
	      hovered.removeAttribute(HOVERED_ATTR);
	      hovered = null;
	    }, true);

    window.addEventListener("input", () => {
      if (selected) post("change", { element: selectedPayload(selected), html: cleanClone() });
    }, true);

    window.addEventListener("resize", () => {
      if (selected) post("measure", { element: selectedPayload(selected) });
    });

    window.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        post("save-request", { html: cleanClone() });
      }
      if (event.key === "Escape" && selected) selected.blur();
    }, true);

    window.addEventListener("message", (event) => {
	      const message = event.data || {};
	      if (message.source !== "bennu-host" || message.token !== SESSION_TOKEN || !message.action) return;

	      const node = document.querySelector("[data-bennu-id='" + CSS.escape(message.id || "") + "']");
	      if (!node) return;

      if (message.action === "select-node") {
        select(node);
        return;
      }
      if (message.action === "select-parent") {
        select(node.parentElement);
        return;
      }
      if (message.action === "move-up" && node.previousElementSibling) node.parentElement.insertBefore(node, node.previousElementSibling);
      if (message.action === "move-down" && node.nextElementSibling) node.parentElement.insertBefore(node.nextElementSibling, node);
      if (message.action === "set-text") node.innerText = message.value || "";
      if (message.action === "set-html") node.innerHTML = message.value || "";
      if (message.action === "set-attr") {
        if (message.value === "" || message.value == null) node.removeAttribute(message.name);
        else node.setAttribute(message.name, message.value);
      }
      if (message.action === "set-style") {
        node.style[message.name] = message.value || "";
      }
	      if (message.action === "remove") {
	        const next = node.parentElement;
	        node.remove();
	        selected = null;
	        if (next && !ignored.has(next.tagName)) select(next);
	      } else if (message.action === "duplicate") {
	        const clone = node.cloneNode(true);
	        clone.removeAttribute("data-bennu-id");
	        clone.querySelectorAll("[data-bennu-id]").forEach((child) => child.removeAttribute("data-bennu-id"));
	        node.after(clone);
	        select(clone);
	      } else {
	        select(node);
	      }
      post("change", { element: selected ? selectedPayload(selected) : null, html: cleanClone() });
    });

    post("ready", { title: document.title, html: cleanClone() });
  })();`;
  doc.body.appendChild(script);

  return "<!doctype html>\n" + doc.documentElement.outerHTML;
}

export function extractTitle(html) {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (
      doc.querySelector("title")?.textContent?.trim() || "Untitled document"
    );
  } catch {
    return "Untitled document";
  }
}

export async function formatHtml(html) {
  try {
    const [{ default: prettier }, { default: htmlPlugin }] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/html"),
    ]);
    return await prettier.format(html || "", {
      parser: "html",
      plugins: [htmlPlugin],
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    return html || "";
  }
}

export async function downloadHtml(html, fileName = "document.html") {
  const formatted = await formatHtml(html);
  const blob = new Blob([formatted], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Antigravity: Restore user scripts and inline event handlers back to their original state
export function restoreUserScripts(html) {
  if (!html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  restorePrivatePreviewDocument(doc);

  // Restore script tags
  doc.querySelectorAll('script[type="text/bennu-disabled"]').forEach((el) => {
    if (el.hasAttribute("data-bennu-orig-type")) {
      el.setAttribute("type", el.getAttribute("data-bennu-orig-type"));
      el.removeAttribute("data-bennu-orig-type");
    } else {
      el.removeAttribute("type");
    }
  });

  // Restore inline event handlers
  const allElements = doc.getElementsByTagName("*");
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const attrsToRemove = [];
    const attrsToAdd = [];
    for (let j = 0; j < el.attributes.length; j++) {
      const attr = el.attributes[j];
      if (attr.name.startsWith("data-bennu-orig-on")) {
        const origName = attr.name.slice("data-bennu-orig-".length);
        attrsToAdd.push({ name: origName, value: attr.value });
        attrsToRemove.push(attr.name);
      }
    }
    attrsToRemove.forEach((name) => el.removeAttribute(name));
    attrsToAdd.forEach(({ name, value }) => el.setAttribute(name, value));
  }

  return "<!doctype html>\n" + doc.documentElement.outerHTML;
}
