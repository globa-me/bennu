export function PreviewFrame({ iframeRef, runtimeHtml, runtimeKey }) {
  return (
    <div className="preview-shell">
      <div className="browser-bar">
        <span />
        <span />
        <span />
        <div>editable preview</div>
      </div>
      <iframe
        key={runtimeKey}
        ref={iframeRef}
        title="Bennu live HTML preview"
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        srcDoc={runtimeHtml}
      />
    </div>
  );
}
