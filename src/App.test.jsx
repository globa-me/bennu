import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "./App.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("App", () => {
  let root;
  let container;

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
  });

  test("renders the initial editor shell", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("Bennu");
    expect(container.querySelector("iframe")).not.toBeNull();
  });
});
