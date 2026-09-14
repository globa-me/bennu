import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
  FileCode2,
  FolderOpen,
  ImagePlus,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  RefreshCw,
  RotateCw,
  Save,
  Shield,
  ShieldAlert,
  Smartphone,
  Tablet,
  Undo2,
  WifiOff,
} from "lucide-react";
import { GuidedTour } from "./components/GuidedTour.jsx";
import { HelpCenter } from "./components/HelpCenter.jsx";
import { HelpPopover } from "./components/HelpPopover.jsx";
import { InspectorPanel } from "./components/InspectorPanel.jsx";
import { PreviewFrame } from "./components/PreviewFrame.jsx";
import { WelcomeIntro } from "./components/WelcomeIntro.jsx";
import { useExportHtml } from "./hooks/useExportHtml.js";
import { useHistory } from "./hooks/useHistory.js";
import { usePreviewSession } from "./hooks/usePreviewSession.js";
import { useSiteLoader } from "./hooks/useSiteLoader.js";
import { extractTitle, injectEditorRuntime } from "./lib/htmlSession.js";
import { createTranslator } from "./lib/i18n.js";
import {
  clearLocalProjects,
  deleteLocalProject,
  loadLocalProject,
  requestPersistentStorage,
  saveLocalProject,
} from "./lib/localWorkspace.js";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  resetPreferences,
  savePreferences,
} from "./lib/preferences.js";
import { getSampleDocument, sampleDocument } from "./lib/sampleDocument.js";
import { createSiteSession } from "./lib/sitePackage.js";
import bennuMark from "./assets/bennu-mark.svg";

const ONBOARDING_VERSION = 1;
const RECOVERY_PROJECT_ID = "last-session";

function createPreviewToken() {
  return (
    window.crypto?.randomUUID?.() ||
    `bennu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

function widthFromPreferences(viewport) {
  if (viewport.preset === "tablet") return "768px";
  if (viewport.preset === "mobile")
    return viewport.portrait ? "375px" : "667px";
  if (viewport.preset === "custom") return `${viewport.customWidth}px`;
  return "100%";
}

function presetFromWidth(width) {
  if (width === "100%") return "desktop";
  if (width === "768px") return "tablet";
  if (width === "375px" || width === "667px") return "mobile";
  return "custom";
}

function isCompactViewport() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 920px)").matches
  );
}

function formatRecoveryTime(timestamp, language) {
  try {
    return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function App() {
  const initialPreferencesRef = useRef(loadPreferences());
  const initialPreferences = initialPreferencesRef.current;
  const iframeRef = useRef(null);
  const openFileInputRef = useRef(null);
  const htmlRef = useRef(sampleDocument);
  const siteSessionRef = useRef(null);
  const previewTokenRef = useRef(createPreviewToken());
  const autosaveTimerRef = useRef(null);

  const [language, setLanguage] = useState(initialPreferences.language);
  const t = useMemo(() => createTranslator(language), [language]);
  const [viewportWidth, setViewportWidth] = useState(() =>
    widthFromPreferences(initialPreferences.viewport),
  );
  const [customViewportWidth, setCustomViewportWidth] = useState(
    initialPreferences.viewport.customWidth,
  );
  const [isPortrait, setIsPortrait] = useState(
    initialPreferences.viewport.portrait,
  );
  const [disableUserScripts, setDisableUserScripts] = useState(true);
  const [privatePreview, setPrivatePreview] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false);
  const [hasActiveProject, setHasActiveProject] = useState(false);
  const [recoveryProject, setRecoveryProject] = useState(null);
  const [localSavedAt, setLocalSavedAt] = useState(null);

  const [documentHtml, setDocumentHtml] = useState(sampleDocument);
  const [runtimeHtml, setRuntimeHtml] = useState(() =>
    injectEditorRuntime(sampleDocument, previewTokenRef.current, true, true),
  );
  const [runtimeKey, setRuntimeKey] = useState(0);
  const [fileName, setFileName] = useState("bennu-demo.html");
  const [packageInfo, setPackageInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState(() => t("app.ready"));
  const [selectedElement, setSelectedElement] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    isCompactViewport() ? false : initialPreferences.panels.sidebarOpen,
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState(
    isCompactViewport() ? false : initialPreferences.panels.inspectorOpen,
  );
  const [onboardingVersion, setOnboardingVersion] = useState(
    initialPreferences.onboardingVersion,
  );
  const [showIntro, setShowIntro] = useState(
    initialPreferences.onboardingVersion < ONBOARDING_VERSION,
  );
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const title = useMemo(() => extractTitle(documentHtml), [documentHtml]);
  const outline = useMemo(() => {
    const doc = new DOMParser().parseFromString(documentHtml, "text/html");
    return Array.from(
      doc.body.querySelectorAll("header, main, section, article, footer"),
    )
      .slice(0, 14)
      .map((node, index) => ({
        key: `${node.tagName}-${index}`,
        tag: node.tagName.toLowerCase(),
        label: node.id
          ? `#${node.id}`
          : node
              .querySelector("h1, h2, h3")
              ?.textContent?.trim()
              .slice(0, 34) ||
            node.classList[0] ||
            node.tagName.toLowerCase(),
      }));
  }, [documentHtml]);

  const {
    pushHistory,
    handleUndo,
    handleRedo,
    resetHistory,
    canUndo,
    canRedo,
  } = useHistory(sampleDocument);
  const { handleExportHtml } = useExportHtml(
    siteSessionRef,
    documentHtml,
    fileName,
    setStatus,
    t,
  );
  const exportDocument = useCallback(async () => {
    const saved = await handleExportHtml();
    if (saved) setIsDirty(false);
  }, [handleExportHtml]);

  const { updateSelected } = usePreviewSession({
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
    t,
  });

  const makeRuntimeHtml = useCallback(
    (html) => {
      const session = siteSessionRef.current;
      const previewHtml = session ? session.render(html) : html;
      return injectEditorRuntime(
        previewHtml,
        previewTokenRef.current,
        disableUserScripts,
        privatePreview,
      );
    },
    [disableUserScripts, privatePreview],
  );

  const reloadRuntimeHtml = useCallback(
    (html) => {
      setRuntimeHtml(makeRuntimeHtml(html));
      setRuntimeKey((key) => key + 1);
    },
    [makeRuntimeHtml],
  );

  const loadDocument = useCallback(
    (html, nextFileName = "document.html", siteSession = null) => {
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
      setStatus(
        siteSession
          ? t("app.loadedPackage", { count: siteSession.assetCount })
          : t("app.loadedFile", { name: nextFileName }),
      );
      setIsDirty(false);
      setHasActiveProject(true);
      resetHistory(html);
    },
    [reloadRuntimeHtml, resetHistory, t],
  );

  const { handleOpenFile, handleOpenDirectory } = useSiteLoader(
    loadDocument,
    setStatus,
    t,
  );

  const triggerUndo = useCallback(() => {
    const restored = handleUndo();
    if (restored === null) return;
    htmlRef.current = restored;
    setDocumentHtml(restored);
    reloadRuntimeHtml(restored);
    setSelectedElement(null);
    setStatus(t("app.undoStatus"));
    setIsDirty(true);
  }, [handleUndo, reloadRuntimeHtml, t]);

  const triggerRedo = useCallback(() => {
    const restored = handleRedo();
    if (restored === null) return;
    htmlRef.current = restored;
    setDocumentHtml(restored);
    reloadRuntimeHtml(restored);
    setSelectedElement(null);
    setStatus(t("app.redoStatus"));
    setIsDirty(true);
  }, [handleRedo, reloadRuntimeHtml, t]);

  useEffect(() => {
    document.documentElement.lang = language;
    savePreferences({
      version: 1,
      language,
      panels: { sidebarOpen: isSidebarOpen, inspectorOpen: isInspectorOpen },
      viewport: {
        preset: presetFromWidth(viewportWidth),
        customWidth: customViewportWidth,
        portrait: isPortrait,
      },
      onboardingVersion,
    });
  }, [
    language,
    isSidebarOpen,
    isInspectorOpen,
    viewportWidth,
    customViewportWidth,
    isPortrait,
    onboardingVersion,
  ]);

  useEffect(() => {
    void loadLocalProject(RECOVERY_PROJECT_ID)
      .then(setRecoveryProject)
      .catch(() => {});
    void requestPersistentStorage();
  }, []);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine !== false);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(autosaveTimerRef.current);
      siteSessionRef.current?.cleanup?.();
    },
    [],
  );

  useEffect(() => {
    if (!hasActiveProject) return undefined;
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        const session = siteSessionRef.current;
        let files;
        let activeHtmlPath = fileName;
        if (session) {
          session.updateFile(session.htmlPath, documentHtml);
          files = session.getFiles();
          activeHtmlPath = session.htmlPath;
        } else {
          files = new Map([
            [
              fileName,
              new Blob([documentHtml], { type: "text/html;charset=utf-8" }),
            ],
          ]);
        }
        const saved = await saveLocalProject({
          id: RECOVERY_PROJECT_ID,
          name: packageInfo?.label || fileName,
          activeHtmlPath,
          currentHtml: documentHtml,
          files,
          metadata: { fileName, packageInfo },
          createdAt: recoveryProject?.createdAt,
        });
        setRecoveryProject(saved);
        setLocalSavedAt(saved.updatedAt);
      } catch {
        // The editor and export remain usable if storage is unavailable or full.
      }
    }, 1200);
    return () => window.clearTimeout(autosaveTimerRef.current);
  }, [
    documentHtml,
    fileName,
    hasActiveProject,
    packageInfo,
    recoveryProject?.createdAt,
  ]);

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
    const handleGlobalShortcuts = (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void exportDocument();
      }
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? triggerRedo() : triggerUndo();
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [exportDocument, triggerRedo, triggerUndo]);

  useEffect(() => {
    reloadRuntimeHtml(htmlRef.current);
  }, [disableUserScripts, privatePreview, reloadRuntimeHtml]);

  useEffect(() => {
    if (selectedElement && isCompactViewport()) {
      setIsSidebarOpen(false);
      setIsInspectorOpen(true);
    }
  }, [selectedElement]);

  const switchPage = useCallback(
    async (newHtmlPath) => {
      const session = siteSessionRef.current;
      if (!session || newHtmlPath === session.htmlPath) return;
      session.updateFile(session.htmlPath, documentHtml);
      session.switchHtmlPath(newHtmlPath);
      const newHtml = await session.getFileText(newHtmlPath);
      const nextName = newHtmlPath.split("/").pop() || "index.html";
      htmlRef.current = newHtml;
      setDocumentHtml(newHtml);
      reloadRuntimeHtml(newHtml);
      setFileName(nextName);
      setPackageInfo((previous) =>
        previous
          ? {
              ...previous,
              htmlPath: newHtmlPath,
              assetCount: session.assetCount,
            }
          : null,
      );
      setSelectedElement(null);
      setStatus(t("app.switchedPage", { name: nextName }));
      resetHistory(newHtml);
    },
    [documentHtml, reloadRuntimeHtml, resetHistory, t],
  );

  const handleAssetUpload = useCallback(async (file) => {
    const session = siteSessionRef.current;
    if (!session)
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    const relativePath = await session.addAsset(file);
    setPackageInfo((previous) =>
      previous ? { ...previous, assetCount: session.assetCount } : null,
    );
    return relativePath;
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingVersion(ONBOARDING_VERSION);
    setShowIntro(false);
    setShowTour(false);
  }, []);

  const handleIntroFile = useCallback(
    async (event) => {
      await handleOpenFile(event);
      setShowIntro(false);
      setShowTour(true);
    },
    [handleOpenFile],
  );

  const handleTryDemo = useCallback(() => {
    loadDocument(getSampleDocument(language), "bennu-demo.html");
    setShowIntro(false);
    setShowTour(true);
  }, [language, loadDocument]);

  const changeLanguage = useCallback(
    (nextLanguage) => {
      setLanguage(nextLanguage);
      if (!hasActiveProject) {
        const demo = getSampleDocument(nextLanguage);
        htmlRef.current = demo;
        setDocumentHtml(demo);
        reloadRuntimeHtml(demo);
        resetHistory(demo);
      }
    },
    [hasActiveProject, reloadRuntimeHtml, resetHistory],
  );

  const restoreRecovery = useCallback(async () => {
    if (!recoveryProject) return;
    const session = await createSiteSession(
      recoveryProject.files,
      recoveryProject.name,
    );
    if (
      recoveryProject.activeHtmlPath &&
      session.getHtmlPaths().includes(recoveryProject.activeHtmlPath)
    )
      session.switchHtmlPath(recoveryProject.activeHtmlPath);
    const html =
      recoveryProject.currentHtml ||
      (await session.getFileText(session.htmlPath));
    loadDocument(
      html,
      recoveryProject.metadata?.fileName || session.htmlPath.split("/").pop(),
      session,
    );
    setStatus(t("app.restoredDraft"));
    setRecoveryProject(null);
  }, [loadDocument, recoveryProject, t]);

  const discardRecovery = useCallback(async () => {
    await deleteLocalProject(RECOVERY_PROJECT_ID).catch(() => {});
    setRecoveryProject(null);
  }, []);

  const clearLocalData = useCallback(async () => {
    if (!window.confirm(t("app.clearConfirm"))) return;
    await clearLocalProjects().catch(() => {});
    resetPreferences();
    setRecoveryProject(null);
    setLocalSavedAt(null);
    setLanguage(DEFAULT_PREFERENCES.language);
    setOnboardingVersion(0);
    setShowHelp(false);
    setShowIntro(true);
    setStatus(t("app.localDataCleared"));
  }, [t]);

  const togglePrivatePreview = () => {
    setPrivatePreview((enabled) => {
      const next = !enabled;
      setStatus(next ? t("app.privateEnabled") : t("app.externalEnabled"));
      return next;
    });
  };

  const toggleScripts = () => {
    if (disableUserScripts && !window.confirm(t("app.scriptWarning"))) return;
    setDisableUserScripts((disabled) => !disabled);
  };

  const shellClassName = [
    "app-shell",
    !isSidebarOpen ? "sidebar-collapsed" : "",
    !isInspectorOpen ? "inspector-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      {isSidebarOpen ? (
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <img src={bennuMark} alt="Bennu bird" />
            </div>
            <div>
              <h1>Bennu</h1>
              <p>{t("app.productSubtitle")}</p>
            </div>
            <button
              type="button"
              className="panel-toggle"
              onClick={() => setIsSidebarOpen(false)}
              title={t("app.hidePanel")}
            >
              <PanelLeftClose size={17} />
            </button>
          </div>

          <div className="action-with-help" data-tour-target="open-project">
            <label className="file-drop">
              <FolderOpen size={18} />
              <span>{t("app.openProject")}</span>
              <small>HTML / ZIP</small>
              <input
                ref={openFileInputRef}
                type="file"
                accept=".html,.htm,.zip,text/html,application/zip"
                onChange={showIntro ? handleIntroFile : handleOpenFile}
              />
            </label>
            <HelpPopover language={language} topic="openProject" />
          </div>
          <div className="action-with-help">
            <label className="sidebar-action secondary-action">
              <FolderOpen size={17} />
              {t("app.openFolder")}
              <input
                type="file"
                webkitdirectory="true"
                directory=""
                multiple
                onChange={handleOpenDirectory}
              />
            </label>
            <HelpPopover language={language} topic="openFolder" />
          </div>
          <button
            className="sidebar-action secondary-action"
            type="button"
            onClick={() =>
              loadDocument(getSampleDocument(language), "bennu-demo.html")
            }
          >
            <FileCode2 size={17} />
            {t("app.loadDemo")}
          </button>
          <div className="doc-card">
            <span>{t("app.document")}</span>
            <strong>{title}</strong>
            <small>{fileName}</small>
          </div>
          <details className="sidebar-disclosure" open>
            <summary>
              <span className="summary-label">
                {t("app.outline")}{" "}
                <HelpPopover language={language} topic="outline" />
              </span>
              <span>{outline.length}</span>
            </summary>
            <div className="outline-list">
              {outline.map((item) => (
                <div key={item.key}>
                  <code>{item.tag}</code>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </details>
          {packageInfo ? (
            <div className="doc-card">
              <span>{t("app.sitePackage")}</span>
              <strong>{packageInfo.label}</strong>
              <small>
                {packageInfo.htmlPath} · {packageInfo.assetCount}{" "}
                {t("app.resources")} · {t("app.packageReady")}
              </small>
            </div>
          ) : null}
          {packageInfo && pages.length > 1 ? (
            <div className="doc-card">
              <span>{t("app.pages")}</span>
              <div className="pages-list">
                {pages.map((pagePath) => {
                  const isActive = pagePath === packageInfo.htmlPath;
                  return (
                    <button
                      key={pagePath}
                      className={`page-item ${isActive ? "active" : ""}`}
                      onClick={() => void switchPage(pagePath)}
                      title={pagePath}
                      type="button"
                    >
                      <FileCode2 size={14} />
                      <span>{pagePath.split("/").pop()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <details className="sidebar-disclosure">
            <summary>{t("app.aboutEditing")}</summary>
            <p>{t("app.aboutEditingBody")}</p>
          </details>
        </aside>
      ) : null}

      <main className="workspace">
        <header className="topbar">
          <div className="toolbar-group">
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              title={isSidebarOpen ? t("app.hidePanel") : t("app.showPanel")}
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={triggerUndo}
              disabled={!canUndo}
              title={t("app.undo")}
            >
              <Undo2 size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={triggerRedo}
              disabled={!canRedo}
              title={t("app.redo")}
            >
              <Undo2 size={18} className="flip-x" />
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                reloadRuntimeHtml(htmlRef.current);
                setStatus(t("app.previewRefreshed"));
              }}
              title={t("app.refresh")}
            >
              <RefreshCw size={18} />
            </button>
            <div className="viewport-tools" data-tour-target="viewport">
              <button
                type="button"
                className={`icon-button ${viewportWidth === "100%" ? "active" : ""}`}
                onClick={() => setViewportWidth("100%")}
                title={t("app.desktop")}
                aria-pressed={viewportWidth === "100%"}
              >
                <Monitor size={17} />
              </button>
              <button
                type="button"
                className={`icon-button ${viewportWidth === "768px" ? "active" : ""}`}
                onClick={() => setViewportWidth("768px")}
                title={t("app.tablet")}
                aria-pressed={viewportWidth === "768px"}
              >
                <Tablet size={17} />
              </button>
              <button
                type="button"
                className={`icon-button ${viewportWidth === "375px" ? "active" : ""}`}
                onClick={() => {
                  setIsPortrait(true);
                  setViewportWidth("375px");
                }}
                title={t("app.mobile")}
                aria-pressed={viewportWidth === "375px"}
              >
                <Smartphone size={17} />
              </button>
              <div className="custom-viewport">
                <input
                  aria-label={t("app.customWidth")}
                  type="number"
                  min="280"
                  max="1920"
                  value={customViewportWidth}
                  onChange={(event) =>
                    setCustomViewportWidth(
                      Math.max(
                        280,
                        Math.min(1920, Number(event.target.value) || 280),
                      ),
                    )
                  }
                  onBlur={() => setViewportWidth(`${customViewportWidth}px`)}
                />
                <span>px</span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  const nextPortrait = !isPortrait;
                  setIsPortrait(nextPortrait);
                  setViewportWidth(nextPortrait ? "375px" : "667px");
                }}
                title={t("app.rotate")}
              >
                <RotateCw size={17} />
              </button>
              <HelpPopover language={language} topic="viewport" />
            </div>
          </div>

          <div className="topbar-title">
            <strong>
              {fileName}
              {isDirty ? " •" : ""}
            </strong>
            <span className={isDirty ? "dirty-status" : ""}>
              {!isOnline
                ? t("app.offline")
                : isDirty
                  ? t("app.unsaved")
                  : localSavedAt
                    ? t("app.savedLocally")
                    : status}
            </span>
          </div>

          <div className="toolbar-group">
            <button
              type="button"
              className={`text-button ${privatePreview ? "active" : "warning"}`}
              onClick={togglePrivatePreview}
              title={
                privatePreview
                  ? t("app.privatePreview")
                  : t("app.externalResources")
              }
              aria-pressed={privatePreview}
            >
              {privatePreview ? (
                <Shield size={16} />
              ) : (
                <ShieldAlert size={16} />
              )}
              {privatePreview
                ? t("app.privatePreview")
                : t("app.externalResources")}
            </button>
            <HelpPopover language={language} topic="privatePreview" />
            <button
              type="button"
              className={`text-button ${disableUserScripts ? "active" : "warning"}`}
              onClick={toggleScripts}
              title={
                disableUserScripts ? t("app.safeMode") : t("app.scriptsActive")
              }
              aria-pressed={disableUserScripts}
            >
              {disableUserScripts ? (
                <Shield size={16} />
              ) : (
                <ShieldAlert size={16} />
              )}
              {disableUserScripts ? t("app.safeMode") : t("app.scriptsActive")}
            </button>
            <HelpPopover language={language} topic="safeScripts" />
            <button
              type="button"
              className={`text-button ${isInspectorOpen ? "active" : ""}`}
              onClick={() => setIsInspectorOpen((open) => !open)}
              title={t("app.inspector")}
              aria-pressed={isInspectorOpen}
            >
              {isInspectorOpen ? (
                <PanelRightClose size={17} />
              ) : (
                <PanelRight size={17} />
              )}
              {t("app.inspector")}
            </button>
            <button
              type="button"
              className="icon-button help-center-trigger"
              onClick={() => setShowHelp(true)}
              title={t("app.help")}
            >
              <CircleHelp size={18} />
            </button>
            <button
              type="button"
              className="primary-button"
              data-tour-target="export"
              onClick={() => void exportDocument()}
            >
              <Save size={17} />
              {t("app.export")}
            </button>
          </div>
        </header>

        <section className="canvas-stage" data-tour-target="preview">
          {recoveryProject && !hasActiveProject ? (
            <div className="recovery-banner">
              <div>
                <strong>{t("app.recoveryTitle")}</strong>
                <span>
                  {t("app.recoveryBody", {
                    time: formatRecoveryTime(
                      recoveryProject.updatedAt,
                      language,
                    ),
                  })}
                </span>
              </div>
              <div>
                <button type="button" onClick={() => void discardRecovery()}>
                  {t("app.discardDraft")}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void restoreRecovery()}
                >
                  {t("app.restoreDraft")}
                </button>
              </div>
              <HelpPopover language={language} topic="recovery" />
            </div>
          ) : null}
          <PreviewFrame
            iframeRef={iframeRef}
            runtimeHtml={runtimeHtml}
            runtimeKey={runtimeKey}
            viewportWidth={viewportWidth}
            t={t}
          />
        </section>
      </main>

      {isInspectorOpen ? (
        <aside className="right-panel">
          <div className="panel-titlebar">
            <strong>{t("app.inspector")}</strong>
            <span className="panel-title-actions">
              <HelpPopover language={language} topic="inspector" />
              <button
                type="button"
                className="panel-toggle"
                onClick={() => setIsInspectorOpen(false)}
                title={t("app.hidePanel")}
              >
                <PanelRightClose size={17} />
              </button>
            </span>
          </div>
          <InspectorPanel
            selectedElement={selectedElement}
            updateSelected={updateSelected}
            onAssetUpload={handleAssetUpload}
            t={t}
          />
        </aside>
      ) : null}

      <div className="mobile-actions">
        <label className="primary-button">
          <ImagePlus size={17} />
          {t("app.openProject")}
          <input
            type="file"
            accept=".html,.htm,.zip,text/html,application/zip"
            onChange={handleOpenFile}
          />
        </label>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsInspectorOpen((open) => !open);
          }}
          aria-pressed={isInspectorOpen}
        >
          <PanelRight size={17} />
          {t("app.inspector")}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => void exportDocument()}
        >
          <Save size={17} />
          {t("app.export")}
        </button>
      </div>
      {!isOnline ? (
        <div className="offline-badge">
          <WifiOff size={14} />
          {t("app.offline")}
        </div>
      ) : null}
      <div className="status-announcer" role="status" aria-live="polite">
        {status}
      </div>

      {showIntro ? (
        <WelcomeIntro
          language={language}
          onLanguageChange={changeLanguage}
          onOpenProject={() => openFileInputRef.current?.click()}
          onTryDemo={handleTryDemo}
          onSkip={completeOnboarding}
        />
      ) : null}
      <GuidedTour
        language={language}
        isOpen={showTour}
        onClose={completeOnboarding}
        onComplete={completeOnboarding}
      />
      <HelpCenter
        language={language}
        isOpen={showHelp}
        onLanguageChange={changeLanguage}
        onReplayTour={() => {
          setShowHelp(false);
          setShowTour(true);
        }}
        onClearLocalData={() => void clearLocalData()}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
