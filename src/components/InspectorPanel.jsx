import { ArrowDown, ArrowUp, ChevronRight, Copy, Eye, EyeOff, ImagePlus, Link2, Parentheses, RotateCcw, Trash2, Type } from "lucide-react";
import { Field } from "./Field.jsx";

const imageTags = new Set(["img", "video"]);

function StyleField({ label, name, value, updateSelected, placeholder = "auto" }) {
  return <Field label={label}><div className="value-control"><input value={value || ""} placeholder={placeholder} onChange={(event) => updateSelected("set-style", { name, value: event.target.value })} /><button type="button" onClick={() => updateSelected("set-style", { name, value: "" })} aria-label={`Reset ${label}`} title={`Reset ${label}`}><RotateCcw size={13} /></button></div></Field>;
}

function ColorField({ label, name, value, updateSelected }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
  return <Field label={label}><div className="color-control"><input className="color-swatch" type="color" value={hex} onChange={(event) => updateSelected("set-style", { name, value: event.target.value })} /><input value={value || ""} placeholder="inherit" onChange={(event) => updateSelected("set-style", { name, value: event.target.value })} /></div></Field>;
}

export function InspectorPanel({ selectedElement, updateSelected, onAssetUpload }) {
  if (!selectedElement) return <div className="empty-panel"><Type size={28} /><h2>Select an element</h2><p>Click text, an image, a link, or a layout block in the preview. Its controls will appear here.</p><p className="keyboard-hint">Tip: press Escape to leave inline text editing.</p></div>;

  const isMedia = imageTags.has(selectedElement.tagName);
  const canEditText = selectedElement.canEditText && !isMedia && !["canvas", "svg", "iframe"].includes(selectedElement.tagName);
  const isHidden = selectedElement.display === "none";
  const setAttr = (name) => (event) => updateSelected("set-attr", { name, value: event.target.value });
  const setStyle = (name) => (event) => updateSelected("set-style", { name, value: event.target.value });
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { updateSelected("set-attr", { name: "src", value: await onAssetUpload(file) }); } finally { event.target.value = ""; }
  };

  return <div className="panel-scroll">
    <nav className="breadcrumbs" aria-label="Selected element path">{selectedElement.ancestors?.map((item, index) => <span key={item.id}>{index > 0 ? <ChevronRight size={12} aria-hidden="true" /> : null}<button type="button" onClick={() => updateSelected("select-node", { id: item.id })} aria-current={item.id === selectedElement.id ? "page" : undefined}>{item.label}</button></span>)}</nav>
    <section className="inspector-header"><div><span>Selected element</span><h2>&lt;{selectedElement.tagName}&gt;</h2></div><button type="button" className="danger-icon" onClick={() => updateSelected("remove")} title="Remove element" aria-label="Remove selected element"><Trash2 size={17} /></button></section>
    <div className="meta-row" aria-label="Element measurements"><span>{Math.round(selectedElement.rect?.width || 0)} px</span><span>{Math.round(selectedElement.rect?.height || 0)} px</span><span>{selectedElement.display}</span></div>
    <div className="quick-actions" aria-label="Element actions"><button type="button" onClick={() => updateSelected("select-parent")}><Parentheses size={15} /> Parent</button><button type="button" onClick={() => updateSelected("move-up")}><ArrowUp size={15} /> Up</button><button type="button" onClick={() => updateSelected("move-down")}><ArrowDown size={15} /> Down</button><button type="button" onClick={() => updateSelected("duplicate")}><Copy size={15} /> Duplicate selected element</button></div>

    {canEditText ? <section className="panel-section primary-section"><div className="section-title"><Type size={16} /> Content</div><Field label="Text"><textarea rows={5} value={selectedElement.text} onChange={(event) => updateSelected("set-text", { value: event.target.value })} /></Field></section> : null}
    {isMedia ? <section className="panel-section primary-section"><div className="section-title"><ImagePlus size={16} /> Media</div><Field label="Source URL"><textarea rows={3} value={selectedElement.src} onChange={setAttr("src")} /></Field><label className="upload-button"><ImagePlus size={16} /> Replace image<input type="file" accept="image/*" onChange={handleImageUpload} /></label><Field label="Alt text" hint="Describe meaningful images; leave empty only for decoration."><input value={selectedElement.alt} onChange={setAttr("alt")} /></Field><Field label="Object fit"><select value={selectedElement.objectFit} onChange={setStyle("objectFit")}><option value="">Default</option><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></select></Field></section> : null}
    {selectedElement.tagName === "a" ? <section className="panel-section primary-section"><div className="section-title"><Link2 size={16} /> Link</div><Field label="Destination"><input value={selectedElement.href} onChange={setAttr("href")} /></Field><Field label="Open in"><select value={selectedElement.target} onChange={setAttr("target")}><option value="">Same tab</option><option value="_blank">New tab</option><option value="_self">Current frame</option></select></Field></section> : null}

    <details className="panel-disclosure" open><summary>Layout</summary><div className="disclosure-content"><div className="split-fields"><StyleField label="Width" name="width" value={selectedElement.width} updateSelected={updateSelected} /><StyleField label="Height" name="height" value={selectedElement.height} updateSelected={updateSelected} /></div><StyleField label="Max width" name="maxWidth" value={selectedElement.maxWidth} updateSelected={updateSelected} placeholder="none" /><BoxFields title="Margin" prefix="margin" selectedElement={selectedElement} updateSelected={updateSelected} /><BoxFields title="Padding" prefix="padding" selectedElement={selectedElement} updateSelected={updateSelected} /><Field label="Text alignment"><select value={selectedElement.textAlign} onChange={setStyle("textAlign")}><option value="">Default</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></Field></div></details>
    <details className="panel-disclosure" open><summary>Appearance</summary><div className="disclosure-content"><div className="split-fields"><ColorField label="Text" name="color" value={selectedElement.color} updateSelected={updateSelected} /><ColorField label="Background" name="backgroundColor" value={selectedElement.backgroundColor} updateSelected={updateSelected} /></div><div className="split-fields"><StyleField label="Font size" name="fontSize" value={selectedElement.fontSize} updateSelected={updateSelected} /><StyleField label="Weight" name="fontWeight" value={selectedElement.fontWeight} updateSelected={updateSelected} /></div><div className="split-fields"><StyleField label="Line height" name="lineHeight" value={selectedElement.lineHeight} updateSelected={updateSelected} /><StyleField label="Letter spacing" name="letterSpacing" value={selectedElement.letterSpacing} updateSelected={updateSelected} /></div><button className="sidebar-action" type="button" onClick={() => updateSelected("set-style", { name: "display", value: isHidden ? "" : "none" })}>{isHidden ? <Eye size={16} /> : <EyeOff size={16} />}{isHidden ? "Show element" : "Hide element"}</button></div></details>
    <details className="panel-disclosure"><summary>HTML attributes</summary><div className="disclosure-content"><Field label="Class"><input value={selectedElement.className} onChange={setAttr("class")} /></Field><div className="split-fields"><Field label="ID"><input value={selectedElement.domId} onChange={setAttr("id")} /></Field><Field label="Title"><input value={selectedElement.title} onChange={setAttr("title")} /></Field></div></div></details>
    <details className="panel-disclosure"><summary>Technical selector</summary><code className="selector-code">{selectedElement.selector}</code></details>
  </div>;
}

function BoxFields({ title, prefix, selectedElement, updateSelected }) {
  return <div className="box-model"><strong>{title}</strong><div className="four-fields">{["Top", "Right", "Bottom", "Left"].map((side) => { const name = `${prefix}${side}`; return <StyleField key={name} label={side} name={name} value={selectedElement[name]} updateSelected={updateSelected} />; })}</div></div>;
}
