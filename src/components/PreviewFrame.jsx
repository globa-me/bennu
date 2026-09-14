// Antigravity: Added viewportWidth prop to simulate different screen sizes (Desktop, Tablet, Mobile)
export function PreviewFrame({
  iframeRef,
  runtimeHtml,
  runtimeKey,
  viewportWidth = "100%",
  t = (key) => key,
}) {
  const viewportLabel =
    viewportWidth === "100%"
      ? t("app.desktop")
      : viewportWidth === "768px"
        ? t("app.tablet")
        : viewportWidth === "375px"
          ? t("app.mobile")
          : `${viewportWidth}`;
  return (
    <div className="preview-shell">
      <div className="browser-bar">
        <span />
        <span />
        <span />
        <div>
          {t("preview.editable")} ({viewportLabel})
        </div>
      </div>
      <div className="preview-container">
        <iframe
          key={runtimeKey}
          ref={iframeRef}
          title={t("preview.frameTitle")}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={runtimeHtml}
          className="preview-iframe"
          style={{ width: viewportWidth }}
        />
      </div>
    </div>
  );
}
