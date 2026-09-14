import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { createTranslator, normalizeLanguage } from "../lib/i18n.js";

export const TOUR_STEPS = Object.freeze([
  Object.freeze({
    target: "open-project",
    titleKey: "tour.open.title",
    bodyKey: "tour.open.body",
  }),
  Object.freeze({
    target: "preview",
    titleKey: "tour.preview.title",
    bodyKey: "tour.preview.body",
  }),
  Object.freeze({
    target: "viewport",
    titleKey: "tour.viewport.title",
    bodyKey: "tour.viewport.body",
  }),
  Object.freeze({
    target: "export",
    titleKey: "tour.export.title",
    bodyKey: "tour.export.body",
  }),
]);

const focusableSelector =
  "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function GuidedTour({
  language = "en",
  isOpen = false,
  onClose,
  onComplete,
  steps = TOUR_STEPS,
}) {
  const tr = createTranslator(normalizeLanguage(language));
  const [index, setIndex] = useState(0);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const safeSteps = useMemo(() => (steps.length ? steps : TOUR_STEPS), [steps]);
  const step = safeSteps[Math.min(index, safeSteps.length - 1)];

  useEffect(() => {
    if (!isOpen) return undefined;
    setIndex(0);
    previousFocusRef.current = document.activeElement;
    const frame = requestAnimationFrame(() =>
      dialogRef.current?.querySelector(focusableSelector)?.focus(),
    );
    return () => {
      cancelAnimationFrame(frame);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !step?.target) return undefined;
    const target = Array.from(
      document.querySelectorAll("[data-tour-target]"),
    ).find((node) => node.dataset.tourTarget === step.target);
    target?.setAttribute("data-tour-active", "true");
    target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    return () => target?.removeAttribute("data-tour-active");
  }, [isOpen, step]);

  if (!isOpen) return null;

  const close = () => onClose?.();
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll(focusableSelector) || [],
    );
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const advance = () => {
    if (index === safeSteps.length - 1) onComplete?.();
    else setIndex((value) => value + 1);
  };

  return (
    <div className="tour-backdrop">
      <section
        ref={dialogRef}
        className="tour-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        data-tour-step={step.target}
      >
        <header className="tour-header">
          <span>
            {tr("tour.progress", {
              current: index + 1,
              total: safeSteps.length,
            })}
          </span>
          <button type="button" onClick={close} aria-label={tr("common.close")}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="tour-progress" aria-hidden="true">
          <span style={{ "--tour-progress": (index + 1) / safeSteps.length }} />
        </div>
        <h2 id="tour-title">{tr(step.titleKey)}</h2>
        <p id="tour-body">{tr(step.bodyKey)}</p>
        <footer className="tour-actions">
          <button type="button" onClick={close}>
            {tr("common.skip")}
          </button>
          <div>
            <button
              type="button"
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              {tr("common.previous")}
            </button>
            <button className="tour-primary" type="button" onClick={advance}>
              {index === safeSteps.length - 1 ? (
                <Check size={17} aria-hidden="true" />
              ) : null}
              {index === safeSteps.length - 1
                ? tr("tour.finish")
                : tr("common.next")}
              {index < safeSteps.length - 1 ? (
                <ArrowRight size={17} aria-hidden="true" />
              ) : null}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
