// Antigravity: Added viewportWidth prop to simulate different screen sizes (Desktop, Tablet, Mobile)
export function PreviewFrame({ iframeRef, runtimeHtml, runtimeKey, viewportWidth = "100%" }) {
  return (
    <div className="preview-shell">
      <div className="browser-bar">
        <span />
        <span />
        <span />
        <div>
          editable preview ({viewportWidth === "100%" ? "Desktop" : viewportWidth === "768px" ? "Tablet" : "Mobile"})
        </div>
      </div>
      <div className="preview-container">
        <iframe
          key={runtimeKey}
          ref={iframeRef}
          title="Bennu live HTML preview"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          srcDoc={runtimeHtml}
          className="preview-iframe"
          style={{ width: viewportWidth }}
        />
      </div>
    </div>
  );
}
