// Antigravity: Custom hook to handle HTML formatting and ZIP/single-HTML exports
import { useCallback } from "react";
import {
  formatHtml,
  downloadHtml,
  restoreUserScripts,
} from "../lib/htmlSession.js";

export function useExportHtml(
  siteSessionRef,
  documentHtml,
  fileName,
  setStatus,
  t = (key) => key,
) {
  const handleExportHtml = useCallback(
    async (html = documentHtml) => {
      const session = siteSessionRef.current;
      try {
        // Antigravity: Always restore user scripts to their original functional state before exporting
        const restoredWithScripts = restoreUserScripts(html);

        if (session) {
          setStatus(t("app.exporting"));
          const formattedHtml = await formatHtml(restoredWithScripts);
          session.updateFile(session.htmlPath, formattedHtml);

          // Antigravity: Smart single-file fallback. If it was loaded as a single file and no assets were added,
          // we export the single formatted HTML. Otherwise, we pack it as a ZIP package.
          if (session.label === "single-file" && session.assetCount === 0) {
            await downloadHtml(restoredWithScripts, fileName);
            setStatus(t("app.exportHtml"));
          } else {
            const zipBlob = await session.exportZip();
            const zipName =
              session.label === "single-file"
                ? `${fileName.replace(/\.html?$/i, "")}-package.zip`
                : `${session.label || "site"}.zip`;
            const url = URL.createObjectURL(zipBlob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = zipName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            setStatus(t("app.exportZip", { name: zipName }));
          }
        } else {
          await downloadHtml(restoredWithScripts, fileName);
          setStatus(t("app.exportHtml"));
        }
        return true;
      } catch (error) {
        console.error(error);
        setStatus(t("app.exportFailed"));
        return false;
      }
    },
    [documentHtml, fileName, setStatus, siteSessionRef, t],
  );

  return { handleExportHtml };
}
