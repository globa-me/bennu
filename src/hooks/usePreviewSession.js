// Antigravity: Custom hook to manage iframe events, postMessage synchronization, and safe script toggling.
import { useCallback, useEffect } from "react";
import { restoreUserScripts } from "../lib/htmlSession.js";

const PREVIEW_TARGET_ORIGIN = "*";

export function usePreviewSession({
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
  htmlRef,
}) {
  const restoreFromPreview = useCallback((html) => {
    const session = siteSessionRef.current;
    const restored = session ? session.restore(html) : html;
    // Antigravity: Restore script tags and event handlers to original form before storing in host state
    return restoreUserScripts(restored);
  }, [siteSessionRef]);

  const normalizeElement = useCallback((element) => {
    const session = siteSessionRef.current;
    if (!session || !element) return element;
    return {
      ...element,
      src: element.src ? session.restore(element.src) : element.src,
      href: element.href ? session.restore(element.href) : element.href,
    };
  }, [siteSessionRef]);

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
  }, [
    iframeRef,
    previewTokenRef,
    restoreFromPreview,
    normalizeElement,
    setSelectedElement,
    setDocumentHtml,
    pushHistory,
    handleExportHtml,
    setStatus,
    htmlRef,
  ]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  const postToPreview = useCallback((payload) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "bennu-host", token: previewTokenRef.current, ...payload },
      PREVIEW_TARGET_ORIGIN,
    );
  }, [iframeRef, previewTokenRef]);

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
  }, [postToPreview, selectedElement?.id, siteSessionRef]);

  return {
    postToPreview,
    updateSelected,
    restoreFromPreview,
    normalizeElement,
  };
}
