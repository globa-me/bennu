import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileCode2,
  FolderOpen,
  ImagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  RefreshCw,
  Save,
  Undo2,
} from "lucide-react";
import { InspectorPanel } from "./components/InspectorPanel.jsx";
import { PreviewFrame } from "./components/PreviewFrame.jsx";
import { sampleDocument } from "./lib/sampleDocument.js";
import {
  downloadHtml,
  extractTitle,
  formatHtml,
  injectEditorRuntime,
  readFileAsText,
} from "./lib/htmlSession.js";
import {
  createSiteSessionFromDirectory,
  createSiteSessionFromZip,
  isZipFile,
} from "./lib/sitePackage.js";
import bennuMark from "./assets/bennu-mark.svg";

const HISTORY_LIMIT = 40;
// srcdoc iframes without allow-same-origin have an opaque origin, so targetOrigin
// must remain "*"; the session token plus contentWindow check is the trust boundary.
const PREVIEW_TARGET_ORIGIN = "*";

function makeHistoryEntry(html) {
  return { html, title: extractTitle(html), at: Date.now() };
}

function createPreviewToken() {
  return window.crypto?.randomUUID?.() || `bennu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function App() {
  const iframeRef = useRef(null);
  const htmlRef = useRef(sampleDocument);
  const lastHistoryRef = useRef("");
  const historyTimerRef = useRef(null);
  const siteSessionRef = useRef(null);
  const previewTokenRef = useRef(createPreviewToken());
  const historyIndexRef = useRef(0);
  const [documentHtml, setDocumentHtml] = useState(sampleDocument);
  const [runtimeHtml, setRuntimeHtml] = useState(() => injectEditorRuntime(sampleDocument, previewTokenRef.current));
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [fileName, setFileName] = useState("bennu-demo.html");
  const [packageInfo, setPackageInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [history, setHistory] = useState([makeHistoryEntry(sampleDocument)]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const title = useMemo(() => extractTitle(documentHtml), [documentHtml]);

  const makeRuntimeHtml = useCallback((html) => {
    const session = siteSessionRef.current;
    const previewHtml = session ? session.render(html) : html;
    return injectEditorRuntime(previewHtml, previewTokenRef.current);
  }, []);

  const reloadRuntimeHtml = useCallback((html) => {
    setRuntimeHtml(makeRuntimeHtml(html));
    setRuntimeKey((key) => key + 1);
  }, [makeRuntimeHtml]);

  const restoreFromPreview = useCallback((html) => {
    const session = siteSessionRef.current;
    return session ? session.restore(html) : html;
  }, []);

  const normalizeElement = useCallback((element) => {
    const session = siteSessionRef.current;
    if (!session || !element) return element;
    return {
      ...element,
      src: element.src ? session.restore(element.src) : element.src,
      href: element.href ? session.restore(element.href) : element.href,
    };
  }, []);

  const pushHistory = useCallback((html, immediate = false) => {
    window.clearTimeout(historyTimerRef.current);
    const commit = () => {
      if (!html || html === lastHistoryRef.current) return;
      lastHistoryRef.current = html;
      setHistory((current) => {
        const nextBase = current.slice(0, historyIndexRef.current + 1);
        const next = [...nextBase, makeHistoryEntry(html)].slice(-HISTORY_LIMIT);
        const nextIndex = next.length - 1;
        historyIndexRef.current = nextIndex;
        setHistoryIndex(nextIndex);
        return next;
      });
    };

    if (immediate) commit();
    else historyTimerRef.current = window.setTimeout(commit, 700);
  }, []);

  const loadDocument = useCallback((html, nextFileName = "document.html", siteSession = null) => {
    siteSessionRef.current?.cleanup?.();
    siteSessionRef.current = siteSession;
    previewTokenRef.current = createPreviewToken();
    htmlRef.current = html;
    lastHistoryRef.current = html;
    setDocumentHtml(html);
    reloadRuntimeHtml(html);
    setFileName(nextFileName);
    setPackageInfo(
      siteSession
        ? {
            label: siteSession.label,
            htmlPath: siteSession.htmlPath,
            assetCount: siteSession.assetCount,
            exportMode: siteSession.exportPackage.mode,
          }
        : null,
    );
    setPages(siteSession ? siteSession.getHtmlPaths() : []);
    setSelectedElement(null);
    setStatus(siteSession ? `Loaded site package: ${siteSession.assetCount} assets` : `Loaded ${nextFileName}`);
    const entry = makeHistoryEntry(html);
    setHistory([entry]);
    historyIndexRef.current = 0;
    setHistoryIndex(0);
  }, [reloadRuntimeHtml]);

  useEffect(() => () => siteSessionRef.current?.cleanup?.(), []);

  const handleMessage = useCallback((event) => {
    const message = event.data || {};
    if (event.source !== iframeRef.current?.contentWindow) return;
    if (message.source !== "bennu-preview" || message.token !== previewTokenRef.current) return;

    const restoredHtml = message.html ? restoreFromPreview(message.html) : "";

    if (message.type === "ready") {
      setStatus("Preview ready");
    }

    if (message.type === "select") {
      if (restoredHtml) {
        htmlRef.current = restoredHtml;
        setDocumentHtml(restoredHtml);
      }
      const restoredElement = normalizeElement(message.element || null);
      setSelectedElement(restoredElement);
      setStatus(message.element ? `Selected <${message.element.tagName}>` : "Nothing selected");
      if (restoredHtml) pushHistory(restoredHtml);
    }

    if (message.type === "change") {
      if (restoredHtml) {
        htmlRef.current = restoredHtml;
        setDocumentHtml(restoredHtml);
      }
      setSelectedElement(normalizeElement(message.element || null));
      setStatus("Edited");
      if (restoredHtml) pushHistory(restoredHtml);
    }

    if (message.type === "save-request") {
      void handleExportHtml(restoredHtml || htmlRef.current);
    }
  }, [handleExportHtml, normalizeElement, pushHistory, restoreFromPreview]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const postToPreview = useCallback((payload) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "bennu-host", token: previewTokenRef.current, ...payload },
      PREVIEW_TARGET_ORIGIN,
    );
  }, []);

  const updateSelected = useCallback((action, payload = {}) => {
    if (!selectedElement?.id) return;
    const nextPayload = { ...payload };
    if (
      action === "set-attr" &&
      ["src", "href", "poster", "data", "xlink:href"].includes(payload.name) &&
      payload.value
    ) {
      nextPayload.value = siteSessionRef.current?.previewUrlFor(payload.value) || payload.value;
    }
    postToPreview({ action, id: selectedElement.id, ...nextPayload });
  }, [postToPreview, selectedElement?.id]);

  const handleOpenFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (isZipFile(file)) {
        const siteSession = await createSiteSessionFromZip(file);
        loadDocument(siteSession.html, siteSession.htmlPath.split("/").pop() || "index.html", siteSession);
      } else {
        const html = await readFileAsText(file);
        loadDocument(html, file.name);
        setStatus("Loaded single HTML. Use ZIP or folder if it has relative CSS/images.");
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const handleOpenDirectory = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    try {
      const siteSession = await createSiteSessionFromDirectory(files);
      loadDocument(siteSession.html, siteSession.htmlPath.split("/").pop() || "index.html", siteSession);
    } catch (error) {
      setStatus(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const switchPage = useCallback(async (newHtmlPath) => {
    const session = siteSessionRef.current;
    if (!session || newHtmlPath === session.htmlPath) return;

    // Save current page's HTML to session
    session.updateFile(session.htmlPath, documentHtml);

    // Switch active HTML path
    session.switchHtmlPath(newHtmlPath);

    // Load new HTML content
    const newHtml = await session.getFileText(newHtmlPath);

    htmlRef.current = newHtml;
    lastHistoryRef.current = newHtml;
    setDocumentHtml(newHtml);
    reloadRuntimeHtml(newHtml);
    setFileName(newHtmlPath.split("/").pop() || "index.html");
    setPackageInfo((prev) =>
      prev
        ? {
            ...prev,
            htmlPath: newHtmlPath,
            assetCount: session.assetCount,
          }
        : null,
    );
    setSelectedElement(null);
    setStatus(`Switched to page: ${newHtmlPath.split("/").pop()}`);

    const entry = makeHistoryEntry(newHtml);
    setHistory([entry]);
    historyIndexRef.current = 0;
    setHistoryIndex(0);
  }, [documentHtml, reloadRuntimeHtml]);

  const handleAssetUpload = useCallback(async (file) => {
    const session = siteSessionRef.current;
    if (!session) {
      // Single HTML file mode: fallback to data URL
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }
    const relativePath = await session.addAsset(file);
    // Update package info assetCount since a new asset was added
    setPackageInfo((prev) =>
      prev
        ? {
            ...prev,
            assetCount: session.assetCount,
          }
        : null,
    );
    return relativePath;
  }, []);

  const handleExportHtml = useCallback(async (html = documentHtml) => {
    const session = siteSessionRef.current;
    try {
      if (session) {
        setStatus("Exporting site package...");
        const formattedHtml = await formatHtml(html);
        session.updateFile(session.htmlPath, formattedHtml);

        const zipBlob = await session.exportZip();
        const zipName = `${session.label || "site"}.zip`;
        const url = URL.createObjectURL(zipBlob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = zipName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        setStatus(`Downloaded site package: ${zipName}`);
      } else {
        await downloadHtml(html, fileName);
        setStatus("Downloaded formatted HTML");
      }
    } catch (error) {
      console.error(error);
      setStatus("Could not export package");
    }
  }, [documentHtml, fileName]);

  const handleResetPreview = () => {
    reloadRuntimeHtml(htmlRef.current);
    setStatus("Preview refreshed");
  };

  const handleUndo = () => {
    const nextIndex = Math.max(0, historyIndex - 1);
    const entry = history[nextIndex];
    if (!entry) return;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    htmlRef.current = entry.html;
    setDocumentHtml(entry.html);
    reloadRuntimeHtml(entry.html);
    setSelectedElement(null);
    setStatus("Undo");
  };

  const handleRedo = () => {
    const nextIndex = Math.min(history.length - 1, historyIndex + 1);
    const entry = history[nextIndex];
    if (!entry) return;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    htmlRef.current = entry.html;
    setDocumentHtml(entry.html);
    reloadRuntimeHtml(entry.html);
    setSelectedElement(null);
    setStatus("Redo");
  };

  const shellClassName = [
    "app-shell",
    !isSidebarOpen ? "sidebar-collapsed" : "",
    !isInspectorOpen ? "inspector-collapsed" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={shellClassName}>
      {isSidebarOpen ? <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <img src={bennuMark} alt="Bennu bird" />
          </div>
          <div>
            <h1>Bennu</h1>
            <p>Live HTML editor</p>
          </div>
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setIsSidebarOpen(false)}
            title="Hide left panel"
          >
            <PanelLeftClose size={17} />
          </button>
        </div>

        <label className="file-drop">
          <FolderOpen size={18} />
          <span>Open HTML or ZIP</span>
          <input type="file" accept=".html,.htm,.zip,text/html,application/zip" onChange={handleOpenFile} />
        </label>

        <label className="sidebar-action">
          <FolderOpen size={17} />
          Open site folder
          <input type="file" webkitdirectory="true" directory="" multiple onChange={handleOpenDirectory} />
        </label>

        <button className="sidebar-action" type="button" onClick={() => void handleExportHtml()}>
          <Download size={17} />
          Export current HTML
        </button>

        <button className="sidebar-action" type="button" onClick={() => loadDocument(sampleDocument, "bennu-demo.html")}>
          <FileCode2 size={17} />
          Load demo document
        </button>

        <div className="doc-card">
          <span>Document</span>
          <strong>{title}</strong>
          <small>{fileName}</small>
        </div>

        {packageInfo ? (
          <div className="doc-card">
            <span>Site package</span>
            <strong>{packageInfo.label}</strong>
            <small>{packageInfo.htmlPath} · {packageInfo.assetCount} resources linked for preview · {packageInfo.exportMode}</small>
          </div>
        ) : null}

        {packageInfo && pages.length > 1 ? (
          <div className="doc-card">
            <span>Site Pages</span>
            <div className="pages-list">
              {pages.map((pagePath) => {
                const isActive = pagePath === packageInfo.htmlPath;
                const name = pagePath.split("/").pop();
                return (
                  <button
                    key={pagePath}
                    className={`page-item ${isActive ? "active" : ""}`}
                    onClick={() => void switchPage(pagePath)}
                    title={pagePath}
                    type="button"
                  >
                    <FileCode2 size={14} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="doc-card">
          <span>Editing model</span>
          <strong>Direct DOM preview</strong>
          <small>Bennu saves the edited DOM as formatted HTML; original source formatting may change.</small>
        </div>
      </aside> : null}

      <main className="workspace">
        <header className="topbar">
          <div className="toolbar-group">
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              title={isSidebarOpen ? "Hide left panel" : "Show left panel"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <button type="button" className="icon-button" onClick={handleUndo} disabled={historyIndex === 0} title="Undo">
              <Undo2 size={18} />
            </button>
            <button type="button" className="icon-button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
              <Undo2 size={18} className="flip-x" />
            </button>
            <button type="button" className="icon-button" onClick={handleResetPreview} title="Refresh editable preview">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="topbar-title">
            <strong>{fileName}</strong>
            <span>{status}</span>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              className={`text-button ${isInspectorOpen ? "active" : ""}`}
              onClick={() => setIsInspectorOpen((open) => !open)}
              title={isInspectorOpen ? "Hide inspector" : "Show inspector"}
            >
              {isInspectorOpen ? <PanelRightClose size={17} /> : <PanelRight size={17} />}
              Inspector
            </button>
            <button type="button" className="primary-button" onClick={() => void handleExportHtml()}>
              <Save size={17} />
              Save HTML
            </button>
          </div>
        </header>

        <section className="canvas-stage">
          <PreviewFrame iframeRef={iframeRef} runtimeHtml={runtimeHtml} runtimeKey={runtimeKey} />
        </section>
      </main>

      {isInspectorOpen ? <aside className="right-panel">
        <div className="panel-titlebar">
          <strong>Inspector</strong>
          <button type="button" className="panel-toggle" onClick={() => setIsInspectorOpen(false)} title="Hide inspector">
            <PanelRightClose size={17} />
          </button>
        </div>
        <InspectorPanel
          selectedElement={selectedElement}
          updateSelected={updateSelected}
          onAssetUpload={handleAssetUpload}
        />
      </aside> : null}

      <div className="mobile-actions">
        <label className="primary-button">
          <ImagePlus size={17} />
          Open
          <input type="file" accept=".html,.htm,.zip,text/html,application/zip" onChange={handleOpenFile} />
        </label>
        <button type="button" className="primary-button" onClick={() => void handleExportHtml()}>
          <Save size={17} />
          Save
        </button>
      </div>
    </div>
  );
}
