import { Copy, Eye, EyeOff, ImagePlus, Link2, Palette, Trash2, Type } from "lucide-react";
import { Field } from "./Field.jsx";

const imageTags = new Set(["img", "video"]);

export function InspectorPanel({ selectedElement, updateSelected, onAssetUpload }) {
  if (!selectedElement) {
    return (
      <div className="empty-panel">
        <Type size={28} />
        <h2>Select something on the page</h2>
        <p>Click text, an image, a link, or a layout block inside the preview to edit it here.</p>
      </div>
    );
  }

  const isMedia = imageTags.has(selectedElement.tagName);
  const canEditText = selectedElement.canEditText && !isMedia && !["canvas", "svg", "iframe"].includes(selectedElement.tagName);
  const isHidden = selectedElement.display === "none";

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await onAssetUpload(file);
      updateSelected("set-attr", { name: "src", value: url });
    } catch (err) {
      console.error("Asset upload failed:", err);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="panel-scroll">
      <section className="inspector-header">
        <div>
          <span>Selected</span>
          <h2>&lt;{selectedElement.tagName}&gt;</h2>
        </div>
        <button type="button" className="danger-icon" onClick={() => updateSelected("remove")} title="Remove element">
          <Trash2 size={17} />
        </button>
      </section>

      <div className="meta-row">
        <span>{selectedElement.rect?.width || 0}px</span>
        <span>{selectedElement.rect?.height || 0}px</span>
        <span>{selectedElement.display}</span>
      </div>

      {canEditText ? (
        <section className="panel-section">
          <div className="section-title">
            <Type size={16} />
            Content
          </div>
          <Field label="Text">
            <textarea
              rows={7}
              value={selectedElement.text}
              onChange={(event) => updateSelected("set-text", { value: event.target.value })}
            />
          </Field>
          <Field label="Class">
            <input
              value={selectedElement.className}
              onChange={(event) => updateSelected("set-attr", { name: "class", value: event.target.value })}
            />
          </Field>
        </section>
      ) : null}

      <section className="panel-section">
        <div className="section-title">
          <Copy size={16} />
          Attributes
        </div>
        <div className="split-fields">
          <Field label="ID">
            <input
              value={selectedElement.domId}
              onChange={(event) => updateSelected("set-attr", { name: "id", value: event.target.value })}
            />
          </Field>
          <Field label="Title">
            <input
              value={selectedElement.title}
              onChange={(event) => updateSelected("set-attr", { name: "title", value: event.target.value })}
            />
          </Field>
        </div>
        {!canEditText ? (
          <Field label="Class">
            <input
              value={selectedElement.className}
              onChange={(event) => updateSelected("set-attr", { name: "class", value: event.target.value })}
            />
          </Field>
        ) : null}
      </section>

      {isMedia ? (
        <section className="panel-section">
          <div className="section-title">
            <ImagePlus size={16} />
            Image
          </div>
          <Field label="Source URL">
            <textarea
              rows={4}
              value={selectedElement.src}
              onChange={(event) => updateSelected("set-attr", { name: "src", value: event.target.value })}
            />
          </Field>
          <label className="upload-button">
            <ImagePlus size={16} />
            Replace with local image
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <Field label="Alt text">
            <input
              value={selectedElement.alt}
              onChange={(event) => updateSelected("set-attr", { name: "alt", value: event.target.value })}
            />
          </Field>
          <Field label="Object fit">
            <select
              value={selectedElement.objectFit}
              onChange={(event) => updateSelected("set-style", { name: "objectFit", value: event.target.value })}
            >
              <option value="">Default</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </Field>
        </section>
      ) : null}

      {selectedElement.tagName === "a" ? (
        <section className="panel-section">
          <div className="section-title">
            <Link2 size={16} />
            Link
          </div>
          <Field label="Href">
            <input
              value={selectedElement.href}
              onChange={(event) => updateSelected("set-attr", { name: "href", value: event.target.value })}
            />
          </Field>
          <Field label="Target">
            <select
              value={selectedElement.target}
              onChange={(event) => updateSelected("set-attr", { name: "target", value: event.target.value })}
            >
              <option value="">Same tab</option>
              <option value="_blank">New tab</option>
              <option value="_self">Self</option>
              <option value="_parent">Parent</option>
              <option value="_top">Top</option>
            </select>
          </Field>
        </section>
      ) : null}

      <section className="panel-section">
        <div className="section-title">
          <Copy size={16} />
          Layout
        </div>
        <div className="split-fields">
          <Field label="Width">
            <input
              value={selectedElement.width}
              placeholder="auto"
              onChange={(event) => updateSelected("set-style", { name: "width", value: event.target.value })}
            />
          </Field>
          <Field label="Height">
            <input
              value={selectedElement.height}
              placeholder="auto"
              onChange={(event) => updateSelected("set-style", { name: "height", value: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Max width">
          <input
            value={selectedElement.maxWidth}
            placeholder="none"
            onChange={(event) => updateSelected("set-style", { name: "maxWidth", value: event.target.value })}
          />
        </Field>
        <div className="split-fields">
          <Field label="Margin top">
            <input
              value={selectedElement.marginTop}
              onChange={(event) => updateSelected("set-style", { name: "marginTop", value: event.target.value })}
            />
          </Field>
          <Field label="Margin bottom">
            <input
              value={selectedElement.marginBottom}
              onChange={(event) => updateSelected("set-style", { name: "marginBottom", value: event.target.value })}
            />
          </Field>
        </div>
        <div className="split-fields">
          <Field label="Padding top">
            <input
              value={selectedElement.paddingTop}
              onChange={(event) => updateSelected("set-style", { name: "paddingTop", value: event.target.value })}
            />
          </Field>
          <Field label="Padding bottom">
            <input
              value={selectedElement.paddingBottom}
              onChange={(event) => updateSelected("set-style", { name: "paddingBottom", value: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Text align">
          <select
            value={selectedElement.textAlign}
            onChange={(event) => updateSelected("set-style", { name: "textAlign", value: event.target.value })}
          >
            <option value="">Default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </Field>
        {isHidden ? (
          <button className="sidebar-action" type="button" onClick={() => updateSelected("set-style", { name: "display", value: "" })}>
            <Eye size={16} />
            Show selected element
          </button>
        ) : (
          <button className="sidebar-action" type="button" onClick={() => updateSelected("set-style", { name: "display", value: "none" })}>
            <EyeOff size={16} />
            Hide selected element
          </button>
        )}
        <button className="sidebar-action" type="button" onClick={() => updateSelected("duplicate")}>
          <Copy size={16} />
          Duplicate selected element
        </button>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <Palette size={16} />
          Appearance
        </div>
        <div className="split-fields">
          <Field label="Text color">
            <input
              value={selectedElement.color}
              onChange={(event) => updateSelected("set-style", { name: "color", value: event.target.value })}
            />
          </Field>
          <Field label="Background">
            <input
              value={selectedElement.backgroundColor}
              onChange={(event) => updateSelected("set-style", { name: "backgroundColor", value: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Font size">
          <input
            value={selectedElement.fontSize}
            onChange={(event) => updateSelected("set-style", { name: "fontSize", value: event.target.value })}
          />
        </Field>
      </section>

      <section className="panel-section">
        <div className="section-title">Selector</div>
        <code className="selector-code">{selectedElement.selector}</code>
      </section>
    </div>
  );
}
