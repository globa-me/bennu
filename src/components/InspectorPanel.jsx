import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Parentheses,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { Field } from "./Field.jsx";

const imageTags = new Set(["img", "video"]);

function StyleField({
  label,
  name,
  value,
  updateSelected,
  placeholder = "auto",
  t,
}) {
  const resetLabel = t("inspector.reset", { label });
  return (
    <Field label={label}>
      <div className="value-control">
        <input
          value={value || ""}
          placeholder={placeholder}
          onChange={(event) =>
            updateSelected("set-style", { name, value: event.target.value })
          }
        />
        <button
          type="button"
          onClick={() => updateSelected("set-style", { name, value: "" })}
          aria-label={resetLabel}
          title={resetLabel}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </Field>
  );
}

function ColorField({ label, name, value, updateSelected }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
  return (
    <Field label={label}>
      <div className="color-control">
        <input
          className="color-swatch"
          type="color"
          value={hex}
          onChange={(event) =>
            updateSelected("set-style", { name, value: event.target.value })
          }
        />
        <input
          value={value || ""}
          placeholder="inherit"
          onChange={(event) =>
            updateSelected("set-style", { name, value: event.target.value })
          }
        />
      </div>
    </Field>
  );
}

export function InspectorPanel({
  selectedElement,
  updateSelected,
  onAssetUpload,
  t = (key) => key,
}) {
  if (!selectedElement)
    return (
      <div className="empty-panel">
        <Type size={28} />
        <h2>{t("inspector.emptyTitle")}</h2>
        <p>{t("inspector.emptyBody")}</p>
        <p className="keyboard-hint">{t("inspector.emptyTip")}</p>
      </div>
    );

  const isMedia = imageTags.has(selectedElement.tagName);
  const canEditText =
    selectedElement.canEditText &&
    !isMedia &&
    !["canvas", "svg", "iframe"].includes(selectedElement.tagName);
  const isHidden = selectedElement.display === "none";
  const setAttr = (name) => (event) =>
    updateSelected("set-attr", { name, value: event.target.value });
  const setStyle = (name) => (event) =>
    updateSelected("set-style", { name, value: event.target.value });
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      updateSelected("set-attr", {
        name: "src",
        value: await onAssetUpload(file),
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="panel-scroll">
      <nav className="breadcrumbs" aria-label={t("inspector.path")}>
        {selectedElement.ancestors?.map((item, index) => (
          <span key={item.id}>
            {index > 0 ? <ChevronRight size={12} aria-hidden="true" /> : null}
            <button
              type="button"
              onClick={() => updateSelected("select-node", { id: item.id })}
              aria-current={item.id === selectedElement.id ? "page" : undefined}
            >
              {item.label}
            </button>
          </span>
        ))}
      </nav>
      <section className="inspector-header">
        <div>
          <span>{t("inspector.selected")}</span>
          <h2>&lt;{selectedElement.tagName}&gt;</h2>
        </div>
        <button
          type="button"
          className="danger-icon"
          onClick={() => updateSelected("remove")}
          title={t("inspector.remove")}
          aria-label={t("inspector.remove")}
        >
          <Trash2 size={17} />
        </button>
      </section>
      <div className="meta-row" aria-label={t("inspector.measurements")}>
        <span>{Math.round(selectedElement.rect?.width || 0)} px</span>
        <span>{Math.round(selectedElement.rect?.height || 0)} px</span>
        <span>{selectedElement.display}</span>
      </div>
      <div className="quick-actions" aria-label={t("inspector.actions")}>
        <button type="button" onClick={() => updateSelected("select-parent")}>
          <Parentheses size={15} /> {t("inspector.parent")}
        </button>
        <button type="button" onClick={() => updateSelected("move-up")}>
          <ArrowUp size={15} /> {t("inspector.up")}
        </button>
        <button type="button" onClick={() => updateSelected("move-down")}>
          <ArrowDown size={15} /> {t("inspector.down")}
        </button>
        <button type="button" onClick={() => updateSelected("duplicate")}>
          <Copy size={15} /> {t("inspector.duplicate")}
        </button>
      </div>

      {canEditText ? (
        <section className="panel-section primary-section">
          <div className="section-title">
            <Type size={16} /> {t("inspector.content")}
          </div>
          <Field label={t("inspector.text")}>
            <textarea
              rows={5}
              value={selectedElement.text}
              onChange={(event) =>
                updateSelected("set-text", { value: event.target.value })
              }
            />
          </Field>
        </section>
      ) : null}
      {isMedia ? (
        <section className="panel-section primary-section">
          <div className="section-title">
            <ImagePlus size={16} /> {t("inspector.media")}
          </div>
          <Field label={t("inspector.sourceUrl")}>
            <textarea
              rows={3}
              value={selectedElement.src}
              onChange={setAttr("src")}
            />
          </Field>
          <label className="upload-button">
            <ImagePlus size={16} /> {t("inspector.replaceImage")}
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          <Field label={t("inspector.altText")} hint={t("inspector.altHint")}>
            <input value={selectedElement.alt} onChange={setAttr("alt")} />
          </Field>
          <Field label={t("inspector.objectFit")}>
            <select
              value={selectedElement.objectFit}
              onChange={setStyle("objectFit")}
            >
              <option value="">{t("inspector.default")}</option>
              <option value="cover">{t("inspector.cover")}</option>
              <option value="contain">{t("inspector.contain")}</option>
              <option value="fill">{t("inspector.fill")}</option>
            </select>
          </Field>
        </section>
      ) : null}
      {selectedElement.tagName === "a" ? (
        <section className="panel-section primary-section">
          <div className="section-title">
            <Link2 size={16} /> {t("inspector.link")}
          </div>
          <Field label={t("inspector.destination")}>
            <input value={selectedElement.href} onChange={setAttr("href")} />
          </Field>
          <Field label={t("inspector.openIn")}>
            <select value={selectedElement.target} onChange={setAttr("target")}>
              <option value="">{t("inspector.sameTab")}</option>
              <option value="_blank">{t("inspector.newTab")}</option>
              <option value="_self">{t("inspector.currentFrame")}</option>
            </select>
          </Field>
        </section>
      ) : null}

      <details className="panel-disclosure" open>
        <summary>{t("inspector.layout")}</summary>
        <div className="disclosure-content">
          <div className="split-fields">
            <StyleField
              label={t("inspector.width")}
              name="width"
              value={selectedElement.width}
              updateSelected={updateSelected}
              t={t}
            />
            <StyleField
              label={t("inspector.height")}
              name="height"
              value={selectedElement.height}
              updateSelected={updateSelected}
              t={t}
            />
          </div>
          <StyleField
            label={t("inspector.maxWidth")}
            name="maxWidth"
            value={selectedElement.maxWidth}
            updateSelected={updateSelected}
            placeholder="none"
            t={t}
          />
          <BoxFields
            title={t("inspector.margin")}
            prefix="margin"
            selectedElement={selectedElement}
            updateSelected={updateSelected}
            t={t}
          />
          <BoxFields
            title={t("inspector.padding")}
            prefix="padding"
            selectedElement={selectedElement}
            updateSelected={updateSelected}
            t={t}
          />
          <Field label={t("inspector.textAlignment")}>
            <select
              value={selectedElement.textAlign}
              onChange={setStyle("textAlign")}
            >
              <option value="">{t("inspector.default")}</option>
              <option value="left">{t("inspector.left")}</option>
              <option value="center">{t("inspector.center")}</option>
              <option value="right">{t("inspector.right")}</option>
              <option value="justify">{t("inspector.justify")}</option>
            </select>
          </Field>
        </div>
      </details>
      <details className="panel-disclosure" open>
        <summary>{t("inspector.appearance")}</summary>
        <div className="disclosure-content">
          <div className="split-fields">
            <ColorField
              label={t("inspector.color")}
              name="color"
              value={selectedElement.color}
              updateSelected={updateSelected}
            />
            <ColorField
              label={t("inspector.backgroundColor")}
              name="backgroundColor"
              value={selectedElement.backgroundColor}
              updateSelected={updateSelected}
            />
          </div>
          <div className="split-fields">
            <StyleField
              label={t("inspector.fontSize")}
              name="fontSize"
              value={selectedElement.fontSize}
              updateSelected={updateSelected}
              t={t}
            />
            <StyleField
              label={t("inspector.fontWeight")}
              name="fontWeight"
              value={selectedElement.fontWeight}
              updateSelected={updateSelected}
              t={t}
            />
          </div>
          <div className="split-fields">
            <StyleField
              label={t("inspector.lineHeight")}
              name="lineHeight"
              value={selectedElement.lineHeight}
              updateSelected={updateSelected}
              t={t}
            />
            <StyleField
              label={t("inspector.letterSpacing")}
              name="letterSpacing"
              value={selectedElement.letterSpacing}
              updateSelected={updateSelected}
              t={t}
            />
          </div>
          <button
            className="sidebar-action"
            type="button"
            onClick={() =>
              updateSelected("set-style", {
                name: "display",
                value: isHidden ? "" : "none",
              })
            }
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            {isHidden ? t("inspector.visible") : t("inspector.hidden")}
          </button>
        </div>
      </details>
      <details className="panel-disclosure">
        <summary>{t("inspector.attributes")}</summary>
        <div className="disclosure-content">
          <Field label={t("inspector.className")}>
            <input
              value={selectedElement.className}
              onChange={setAttr("class")}
            />
          </Field>
          <div className="split-fields">
            <Field label={t("inspector.id")}>
              <input value={selectedElement.domId} onChange={setAttr("id")} />
            </Field>
            <Field label={t("inspector.title")}>
              <input
                value={selectedElement.title}
                onChange={setAttr("title")}
              />
            </Field>
          </div>
        </div>
      </details>
      <details className="panel-disclosure">
        <summary>{t("inspector.technicalSelector")}</summary>
        <code className="selector-code">{selectedElement.selector}</code>
      </details>
    </div>
  );
}

function BoxFields({ title, prefix, selectedElement, updateSelected, t }) {
  const sides = [
    ["Top", "inspector.top"],
    ["Right", "inspector.right"],
    ["Bottom", "inspector.bottom"],
    ["Left", "inspector.left"],
  ];
  return (
    <div className="box-model">
      <strong>{title}</strong>
      <div className="four-fields">
        {sides.map(([side, labelKey]) => {
          const name = `${prefix}${side}`;
          return (
            <StyleField
              key={name}
              label={t(labelKey)}
              name={name}
              value={selectedElement[name]}
              updateSelected={updateSelected}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
