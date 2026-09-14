import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, X } from "lucide-react";
import { createTranslator, normalizeLanguage } from "../lib/i18n.js";

export function HelpPopover({
  language = "en",
  topic,
  title,
  children,
  className = "",
}) {
  const tr = createTranslator(normalizeLanguage(language));
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const popoverId = useId();
  const resolvedTitle =
    title || (topic ? tr(`help.${topic}.title`) : tr("help.trigger"));
  const resolvedBody = children || (topic ? tr(`help.${topic}.body`) : null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <span ref={rootRef} className={`help-popover ${className}`.trim()}>
      <button
        ref={buttonRef}
        className="help-trigger"
        type="button"
        aria-label={`${tr("help.trigger")}: ${resolvedTitle}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => setIsOpen((value) => !value)}
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>
      {isOpen ? (
        <span className="help-card" id={popoverId} role="tooltip">
          <span className="help-card-header">
            <strong>{resolvedTitle}</strong>
            <button
              type="button"
              aria-label={tr("common.close")}
              onClick={() => {
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </span>
          <span className="help-card-body">{resolvedBody}</span>
        </span>
      ) : null}
    </span>
  );
}
