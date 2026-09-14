// Antigravity: E2E tests for visual HTML editing workflow, including undo/redo, responsive viewports, and script mode.
import { test, expect } from "@playwright/test";

test.describe("Bennu Visual Editor E2E Test Suite", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/");
    if (!testInfo.title.includes("chooses Russian")) {
      await page.getByRole("button", { name: "Skip introduction" }).click();
    }
  });

  test("loads editor shell and initial document", async ({ page }) => {
    // Verify brand title
    await expect(page.locator("aside.sidebar h1")).toContainText("Bennu");

    // Verify iframe exists
    const iframe = page.frameLocator("iframe");
    await expect(iframe.locator("h1")).toContainText(
      "Edit this page directly in Bennu.",
    );
  });

  test("selects h1 element, edits text, and duplicates it", async ({
    page,
  }) => {
    const iframe = page.frameLocator("iframe");
    const h1 = iframe.locator("h1");

    // 1. Click on the <h1> element inside the preview iframe to select it
    await h1.click();

    // 2. Verify Inspector panel opens and displays <h1> tag
    await expect(page.locator(".inspector-header h2")).toContainText("<h1>");

    // 3. Edit text in the Inspector textarea
    const textEditor = page.locator('textarea:near(:text("Text"))').first();
    await textEditor.fill("Hello from Antigravity E2E Test!");

    // 4. Verify preview h1 reflects edited text
    await expect(h1).toContainText("Hello from Antigravity E2E Test!");

    // Antigravity: Wait for history debounce timer (700ms) to commit the edit before duplicating
    await page.waitForTimeout(1000);

    // 5. Duplicate the selected element
    const duplicateBtn = page.locator('button:has-text("Duplicate")');
    await duplicateBtn.click();

    // 6. Verify there are now two h1 elements inside the iframe
    const allH1s = iframe.locator("h1");
    await expect(allH1s).toHaveCount(2);

    // Antigravity: Wait for duplicate changes to commit to history stack before clicking Undo
    await page.waitForTimeout(1000);

    // 7. Click Undo in the topbar and check that we return to one h1
    const undoBtn = page.locator('button[title="Undo"]');
    await undoBtn.click();
    await expect(allH1s).toHaveCount(1);
    await expect(h1).toContainText("Hello from Antigravity E2E Test!");
  });

  test("toggles device viewport widths", async ({ page }) => {
    const iframe = page.locator(".preview-iframe");

    // Antigravity: Hide the left sidebar first to free up horizontal space for the tablet simulator
    const sidebarBtn = page.locator('button[title="Hide panel"]').first();
    await sidebarBtn.click();

    // Default desktop: width should scale up
    const initialWidth = await iframe.evaluate((el) => el.clientWidth);
    expect(initialWidth).toBeGreaterThan(500);

    // Click Tablet width
    const tabletBtn = page.locator('button[title="Tablet"]');
    await tabletBtn.click();
    await expect(iframe).toHaveCSS("width", "768px");

    // Click Mobile width
    const mobileBtn = page.locator('button[title="Mobile"]');
    await mobileBtn.click();
    await expect(iframe).toHaveCSS("width", "375px");

    // Click Desktop width
    const desktopBtn = page.locator('button[title="Desktop"]');
    await desktopBtn.click();
    const iframeWidthStr = await iframe.evaluate((el) => el.style.width);
    expect(iframeWidthStr).toBe("100%");
  });

  test("toggles safe script mode status", async ({ page }) => {
    // By default, Safe Mode should be active
    const scriptBtn = page.getByRole("button", {
      name: "Safe mode",
      exact: true,
    });
    await expect(scriptBtn).toContainText("Safe mode");

    // Toggle scripts active
    page.once("dialog", (dialog) => dialog.accept());
    await scriptBtn.click();
    await expect(
      page.getByRole("button", { name: "Scripts active", exact: true }),
    ).toContainText("Scripts active");

    // Toggle back to safe mode
    await page
      .getByRole("button", { name: "Scripts active", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Safe mode", exact: true }),
    ).toContainText("Safe mode");
  });

  test("chooses Russian for both onboarding and the application", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Русский" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Редактируйте веб-страницу, никуда её не отправляя",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Пропустить знакомство" }).click();
    await expect(
      page.getByText("Открыть проект", { exact: true }).first(),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Открыть проект", { exact: true }).first(),
    ).toBeVisible();
  });

  test("shows creator information and social links in Help", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Help" }).click();
    await expect(
      page.getByRole("heading", { name: "Created by Gennady Zakharov" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Main website/ }),
    ).toHaveAttribute("href", "https://zakharov.asia/ru/");
    await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/globa_me/",
    );
    await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/zaharov-gennady/",
    );
  });

  test("blocks external project resources until explicitly allowed", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("https://external.example/**", async (route) => {
      requests += 1;
      await route.fulfill({ status: 200, contentType: "image/png", body: "" });
    });
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "private.html",
        mimeType: "text/html",
        buffer: Buffer.from(
          '<!doctype html><html><body><img src="https://external.example/pixel.png"><h1>Private</h1></body></html>',
        ),
      });
    await page.waitForTimeout(300);
    expect(requests).toBe(0);
    await page
      .getByRole("button", { name: "Private preview", exact: true })
      .click();
    await expect.poll(() => requests).toBeGreaterThan(0);
  });

  test("restores an autosaved project from this browser", async ({ page }) => {
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: "recover.html",
        mimeType: "text/html",
        buffer: Buffer.from(
          "<!doctype html><html><head><title>Recovery test</title></head><body><h1>Saved on this device</h1></body></html>",
        ),
      });
    await expect(page.frameLocator("iframe").locator("h1")).toContainText(
      "Saved on this device",
    );
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText("Recovery draft found")).toBeVisible();
    await page.getByRole("button", { name: "Restore draft" }).click();
    await expect(page.frameLocator("iframe").locator("h1")).toContainText(
      "Saved on this device",
    );
  });

  test("keeps the canvas primary and opens the inspector as a mobile sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(page.locator(".sidebar")).toHaveCount(0);
    await page.frameLocator("iframe").locator("h1").click();

    const inspector = page.locator(".right-panel");
    await expect(inspector).toBeVisible();
    await expect(inspector.locator(".inspector-header h2")).toContainText(
      "<h1>",
    );
    await expect(page.locator(".mobile-actions")).toBeVisible();
    expect(
      await inspector.evaluate((node) => getComputedStyle(node).position),
    ).toBe("fixed");
  });
});
