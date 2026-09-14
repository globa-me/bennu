import { useEffect, useRef } from "react";
import {
  Download,
  FolderOpen,
  Laptop,
  MousePointer2,
  ShieldCheck,
} from "lucide-react";
import {
  createTranslator,
  languageCodes,
  languages,
  normalizeLanguage,
} from "../lib/i18n.js";

export function WelcomeIntro({
  language = "en",
  onLanguageChange,
  onOpenProject,
  onTryDemo,
  onSkip,
}) {
  const activeLanguage = normalizeLanguage(language);
  const tr = createTranslator(activeLanguage);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const firstControl = dialogRef.current?.querySelector("button");
    firstControl?.focus();
    return () => previousFocus?.focus?.();
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onSkip?.();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll("button:not([disabled])") || [],
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="intro-backdrop">
      <section
        ref={dialogRef}
        className="intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        aria-describedby="intro-description"
        onKeyDown={handleKeyDown}
      >
        <header className="intro-header">
          <span className="intro-eyebrow">
            <Laptop size={16} aria-hidden="true" /> {tr("welcome.eyebrow")}
          </span>
          <h1 id="intro-title">{tr("welcome.title")}</h1>
          <p id="intro-description">{tr("welcome.description")}</p>
        </header>

        <fieldset className="intro-language">
          <legend>{tr("welcome.languageTitle")}</legend>
          <div className="intro-language-options">
            {languageCodes.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={activeLanguage === code}
                onClick={() => onLanguageChange?.(code)}
              >
                <span lang={languages[code].htmlLang}>
                  {languages[code].nativeLabel}
                </span>
              </button>
            ))}
          </div>
          <small>{tr("welcome.languageHint")}</small>
        </fieldset>

        <div className="intro-features">
          <article>
            <ShieldCheck aria-hidden="true" />
            <div>
              <h2>{tr("welcome.localTitle")}</h2>
              <p>{tr("welcome.localBody")}</p>
            </div>
          </article>
          <article>
            <MousePointer2 aria-hidden="true" />
            <div>
              <h2>{tr("welcome.editTitle")}</h2>
              <p>{tr("welcome.editBody")}</p>
            </div>
          </article>
          <article>
            <Download aria-hidden="true" />
            <div>
              <h2>{tr("welcome.exportTitle")}</h2>
              <p>{tr("welcome.exportBody")}</p>
            </div>
          </article>
        </div>

        <footer className="intro-actions">
          <button
            className="intro-primary"
            type="button"
            onClick={onOpenProject}
          >
            <FolderOpen size={18} aria-hidden="true" />
            {tr("welcome.openProject")}
          </button>
          <button className="intro-secondary" type="button" onClick={onTryDemo}>
            <MousePointer2 size={18} aria-hidden="true" />
            {tr("welcome.tryDemo")}
          </button>
          <button className="intro-skip" type="button" onClick={onSkip}>
            {tr("welcome.skip")}
          </button>
        </footer>
      </section>
    </div>
  );
}
