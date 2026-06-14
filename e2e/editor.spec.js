// Antigravity: E2E tests for visual HTML editing workflow, including undo/redo, responsive viewports, and script mode.
import { test, expect } from "@playwright/test";

test.describe("Bennu Visual Editor E2E Test Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server
    await page.goto("/");
  });

  test("loads editor shell and initial document", async ({ page }) => {
    // Verify brand title
    await expect(page.locator("aside.sidebar h1")).toContainText("Bennu");

    // Verify iframe exists
    const iframe = page.frameLocator("iframe");
    await expect(iframe.locator("h1")).toContainText("Edit this page directly in Bennu.");
  });

  test("selects h1 element, edits text, and duplicates it", async ({ page }) => {
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
    const duplicateBtn = page.locator('button:has-text("Duplicate selected element")');
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
    const sidebarBtn = page.locator('button[title*="left panel"]').first();
    await sidebarBtn.click();

    // Default desktop: width should scale up
    const initialWidth = await iframe.evaluate((el) => el.clientWidth);
    expect(initialWidth).toBeGreaterThan(500);

    // Click Tablet width
    const tabletBtn = page.locator('button[title="Tablet width"]');
    await tabletBtn.click();
    await expect(iframe).toHaveCSS("width", "768px");

    // Click Mobile width
    const mobileBtn = page.locator('button[title="Mobile width"]');
    await mobileBtn.click();
    await expect(iframe).toHaveCSS("width", "375px");

    // Click Desktop width
    const desktopBtn = page.locator('button[title="Desktop width"]');
    await desktopBtn.click();
    const iframeWidthStr = await iframe.evaluate((el) => el.style.width);
    expect(iframeWidthStr).toBe("100%");
  });

  test("toggles safe script mode status", async ({ page }) => {
    // By default, Safe Mode should be active
    const scriptBtn = page.locator('button[title*="user scripts"]');
    await expect(scriptBtn).toContainText("Safe Mode");

    // Toggle scripts active
    await scriptBtn.click();
    await expect(scriptBtn).toContainText("Scripts Active");

    // Toggle back to safe mode
    await scriptBtn.click();
    await expect(scriptBtn).toContainText("Safe Mode");
  });
});
