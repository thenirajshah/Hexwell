import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch();
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("http://localhost:4173/Hexwell/");
    await page.getByRole("heading", { name: "Fastener Dimension Catalogue" }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Horizontal overflow at " + width);
    await page.locator("#fastener-search").fill("ISO 4014");
    await page.getByRole("heading", { name: /Results for/ }).waitFor();
    await page.getByRole("link").filter({ hasText: "ISO 4014" }).first().click();
    await page.getByRole("heading", { name: "Technical dimensions" }).waitFor();
    const diagram = page.getByAltText(/dimension diagram/);
    await diagram.waitFor();
    await page.waitForFunction(() => [...document.images].filter(i => i.alt.includes("dimension diagram")).every(i => i.complete && i.naturalWidth > 0));
    await page.getByRole("button", { name: "Save size" }).click();
    await page.getByRole("button", { name: "On the bench" }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();
    console.log("Passed viewport", width);
  }
} finally { await browser.close(); }
