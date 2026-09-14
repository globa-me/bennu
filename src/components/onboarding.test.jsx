import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GuidedTour } from "./GuidedTour.jsx";
import { HelpPopover } from "./HelpPopover.jsx";
import { WelcomeIntro } from "./WelcomeIntro.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("onboarding components", () => {
  let container;
  let root;

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  function render(element) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(element));
  }

  test("welcome follows the chosen language and exposes primary actions", () => {
    const chooseLanguage = vi.fn();
    const openProject = vi.fn();
    render(<WelcomeIntro language="ru" onLanguageChange={chooseLanguage} onOpenProject={openProject} />);

    expect(container.textContent).toContain("Редактируйте веб-страницу");
    const buttons = Array.from(container.querySelectorAll("button"));
    act(() => buttons.find((button) => button.textContent.includes("English")).click());
    act(() => buttons.find((button) => button.textContent.includes("Открыть свой проект")).click());
    expect(chooseLanguage).toHaveBeenCalledWith("en");
    expect(openProject).toHaveBeenCalledOnce();
  });

  test("tour advances through four reusable target keys and completes", () => {
    const complete = vi.fn();
    render(<GuidedTour isOpen language="en" onComplete={complete} />);
    expect(container.querySelector("[data-tour-step]").dataset.tourStep).toBe("open-project");

    for (let index = 0; index < 4; index += 1) {
      const primary = container.querySelector(".tour-primary");
      act(() => primary.click());
    }
    expect(complete).toHaveBeenCalledOnce();
  });

  test("help popover provides expanded state and closes with Escape", () => {
    render(<HelpPopover language="en" topic="preview" />);
    const trigger = container.querySelector(".help-trigger");
    act(() => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Editable preview");
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});

