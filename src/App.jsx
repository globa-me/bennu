// Antigravity: Refactored to extract core state managers into custom hooks,
// add device viewport simulation, and support a safe no-script mode toggle.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { InspectorPanel } from "./components/InspectorPanel.jsx";
import { PreviewFrame } from "./components/PreviewFrame.jsx";
import { sampleDocument } from "./lib/sampleDocument.js";
import {
  injectEditorRuntime,
  extractTitle,
} from "./lib/htmlSession.js";

// Antigravity: Import custom hooks
import { useHistory } from "./hooks/useHistory.js";
import { useExportHtml } from "./hooks/useExportHtml.js";
import { useSiteLoader } from "./hooks/useSiteLoader.js";
import { usePreviewSession } from "./hooks/usePreviewSession.js";

function createPreviewToken() {
  return window.crypto?.randomUUID?.() || `bennu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function App() {
  const iframeRef = useRef(null);
  const htmlRef = useRef(sampleDocument);
  const siteSessionRef = useRef(null);
  const previewTokenRef = useRef(createPreviewToken());

  // Antigravity: UI Simulator & Script mode state
  const [viewportWidth, setViewportWidth] = useState("100%");
  const [customViewportWidth, setCustomViewportWidth] = useState(1024);
  const [isPortrait, setIsPortrait] = useState(true);
  const [disableUserScripts, setDisableUserScripts] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const [documentHtml, setDocumentHtml] = useState(sampleDocument);
  const [runtimeHtml, setRuntimeHtml] = useState(() => injectEditorRuntime(sampleDocument, previewTokenRef.current, true));
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [fileName, setFileName] = useState("bennu-demo.html");
  const [packageInfo, setPackageInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const title = useMemo(() => extractTitle(documentHtml), [documentHtml]);
  const outline = useMemo(() => {
    const doc = new DOMParser().parseFromString(documentHtml, "text/html");
    return Array.from(doc.body.querySelectorAll("header, main, section, article, footer")).slice(0, 14).map((node, index) => ({
      key: `${node.tagName}-${index}`,
      tag: node.tagName.toLowerCase(),
      label: node.id ? `#${node.id}` : node.querySelector("h1, h2, h3")?.textContent?.trim().slice(0, 34) || node.classList[0] || node.tagName.toLowerCase(),
    }));
  }, [documentHtml]);

  // Antigravity: Integrate useHistory hook
  const {
    pushHistory,
    handleUndo,
    handleRedo,
    resetHistory,
    canUndo,
    canRedo,
  } = useHistory(sampleDocument);

  // Antigravity: Integrate useExportHtml hook
  const { handleExportHtml } = useExportHtml(
    siteSessionRef,
    documentHtml,
    fileName,
    setStatus
  );
  const exportDocument = useCallback(async () => {
    const saved = await handleExportHtml();
    if (saved) setIsDirty(false);
  }, [handleExportHtml]);

  // Antigravity: Integrate usePreviewSession hook
  const {
    updateSelected,
    normalizeElement,
  } = usePreviewSession({
    iframeRef,
    previewTokenRef,
    siteSessionRef,
    selectedElement,
    setSelectedElement,
    setDocumentHtml,
    pushHistory,
    handleExportHtml,
    disableUserScripts,
    setStatus,
    setIsDirty,
    htmlRef,
  });

  const makeRuntimeHtml = useCallback((html) => {
    const session = siteSessionRef.current;
    const previewHtml = session ? session.render(html) : html;
    // Antigravity: Pass disableUserScripts flag down to iframe runtime injection
    return injectEditorRuntime(previewHtml, previewTokenRef.current, disableUserScripts);
  }, [disableUserScripts]);

  const reloadRuntimeHtml = useCallback((html) => {
    setRuntimeHtml(makeRuntimeHtml(html));
    setRuntimeKey((key) => key + 1);
  }, [makeRuntimeHtml]);

  // Antigravity: Setup loadDocument callback first
  const loadDocument = useCallback((html, nextFileName = "document.html", siteSession = null) => {
    siteSessionRef.current?.cleanup?.();
    siteSessionRef.current = siteSession;
    previewTokenRef.current = createPreviewToken();
    htmlRef.current = html;
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
    setIsDirty(false);
    resetHistory(html);
  }, [reloadRuntimeHtml, resetHistory]);

  // Antigravity: Integrate useSiteLoader hook
  const { handleOpenFile, handleOpenDirectory } = useSiteLoader(loadDocument, setStatus);

  useEffect(() => () => siteSessionRef.current?.cleanup?.(), []);

  useEffect(() => {
    const warnBeforeClose = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeClose);
    return () => window.removeEventListener("beforeunload", warnBeforeClose);
  }, [isDirty]);

  useEffect(() => {
    const handleGlobalSave = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void exportDocument();
      }
    };
    window.addEventListener("keydown", handleGlobalSave);
    return () => window.removeEventListener("keydown", handleGlobalSave);
  }, [exportDocument]);

  // Antigravity: Reload iframe whenever the script mode is toggled
  useEffect(() => {
    reloadRuntimeHtml(htmlRef.current);
  }, [disableUserScripts, reloadRuntimeHtml]);

  const handleResetPreview = () => {
    reloadRuntimeHtml(htmlRef.current);
    setStatus("Preview refreshed");
  };

  const triggerUndo = () => {
    const restored = handleUndo();
    if (restored !== null) {
      htmlRef.current = restored;
      setDocumentHtml(restored);
      reloadRuntimeHtml(restored);
      setSelectedElement(null);
      setStatus("Undo");
      setIsDirty(true);
    }
  };

  const triggerRedo = () => {
    const restored = handleRedo();
    if (restored !== null) {
      htmlRef.current = restored;
      setDocumentHtml(restored);
      reloadRuntimeHtml(restored);
      setSelectedElement(null);
      setStatus("Redo");
      setIsDirty(true);
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
    resetHistory(newHtml);
  }, [documentHtml, reloadRuntimeHtml, resetHistory]);

  const handleAssetUpload = useCallback(async (file) => {
    const session = siteSessionRef.current;
    if (!session) {
      // Single HTML file mode fallback (should not happen now with virtual session, but kept for safety)
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
          <span>Open project</span>
          <small>HTML or ZIP package</small>
          <input type="file" accept=".html,.htm,.zip,text/html,application/zip" onChange={handleOpenFile} />
        </label>

        <label className="sidebar-action secondary-action">
          <FolderOpen size={17} />
          Open site folder
          <input type="file" webkitdirectory="true" directory="" multiple onChange={handleOpenDirectory} />
        </label>

        <button className="sidebar-action secondary-action" type="button" onClick={() => loadDocument(sampleDocument, "bennu-demo.html")}>
          <FileCode2 size={17} />
          Load demo document
        </button>

        <div className="doc-card">
          <span>Document</span>
          <strong>{title}</strong>
          <small>{fileName}</small>
        </div>

        <details className="sidebar-disclosure" open>
          <summary>Document outline <span>{outline.length}</span></summary>
          <div className="outline-list">{outline.map((item) => <div key={item.key}><code>{item.tag}</code><span>{item.label}</span></div>)}</div>
        </details>

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

        <details className="sidebar-disclosure"><summary>About editing</summary><p>Bennu edits the browser DOM and exports formatted HTML. Original whitespace and attribute order may change.</p></details>
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
            <button type="button" className="icon-button" onClick={triggerUndo} disabled={!canUndo} title="Undo">
              <Undo2 size={18} />
            </button>
            <button type="button" className="icon-button" onClick={triggerRedo} disabled={!canRedo} title="Redo">
              <Undo2 size={18} className="flip-x" />
            </button>
            <button type="button" className="icon-button" onClick={handleResetPreview} title="Refresh editable preview">
              <RefreshCw size={18} />
            </button>

            {/* Antigravity: Viewport simulator controls */}
            <button
              type="button"
              className={`icon-button ${viewportWidth === "100%" ? "active" : ""}`}
              onClick={() => setViewportWidth("100%")}
              title="Desktop width"
              aria-pressed={viewportWidth === "100%"}
            >
              <Monitor size={17} />
            </button>
            <button
              type="button"
              className={`icon-button ${viewportWidth === "768px" ? "active" : ""}`}
              onClick={() => setViewportWidth("768px")}
              title="Tablet width"
              aria-pressed={viewportWidth === "768px"}
            >
              <Tablet size={17} />
            </button>
            <button
              type="button"
              className={`icon-button ${viewportWidth === "375px" ? "active" : ""}`}
              onClick={() => setViewportWidth("375px")}
              title="Mobile width"
              aria-pressed={viewportWidth === "375px"}
            >
              <Smartphone size={17} />
            </button>
            <div className="custom-viewport">
              <input aria-label="Custom preview width" type="number" min="280" max="1920" value={customViewportWidth} onChange={(event) => setCustomViewportWidth(Math.max(280, Math.min(1920, Number(event.target.value) || 280)))} onBlur={() => setViewportWidth(`${customViewportWidth}px`)} />
              <span>px</span>
            </div>
            <button type="button" className="icon-button" onClick={() => { setIsPortrait((value) => !value); setViewportWidth(`${isPortrait ? 667 : 375}px`); }} title="Rotate device" aria-label="Rotate preview device"><RotateCw size={17} /></button>
          </div>

          <div className="topbar-title">
            <strong>{fileName}{isDirty ? " •" : ""}</strong>
            <span className={isDirty ? "dirty-status" : ""}>{isDirty ? "Unsaved changes" : status}</span>
          </div>

          <div className="toolbar-group">
            {/* Antigravity: Script execution toggle moved to right toolbar group to avoid overlaps */}
            <button
              type="button"
              className={`text-button ${disableUserScripts ? "active" : ""}`}
              onClick={() => setDisableUserScripts((prev) => !prev)}
              title={disableUserScripts ? "Enable user scripts (caution)" : "Disable user scripts (safe)"}
              aria-pressed={disableUserScripts}
            >
              {disableUserScripts ? <Shield size={16} /> : <ShieldAlert size={16} />}
              {disableUserScripts ? "Safe Mode" : "Scripts Active"}
            </button>

            <button
              type="button"
              className={`text-button ${isInspectorOpen ? "active" : ""}`}
              onClick={() => setIsInspectorOpen((open) => !open)}
              title={isInspectorOpen ? "Hide inspector" : "Show inspector"}
              aria-pressed={isInspectorOpen}
            >
              {isInspectorOpen ? <PanelRightClose size={17} /> : <PanelRight size={17} />}
              Inspector
            </button>
            <button type="button" className="primary-button" onClick={() => void exportDocument()}>
              <Save size={17} />
              Export
            </button>
          </div>
        </header>

        <section className="canvas-stage">
          {/* Antigravity: Pass viewportWidth down to PreviewFrame */}
          <PreviewFrame
            iframeRef={iframeRef}
            runtimeHtml={runtimeHtml}
            runtimeKey={runtimeKey}
          viewportWidth={viewportWidth}
          />
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
        <button type="button" className="primary-button" onClick={() => void exportDocument()}>
          <Save size={17} />
          Save
        </button>
      </div>
      <div className="status-announcer" role="status" aria-live="polite">{status}</div>
    </div>
  );
}

// Antigravity: Import logo asset correctly at bottom/top scope
import bennuMark from "./assets/bennu-mark.svg";
