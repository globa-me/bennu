// Antigravity: Custom hook to handle loading directories, ZIP packages, and single HTML files.
// Wrap single files in virtual sessions to enable relative asset storage.
import { useCallback } from "react";
import { readFileAsText } from "../lib/htmlSession.js";
import {
  createSiteSession,
  createSiteSessionFromDirectory,
  createSiteSessionFromZip,
  isZipFile,
} from "../lib/sitePackage.js";

export function useSiteLoader(loadDocument, setStatus, t = (key) => key) {
  const handleOpenFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        if (isZipFile(file)) {
          const siteSession = await createSiteSessionFromZip(file);
          loadDocument(
            siteSession.html,
            siteSession.htmlPath.split("/").pop() || "index.html",
            siteSession,
          );
        } else {
          const html = await readFileAsText(file);
          // Antigravity: Create a virtual session for single HTML files.
          // This avoids data URL bloat when adding/replacing image assets.
          const files = new Map();
          files.set(file.name, new Blob([html], { type: "text/html" }));
          const siteSession = await createSiteSession(files, "single-file");

          loadDocument(html, file.name, siteSession);
          setStatus(t("app.localAssets"));
        }
      } catch (error) {
        setStatus(error.message);
      } finally {
        event.target.value = "";
      }
    },
    [loadDocument, setStatus, t],
  );

  const handleOpenDirectory = useCallback(
    async (event) => {
      const files = event.target.files;
      if (!files?.length) return;
      try {
        const siteSession = await createSiteSessionFromDirectory(files);
        loadDocument(
          siteSession.html,
          siteSession.htmlPath.split("/").pop() || "index.html",
          siteSession,
        );
      } catch (error) {
        setStatus(error.message);
      } finally {
        event.target.value = "";
      }
    },
    [loadDocument, setStatus],
  );

  return {
    handleOpenFile,
    handleOpenDirectory,
  };
}
