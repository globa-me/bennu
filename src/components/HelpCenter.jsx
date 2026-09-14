import { useEffect, useRef } from "react";
import {
  ExternalLink,
  Globe2,
  Keyboard,
  PlayCircle,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  createTranslator,
  languageCodes,
  languages,
  normalizeLanguage,
} from "../lib/i18n.js";

export function HelpCenter({
  language = "en",
  isOpen = false,
  onLanguageChange,
  onReplayTour,
  onClearLocalData,
  onClose,
}) {
  const activeLanguage = normalizeLanguage(language);
  const tr = createTranslator(activeLanguage);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        document.querySelectorAll(
          ".help-center button:not([disabled]), .help-center a[href]",
        ),
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="help-center-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="help-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-title"
        aria-describedby="help-center-description"
      >
        <header className="help-center-header">
          <div>
            <h2 id="help-center-title">{tr("help.centerTitle")}</h2>
            <p id="help-center-description">{tr("help.centerDescription")}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label={tr("common.close")}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="help-center-content">
          <section className="help-center-section">
            <Globe2 aria-hidden="true" />
            <div>
              <h3>{tr("help.languageTitle")}</h3>
              <div className="help-language-options">
                {languageCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={activeLanguage === code}
                    onClick={() => onLanguageChange?.(code)}
                    lang={languages[code].htmlLang}
                  >
                    {languages[code].nativeLabel}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section className="help-center-section">
            <PlayCircle aria-hidden="true" />
            <div>
              <h3>{tr("help.tourTitle")}</h3>
              <p>{tr("help.tourBody")}</p>
              <button type="button" onClick={onReplayTour}>
                {tr("help.replayTour")}
              </button>
            </div>
          </section>
          <section className="help-center-section">
            <ShieldCheck aria-hidden="true" />
            <div>
              <h3>{tr("help.privacyTitle")}</h3>
              <p>{tr("help.privacyBody")}</p>
            </div>
          </section>
          <section className="help-center-section">
            <Keyboard aria-hidden="true" />
            <div>
              <h3>{tr("help.hotkeysTitle")}</h3>
              <dl className="help-hotkeys">
                <div>
                  <dt>
                    <kbd>Ctrl/⌘ S</kbd>
                  </dt>
                  <dd>{tr("help.hotkeys.save")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Ctrl/⌘ Z</kbd>
                  </dt>
                  <dd>{tr("help.hotkeys.undo")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Ctrl/⌘ Shift Z</kbd>
                  </dt>
                  <dd>{tr("help.hotkeys.redo")}</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>{tr("help.hotkeys.escape")}</dd>
                </div>
              </dl>
            </div>
          </section>
          <section className="help-center-section help-creator-section">
            <UserRound aria-hidden="true" />
            <div>
              <h3>{tr("help.creatorTitle")}</h3>
              <p>{tr("help.creatorBody")}</p>
              <div className="help-social-links">
                <a
                  href="https://zakharov.asia/ru/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {tr("help.creatorSite")}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
                <a
                  href="https://www.instagram.com/globa_me/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                <a
                  href="https://www.linkedin.com/in/zaharov-gennady/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
                <a
                  href="https://www.facebook.com/gennadij.zaharov/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
                <a
                  href="https://t.me/+pxNqntXsSyEyM2My"
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
              </div>
            </div>
          </section>
          <section className="help-center-section help-danger-section">
            <Trash2 aria-hidden="true" />
            <div>
              <h3>{tr("help.localDataTitle")}</h3>
              <p>{tr("help.localDataBody")}</p>
              <small>{tr("help.clearLocalDataHint")}</small>
              <button type="button" onClick={onClearLocalData}>
                {tr("help.clearLocalData")}
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
