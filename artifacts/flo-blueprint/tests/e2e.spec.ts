import { test, expect, Page, BrowserContext } from "@playwright/test";
import { inflateSync } from "zlib";
import { execFileSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { runDiagnosticEngine, AssessmentAnswers } from "../src/lib/scoring";
import { getProfile } from "../src/lib/profiles";

/**
 * Decodes the RGB value at pixel (px, py) from a PNG Buffer using the raw
 * IDAT stream.  Handles all five PNG filter types (None, Sub, Up, Average,
 * Paeth) and both RGB (3 bpp) and RGBA (4 bpp) colour types.  Returns null
 * when the buffer is not a valid PNG or the coordinates are out of range.
 *
 * Used by the print-roadmap pixel tests to assert that circle backgrounds
 * contain brand colours and are not white.
 */
function decodePngRGBAt(
  buf: Buffer,
  px: number,
  py: number
): { r: number; g: number; b: number } | null {
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a)
    return null;

  let off = 8;
  let width = 0, height = 0, bpp = 4;
  const idats: Buffer[] = [];

  while (off + 12 <= buf.length) {
    const len  = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString("ascii");
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width  = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bpp    = data[9] === 2 ? 3 : 4; // colourType 2=RGB, 6=RGBA
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") break;
    off += 12 + len;
  }

  if (!width || !height || !idats.length || px >= width || py >= height)
    return null;

  let inf: Buffer;
  try { inf = inflateSync(Buffer.concat(idats)); }
  catch { return null; }

  const rowLen = 1 + width * bpp; // 1 filter byte + raw pixel bytes
  const pixels = Buffer.alloc(width * height * bpp, 0);

  for (let y = 0; y < height; y++) {
    const filt = inf[y * rowLen];
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < bpp; c++) {
        const raw = inf[y * rowLen + 1 + x * bpp + c];
        const a   = x > 0           ? pixels[(y * width + x - 1) * bpp + c]       : 0;
        const b   = y > 0           ? pixels[((y - 1) * width + x) * bpp + c]     : 0;
        const cc  = x > 0 && y > 0  ? pixels[((y - 1) * width + x - 1) * bpp + c]: 0;
        let v = 0;
        switch (filt) {
          case 0: v = raw; break;
          case 1: v = raw + a; break;
          case 2: v = raw + b; break;
          case 3: v = raw + ((a + b) >>> 1); break;
          case 4: {
            const p = a + b - cc;
            const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - cc);
            v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc);
            break;
          }
          default: return null; // unknown filter
        }
        pixels[(y * width + x) * bpp + c] = v & 0xff;
      }
    }
  }

  const i = (py * width + px) * bpp;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
}

/**
 * Scans every pixel in a PNG Buffer and returns true if any pixel is within
 * `tolerance` of the target RGB value.  Uses the same PNG decoder as
 * decodePngRGBAt (all 5 filter types, RGB + RGBA colour types).
 */
function scanPngForColour(
  pngBuf: Buffer,
  r: number, g: number, b: number,
  tolerance = 20
): boolean {
  if (pngBuf.readUInt32BE(0) !== 0x89504e47 || pngBuf.readUInt32BE(4) !== 0x0d0a1a0a)
    return false;

  let off = 8;
  let width = 0, height = 0, bpp = 4;
  const idats: Buffer[] = [];

  while (off + 12 <= pngBuf.length) {
    const len  = pngBuf.readUInt32BE(off);
    const type = pngBuf.subarray(off + 4, off + 8).toString("ascii");
    const data = pngBuf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width  = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bpp    = data[9] === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") break;
    off += 12 + len;
  }

  if (!width || !height || !idats.length) return false;

  let inf: Buffer;
  try { inf = inflateSync(Buffer.concat(idats)); }
  catch { return false; }

  const rowLen = 1 + width * bpp;
  const pixels = Buffer.alloc(width * height * bpp, 0);

  for (let y = 0; y < height; y++) {
    const filt = inf[y * rowLen];
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < bpp; c++) {
        const raw = inf[y * rowLen + 1 + x * bpp + c];
        const a   = x > 0           ? pixels[(y * width + x - 1) * bpp + c]       : 0;
        const bv  = y > 0           ? pixels[((y - 1) * width + x) * bpp + c]     : 0;
        const cc  = x > 0 && y > 0  ? pixels[((y - 1) * width + x - 1) * bpp + c]: 0;
        let v = 0;
        switch (filt) {
          case 0: v = raw; break;
          case 1: v = raw + a; break;
          case 2: v = raw + bv; break;
          case 3: v = raw + ((a + bv) >>> 1); break;
          case 4: {
            const p = a + bv - cc;
            const pa = Math.abs(p - a), pb = Math.abs(p - bv), pc = Math.abs(p - cc);
            v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? bv : cc);
            break;
          }
          default: return false;
        }
        pixels[(y * width + x) * bpp + c] = v & 0xff;
      }
    }
  }

  for (let i = 0; i < width * height; i++) {
    if (
      Math.abs(pixels[i * bpp]     - r) <= tolerance &&
      Math.abs(pixels[i * bpp + 1] - g) <= tolerance &&
      Math.abs(pixels[i * bpp + 2] - b) <= tolerance
    ) return true;
  }

  return false;
}

/**
 * Saves a PDF buffer to a temp file and uses the system's `pdftoppm` tool to
 * rasterise every page as a PNG at 72 dpi.  Returns a Buffer for each page
 * image produced.  Returns an empty array if pdftoppm is unavailable or fails.
 */
function pdfToPageImages(pdfBuf: Buffer, prefix: string): Buffer[] {
  const pdfPath  = `/tmp/${prefix}.pdf`;
  const outPfx   = `/tmp/${prefix}-pg`;

  writeFileSync(pdfPath, pdfBuf);

  try {
    execFileSync("pdftoppm", ["-r", "72", "-png", pdfPath, outPfx], {
      timeout: 60_000,
    });
  } catch {
    return [];
  }

  const pages: Buffer[] = [];
  for (let i = 1; i <= 30; i++) {
    // pdftoppm zero-pads the suffix based on total page count
    for (const pad of [1, 2, 3]) {
      const suffix = String(i).padStart(pad, "0");
      try {
        pages.push(readFileSync(`${outPfx}-${suffix}.png`));
        break;
      } catch { /* try next padding */ }
    }
    if (pages.length < i) break; // no image found for page i — done
  }

  return pages;
}

const BASE = "http://localhost:80";

const INTRO_KEY = "flo_blueprint_intro_seen";
const STATE_KEY = "flo_blueprint_state";
const E2E_USER_KEY = "__flo_e2e_user_id__";
const E2E_TEST_USER_ID = "user_e2etest_playwright";

async function setIntroSeen(page: Page) {
  await page.evaluate(
    ({ introKey }) => localStorage.setItem(introKey, "1"),
    { introKey: INTRO_KEY }
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

function assertNoErrors(errors: string[]) {
  const filtered = errors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("__clerk") &&
      !e.includes("clerk.accounts.dev") &&
      !e.includes("clerk-js")
  );
  expect(filtered, `Unexpected console errors: ${filtered.join("\n")}`).toHaveLength(0);
}

async function answerQ1(page: Page) {
  await page.getByTestId("option-growing-consistently").click();
  await page.getByTestId("button-next").click();
}

async function answerQ2(page: Page) {
  await page.getByTestId("option-2-to-5").click();
  await page.getByTestId("button-next").click();
}

async function answerQ3(page: Page) {
  await page.getByTestId("option-we-know-what-to-do-but-don't-have-time").click();
  await page.getByTestId("button-next").click();
}

async function answerQ4(page: Page) {
  await page.getByTestId("option-operations").click();
  await page.getByTestId("option-technology").click();
  await page.getByTestId("button-next").click();
}

async function answerQ5(page: Page) {
  await page.getByTestId("option-better-systems").click();
  await page.getByTestId("button-next").click();
}

async function answerQ6(page: Page) {
  await page
    .getByTestId("input-q6-fix")
    .fill(
      "We need better processes and automation to remove manual bottlenecks."
    );
  await page.getByTestId("button-next").click();
}

async function answerQ7(page: Page) {
  await page.getByTestId("option-within-30-days").click();
  await page.getByTestId("button-next").click();
}

async function waitForQuestion(page: Page, n: number) {
  await page.waitForFunction(
    (num) => document.body.innerText.includes(`Question ${num} of 7`),
    n,
    { timeout: 15000 }
  );
}

async function completeAllSevenQuestions(page: Page) {
  await waitForQuestion(page, 1);
  await answerQ1(page);
  await waitForQuestion(page, 2);
  await answerQ2(page);
  await waitForQuestion(page, 3);
  await answerQ3(page);
  await waitForQuestion(page, 4);
  await answerQ4(page);
  await waitForQuestion(page, 5);
  await answerQ5(page);
  await waitForQuestion(page, 6);
  await answerQ6(page);
  await waitForQuestion(page, 7);
  await answerQ7(page);
}

async function newCtxWithIntroSeen(browser: import("@playwright/test").Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/");
  await page.waitForLoadState("domcontentloaded");
  await setIntroSeen(page);
  return { ctx, page };
}

// ---------------------------------------------------------------------------
// Pre-compute state for dashboard injection tests (no auth required)
// ---------------------------------------------------------------------------

const TEST_ANSWERS: AssessmentAnswers = {
  q1_stage: "Growing consistently",
  q2_size: "6 to 15",
  q3_challenge: "Our systems aren't keeping up",
  q4_friction: ["Operations", "Technology", "Marketing"],
  q5_impact: "Better systems",
  q6_fix: "We need better processes and automation to remove manual bottlenecks.",
  q7_timeline: "Within 30 Days",
};

const TEST_DIAGNOSTIC = runDiagnosticEngine(TEST_ANSWERS);
const TEST_PROFILE = getProfile(TEST_DIAGNOSTIC);

const TEST_LEAD = {
  id: "e2e-test-lead-001",
  clerkUserId: E2E_TEST_USER_ID,
  firstName: "Test",
  lastName: "User",
  email: "test@e2etest.example.com",
  company: "E2E Test Corp",
  role: "CEO",
};

/** Injects pre-computed state into localStorage and navigates to the given path.
 *  Best used for dashboard tests — does NOT set the auth bypass (report tests
 *  need the full authenticated flow). */
async function injectDashboardState(page: Page) {
  await page.goto(BASE + "/");
  await page.waitForLoadState("domcontentloaded");

  const state = {
    currentStep: "dashboard",
    answers: TEST_ANSWERS,
    diagnostic: TEST_DIAGNOSTIC,
    profile: TEST_PROFILE,
    lead: TEST_LEAD,
    tracking: {},
  };

  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STATE_KEY, value: state }
  );
  await page.evaluate(
    ({ key }) => localStorage.setItem(key, "1"),
    { key: INTRO_KEY }
  );

  await page.goto(BASE + "/dashboard");
  await page.waitForLoadState("networkidle");
}

/** Creates a new browser context with the full report-ready state pre-seeded into
 *  localStorage (diagnostic + profile + lead + E2E auth bypass), then navigates to
 *  /report with an optional query string.
 *
 *  Uses page.addInitScript (runs before any page JS) so localStorage is always set
 *  before the React app initialises — preventing RedirectToCorrectStep from firing
 *  during the brief window between navigation and state injection. */
async function newCtxWithReportState(
  browser: import("@playwright/test").Browser,
  { query = "" }: { query?: string } = {}
): Promise<{ ctx: import("@playwright/test").BrowserContext; page: Page }> {
  const state = {
    currentStep: "report",
    answers: TEST_ANSWERS,
    diagnostic: TEST_DIAGNOSTIC,
    profile: TEST_PROFILE,
    lead: TEST_LEAD,
    tracking: {},
  };

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // addInitScript runs before the page's own scripts on every navigation within
  // this page, so localStorage is populated before React (and Clerk) initialise.
  await page.addInitScript(
    ({ stateKey, stateValue, introKey, e2eKey, userId }) => {
      localStorage.setItem(stateKey, JSON.stringify(stateValue));
      localStorage.setItem(introKey, "1");
      localStorage.setItem(e2eKey, userId);
    },
    {
      stateKey: STATE_KEY,
      stateValue: state,
      introKey: INTRO_KEY,
      e2eKey: E2E_USER_KEY,
      userId: E2E_TEST_USER_ID,
    }
  );

  const url = BASE + "/report" + (query ? `?${query}` : "");
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  return { ctx, page };
}

/** Completes the full authenticated flow (assessment → dashboard → profile form → report)
 *  and returns a page object on /report. Caller is responsible for closing the context. */
async function setupAuthenticatedReportPage(
  browser: import("@playwright/test").Browser
): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(BASE + "/");
  await page.waitForLoadState("domcontentloaded");
  await setIntroSeen(page);
  // Activate the DEV-only E2E auth bypass
  await page.evaluate(
    ({ key, userId }) => localStorage.setItem(key, userId),
    { key: E2E_USER_KEY, userId: E2E_TEST_USER_ID }
  );

  await page.goto(BASE + "/assessment");
  await page.waitForLoadState("networkidle");
  await completeAllSevenQuestions(page);

  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.getByTestId("button-unlock-report").click();

  await page.waitForURL("**/profile", { timeout: 15000 });

  await page.getByTestId("input-company").fill("E2E Test Corp");
  await page.getByTestId("input-role").fill("CEO");
  await page.selectOption('[data-testid="select-industry"]', "Technology & SaaS");
  await page.selectOption('[data-testid="select-revenue"]', "$1M \u2013 $5M");
  await page.getByTestId("input-website").fill("https://e2etest.example.com");
  await page.getByTestId("button-submit-profile").click();

  await page.waitForURL("**/report", { timeout: 20000 });
  await expect(
    page.getByRole("heading", { name: "Executive Business Intelligence Report" })
  ).toBeVisible({ timeout: 15000 });

  return { ctx, page };
}

// ---------------------------------------------------------------------------
// Original tests (unchanged)
// ---------------------------------------------------------------------------

test.describe("The Flo Blueprint — assessment-to-dashboard flow", () => {
  test("landing page renders brand elements correctly", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(BASE + "/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "The Flo Blueprint™" })).toBeVisible();
    await expect(page.getByText("Less Work. More Flo.").first()).toBeVisible();
    await expect(page.getByTestId("button-start-blueprint")).toBeVisible();
    await expect(page.getByTestId("button-learn-more")).toBeVisible();

    assertNoErrors(errors);
  });

  test("first visit: intro screen appears before Q1", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await page.goto(BASE + "/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("button-start-blueprint").click();
    await page.waitForURL("**/assessment");

    await expect(
      page.getByRole("heading", { name: "This isn't a personality quiz." })
    ).toBeVisible();
    await expect(page.getByTestId("button-begin-diagnostic")).toBeVisible();

    const introBefore = await page.evaluate((k) => localStorage.getItem(k), INTRO_KEY);
    expect(introBefore).toBeNull();

    await page.getByTestId("button-begin-diagnostic").click();
    await expect(
      page.getByRole("heading", { name: "This isn't a personality quiz." })
    ).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Question 1 of 7")).toBeVisible();

    const introAfter = await page.evaluate((k) => localStorage.getItem(k), INTRO_KEY);
    expect(introAfter).toBe("1");

    assertNoErrors(errors);
    await ctx.close();
  });

  test("return visit: intro is skipped and Q1 is shown immediately", async ({ browser }) => {
    const { ctx, page } = await newCtxWithIntroSeen(browser);
    const errors = collectErrors(page);

    await page.goto(BASE + "/assessment");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "This isn't a personality quiz." })
    ).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Question 1 of 7")).toBeVisible();

    assertNoErrors(errors);
    await ctx.close();
  });

  test("rotating tagline is present during assessment", async ({ browser }) => {
    const { ctx, page } = await newCtxWithIntroSeen(browser);
    const errors = collectErrors(page);

    await page.goto(BASE + "/assessment");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Question 1 of 7")).toBeVisible();

    const taglineLocator = page.locator('[aria-live="polite"][aria-atomic="true"]');
    await expect(taglineLocator).toBeVisible();
    const taglineText = await taglineLocator.textContent();
    const validLines = [
      "Less Work. More Flo.",
      "Every answer helps identify what's creating unnecessary work.",
      "Your diagnostic is being built in real time.",
    ];
    expect(validLines.some((line) => taglineText?.includes(line))).toBe(true);

    assertNoErrors(errors);
    await ctx.close();
  });

  test("completes all 7 questions and dashboard renders", async ({ browser }) => {
    const { ctx, page } = await newCtxWithIntroSeen(browser);
    const errors = collectErrors(page);

    await page.goto(BASE + "/assessment");
    await page.waitForLoadState("networkidle");
    await completeAllSevenQuestions(page);

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Your Business Growth Snapshot" })
    ).toBeVisible();
    await expect(page.getByText("Business Health Score")).toBeVisible();
    await expect(page.getByText("Primary Business Constraint")).toBeVisible();
    await expect(page.getByText("Flo Blueprint Profile").first()).toBeVisible();
    await expect(page.getByTestId("button-unlock-report")).toBeVisible();

    assertNoErrors(errors);
    await ctx.close();
  });

  test("auth gate: unauthenticated user is directed to sign-in from dashboard", async ({
    browser,
  }) => {
    const { ctx, page } = await newCtxWithIntroSeen(browser);
    const errors = collectErrors(page);

    await page.goto(BASE + "/assessment");
    await page.waitForLoadState("networkidle");
    await completeAllSevenQuestions(page);

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByTestId("button-unlock-report")).toBeVisible();
    await page.getByTestId("button-unlock-report").click();

    await page.waitForURL("**/sign-in**", { timeout: 10000 });
    expect(page.url()).toContain("/sign-in");

    assertNoErrors(errors);
    await ctx.close();
  });

  test("full flow: dashboard → lead form → report (authenticated)", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await page.goto(BASE + "/");
    await page.waitForLoadState("domcontentloaded");
    await setIntroSeen(page);
    // Activate the DEV-only E2E auth bypass so the app treats this browser session
    // as authenticated with a known user ID (no Clerk network access needed in CI/headless).
    await page.evaluate(
      ({ key, userId }) => localStorage.setItem(key, userId),
      { key: E2E_USER_KEY, userId: E2E_TEST_USER_ID }
    );

    await page.goto(BASE + "/assessment");
    await page.waitForLoadState("networkidle");
    await completeAllSevenQuestions(page);

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByTestId("button-unlock-report")).toBeVisible();
    // With the E2E bypass active, "Save My Blueprint" routes to /profile immediately
    await page.getByTestId("button-unlock-report").click();

    await page.waitForURL("**/profile", { timeout: 15000 });

    await page.getByTestId("input-company").fill("Blueprint Test Corp");
    await page.getByTestId("input-role").fill("CEO");
    await page.selectOption('[data-testid="select-industry"]', "Technology & SaaS");
    await page.selectOption('[data-testid="select-revenue"]', "$1M \u2013 $5M");
    await page.getByTestId("input-website").fill("https://blueprinttest.example.com");

    await page.getByTestId("button-submit-profile").click();

    await page.waitForURL("**/report", { timeout: 20000 });

    await expect(
      page.getByRole("heading", { name: "Executive Business Intelligence Report" })
    ).toBeVisible();
    await expect(page.getByText("Executive Summary")).toBeVisible();
    await expect(page.getByTestId("button-retake")).toBeVisible();
    await expect(page.getByTestId("button-print")).toBeVisible();

    assertNoErrors(errors);
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Dashboard — metric cards, benchmark labels, and 6-node roadmap
// (use localStorage state injection — dashboard renders without auth)
// ---------------------------------------------------------------------------

test.describe("Dashboard — headline metric cards and benchmarks", () => {
  test("all 6 headline metric sections render with non-empty, non-zero values", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await injectDashboardState(page);

    // 1. Business Health Score gauge — aria-label carries "Business Health Score: N out of 100"
    const gaugeEl = page.locator('[aria-label^="Business Health Score:"]').first();
    await expect(gaugeEl).toBeVisible();
    const bhsAriaLabel = await gaugeEl.getAttribute("aria-label");
    const bhsMatch = (bhsAriaLabel ?? "").match(/(\d+)\s+out\s+of\s+100/);
    expect(bhsMatch, `BHS aria-label should match pattern (got: "${bhsAriaLabel}")`).toBeTruthy();
    const renderedBhs = parseInt(bhsMatch![1], 10);
    expect(renderedBhs, "Rendered Business Health Score must be > 0").toBeGreaterThan(0);

    // 2. Primary Business Constraint card label
    await expect(page.getByText("Primary Business Constraint").first()).toBeVisible();

    // 3. Flo Blueprint Profile card
    await expect(page.getByText("Flo Blueprint Profile").first()).toBeVisible();

    // 4–6. Additional metric cards — parse actual rendered DOM values from the section
    const metricsSection = page.locator('[aria-label="Additional business metrics"]');
    await expect(metricsSection).toBeVisible();

    const metricLabels = [
      "Growth Readiness Score",
      "AI Opportunity Score",
      "Operational Efficiency Score",
    ] as const;

    for (const label of metricLabels) {
      // Locate the MetricCard container that has this label, then grab the value <p>
      const card = metricsSection.locator("div").filter({ hasText: label }).first();
      await expect(card).toBeVisible();

      // The value is rendered as "XX%" — find the first <p> inside the card that ends with "%"
      const valuePara = card.locator("p").filter({ hasText: /^\d+%$/ }).first();
      await expect(
        valuePara,
        `${label}: value element "XX%" must be visible`
      ).toBeVisible();
      const valueText = await valuePara.textContent();
      const pct = parseInt((valueText ?? "").replace("%", ""), 10);
      expect(
        Number.isFinite(pct),
        `${label}: rendered value must be a finite number (got: "${valueText}")`
      ).toBe(true);
      expect(pct, `${label}: rendered value must be > 0`).toBeGreaterThan(0);
      expect(pct, `${label}: rendered value must be <= 100`).toBeLessThanOrEqual(100);
    }

    // ── Callout chips ─────────────────────────────────────────────────────────
    await expect(page.getByText("Est. Hours Lost Weekly")).toBeVisible();
    await expect(page.getByText("Revenue Leakage Level")).toBeVisible();

    // Hours lost chip contains "hrs/week" text
    const hoursText = await page.locator("text=/hrs?\\/week/i").first().textContent();
    expect(hoursText, "Hours lost chip must show a non-empty hours range").toBeTruthy();

    // Revenue leakage chip must show one of the 4 valid levels
    const validLevels = ["Low", "Moderate", "High", "Critical"];
    const leakageVisible = await Promise.all(
      validLevels.map((lvl) =>
        page.getByText(lvl, { exact: true }).first().isVisible().catch(() => false)
      )
    );
    expect(
      leakageVisible.some(Boolean),
      "At least one revenue leakage level chip must be visible"
    ).toBe(true);

    assertNoErrors(errors);
    await ctx.close();
  });

  test("category score bars show both Avg and Top benchmark labels", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await injectDashboardState(page);

    // The Category Breakdown section must be visible
    await expect(page.getByText("Category Breakdown")).toBeVisible();

    // Wait for animated score bars to settle (staggered CSS transitions)
    await page.waitForTimeout(2000);

    // Score bars render "Avg: XX%" and "Top: XX%" labels for each category
    const avgLabels = page.locator("text=/Avg: \\d+%/");
    const topLabels = page.locator("text=/Top: \\d+%/");

    const avgCount = await avgLabels.count();
    const topCount = await topLabels.count();

    expect(avgCount, "Must have Avg benchmark labels (one per category)").toBeGreaterThanOrEqual(3);
    expect(topCount, "Must have Top benchmark labels (one per category)").toBeGreaterThanOrEqual(3);

    // Spot-check: first visible Avg value must be a positive number
    const firstAvgText = await avgLabels.first().textContent();
    const firstAvgNum = parseInt((firstAvgText ?? "").replace(/\D/g, ""), 10);
    expect(firstAvgNum, "First Avg benchmark must be > 0").toBeGreaterThan(0);

    const firstTopText = await topLabels.first().textContent();
    const firstTopNum = parseInt((firstTopText ?? "").replace(/\D/g, ""), 10);
    expect(firstTopNum, "First Top benchmark must be > 0").toBeGreaterThan(0);

    assertNoErrors(errors);
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Dashboard — 6-node Implementation Roadmap (desktop + mobile)
// ---------------------------------------------------------------------------

test.describe("Dashboard — 6-node Implementation Roadmap", () => {
  test("desktop (1280px): 6 roadmap nodes are visible with correct labels", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await injectDashboardState(page);

    await expect(page.getByRole("heading", { name: "Your Implementation Roadmap" })).toBeVisible();

    // At desktop width the horizontal container (hidden md:flex) is visible
    const horizontalContainer = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Your Implementation Roadmap" }),
    });
    await expect(horizontalContainer).toBeVisible();

    // All 6 node label texts must be visible on screen
    const expectedNodeLabels = [
      "Current Stage",
      "Primary Constraint",
      "Recommended Focus",
      "90-Day Action",
      "TymFlo Service",
      "Less Work. More Flo.",
    ];
    for (const label of expectedNodeLabels) {
      await expect(
        page.getByText(label, { exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    assertNoErrors(errors);
    await ctx.close();
  });

  test("mobile (400×720): all 6 roadmap nodes visible in vertical layout", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 400, height: 720 },
    });
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    await injectDashboardState(page);

    await expect(page.getByRole("heading", { name: "Your Implementation Roadmap" })).toBeVisible();

    // On mobile, the vertical container must be visible and show all 6 node labels.
    //
    // Both desktop (.hidden.md:flex) and mobile (.flex-col.md:hidden) containers
    // render identical text. At 400px the DESKTOP container is display:none and the
    // MOBILE container is visible. Each label therefore appears TWICE in the DOM:
    // - index 0 → desktop container (hidden at 400px)
    // - index 1 → mobile container  (visible at 400px)
    // Use .nth(1) to reliably target the mobile instance.
    const expectedNodeLabels = [
      "Current Stage",
      "Primary Constraint",
      "Recommended Focus",
      "90-Day Action",
      "TymFlo Service",
      "Less Work. More Flo.",
    ];

    // Both containers (desktop hidden + mobile visible) render identical text.
    // We can't rely on nth(N) because the DOM position depends on React render order
    // and the number of extra matches Playwright finds. Instead we iterate all
    // instances of each label text and verify at least one is visually visible
    // (i.e., has a non-zero bounding rect in the 400px viewport).
    for (const label of expectedNodeLabels) {
      const allInstances = page.getByText(label, { exact: true });
      const count = await allInstances.count();
      expect(count, `"${label}" must appear in the DOM at least once`).toBeGreaterThanOrEqual(1);

      let anyVisible = false;
      for (let i = 0; i < count; i++) {
        if (await allInstances.nth(i).isVisible()) {
          anyVisible = true;
          break;
        }
      }
      expect(anyVisible, `At least one "${label}" element must be visible at 400px width`).toBe(true);
    }

    // Verify the roadmap description text is present
    await expect(
      page.getByText("From where you are today to Less Work. More Flo.")
    ).toBeVisible();

    assertNoErrors(errors);
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Report page — authenticated, using the full flow
// Tests "Why This Score" toggle and "Your Next Step" debrief offer
// ---------------------------------------------------------------------------

test.describe("Report — Growth Snapshot toggle and debrief offer", () => {
  test('"Why this score" toggle opens and closes; debrief offer renders with price', async ({
    browser,
  }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);
    const errors = collectErrors(page);

    await expect(
      page.getByRole("heading", { name: "Executive Business Intelligence Report" })
    ).toBeVisible();

    // ── "Why this score" toggle ────────────────────────────────────────────────

    // Locate the first "Why this score ▼" button in the Growth Snapshot section
    const toggleBtn = page
      .getByRole("button", { name: /Why this score/i })
      .first();
    await expect(toggleBtn).toBeVisible();

    // Initially collapsed — aria-expanded="false"
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await toggleBtn.click();

    // aria-expanded should now be "true"
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    // Expanded panel must show benchmark content
    await expect(page.getByText("What this means").first()).toBeVisible();
    await expect(
      page.getByText("What top performers do differently").first()
    ).toBeVisible();

    // Button text should contain "Hide"
    await expect(toggleBtn).toContainText("Hide");

    // Click to collapse
    await toggleBtn.click();

    // aria-expanded returns to "false" and panel disappears
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    await expect(toggleBtn).toContainText("Why this score");

    // ── "Your Next Step" / Executive Debrief offer ────────────────────────────

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(
      page.getByRole("heading", {
        name: "Turn Your Blueprint Into a Clear 90-Day Plan",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "The Flo Blueprint™ Executive Debrief",
      })
    ).toBeVisible();

    // Price must be visible and positive (default $197)
    const priceEl = page.locator("text=/\\$\\d+/").first();
    await expect(priceEl).toBeVisible();
    const priceText = await priceEl.textContent();
    const priceNum = parseInt((priceText ?? "").replace(/\D/g, ""), 10);
    expect(priceNum, "Debrief price must be > 0").toBeGreaterThan(0);

    // Purchase CTA must be visible and enabled
    const purchaseBtn = page.getByTestId("button-purchase-debrief");
    await expect(purchaseBtn).toBeVisible();
    await expect(purchaseBtn).toBeEnabled();
    await expect(purchaseBtn).toContainText("Purchase My Executive Debrief");

    assertNoErrors(errors);
    await ctx.close();
  });

  test("report headline indicators show 6 non-empty metric cards", async ({ browser }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);
    const errors = collectErrors(page);

    await expect(
      page.getByRole("heading", { name: "Executive Business Intelligence Report" })
    ).toBeVisible();

    // Headline Indicators section
    await expect(page.getByRole("heading", { name: "Headline Indicators" })).toBeVisible();

    // All 6 metric label texts must appear in the report
    const metricLabels = [
      "Business Health Score",
      "Diagnosis Confidence",
      "Growth Readiness",
      "AI Opportunity Score",
      "Operational Efficiency",
      "Revenue Leakage Level",
    ];
    for (const label of metricLabels) {
      await expect(
        page.getByText(label, { exact: false }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Business Health Score must be non-zero (format: "XX/100")
    const bhsEl = page.locator("text=/\\d+\\/100/").first();
    await expect(bhsEl).toBeVisible();
    const bhsText = await bhsEl.textContent();
    const bhsVal = parseInt((bhsText ?? "").split("/")[0], 10);
    expect(bhsVal, "Report Business Health Score must be > 0").toBeGreaterThan(0);

    // Estimated hours lost must be present
    await expect(
      page.getByText("Estimated hours lost weekly", { exact: false }).first()
    ).toBeVisible();

    assertNoErrors(errors);
    await ctx.close();
  });

  test("DebriefFocusPage renders all 4 focus option cards after payment is verified", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = collectErrors(page);

    // Intercept the payment-status API so the page renders the "verified" state
    // without requiring a real Stripe session.
    await page.route("**/api/debrief/status*", (route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ paid: true, leadId: null }),
      });
    });

    await page.goto(BASE + "/debrief/focus?session_id=test_e2e_session");
    await page.waitForLoadState("networkidle");

    // Heading confirms the "Choose your focus" view is rendered
    await expect(
      page.getByRole("heading", { name: "What Would You Like to Focus On?" })
    ).toBeVisible({ timeout: 8000 });

    // All 4 FOCUS_OPTIONS must be present inside the radiogroup
    const radioGroup = page.getByRole("radiogroup", { name: "Select your focus area" });
    await expect(radioGroup).toBeVisible();

    const focusTitles = [
      "I Need Clarity",
      "I Need More Qualified Leads",
      "I Need to Save Time",
      "I Want Someone to Build This for Me",
    ] as const;

    for (const title of focusTitles) {
      await expect(
        page.getByText(title, { exact: true }).first()
      ).toBeVisible({ timeout: 5000 });
    }

    // Submit button is disabled until a card is selected
    const scheduleBtn = page.getByRole("button", { name: "Schedule My Debrief" });
    await expect(scheduleBtn).toBeVisible();
    await expect(scheduleBtn).toBeDisabled();

    // Selecting a card enables the submit button
    await page.getByText("I Need Clarity", { exact: true }).click();
    await expect(scheduleBtn).toBeEnabled();

    assertNoErrors(errors);
    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Service card checkout — happy-path end-to-end (mocked Stripe)
// Confirms button click → POST /api/checkout with correct serviceId → redirect
// to checkout.stripe.com, and that the Calendly card opens a new tab.
// ---------------------------------------------------------------------------

const STRIPE_SERVICE_CARDS = [
  {
    serviceId: "executive-growth-strategy",
    label: "Executive Growth Strategy Session",
    ctaText: "Book This Session",
  },
  {
    serviceId: "marketing-systems-review",
    label: "Marketing Systems Review",
    ctaText: "Book This Review",
  },
  {
    serviceId: "ai-workflow-accelerator",
    label: "AI Workflow Accelerator",
    ctaText: "Start the Accelerator",
  },
] as const;

test.describe("Service card checkout — happy-path end-to-end", () => {
  for (const svc of STRIPE_SERVICE_CARDS) {
    test(`${svc.label}: button click POSTs correct serviceId and redirects to Stripe`, async ({
      browser,
    }) => {
      const { ctx, page } = await setupAuthenticatedReportPage(browser);

      // Capture the API request body and return a fake Stripe checkout URL
      let capturedBody: Record<string, unknown> | null = null;
      let capturedStripeUrl: string | null = null;

      await page.route("**/api/checkout", async (route) => {
        const req = route.request();
        if (req.url().includes("/debrief")) {
          return route.continue();
        }
        try {
          capturedBody = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
        } catch {
          capturedBody = {};
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: `https://checkout.stripe.com/pay/cs_test_mock_${svc.serviceId}`,
            sessionId: `cs_test_mock_${svc.serviceId}`,
          }),
        });
      });

      // Abort the outbound Stripe navigation so the test page stays alive;
      // capture the URL that the app tried to navigate to.
      await page.route("https://checkout.stripe.com/**", (route) => {
        capturedStripeUrl = route.request().url();
        void route.abort();
      });

      // Scroll to the service cards section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const purchaseBtn = page.getByTestId(`button-purchase-${svc.serviceId}`);
      await expect(purchaseBtn).toBeVisible({ timeout: 8000 });
      await expect(purchaseBtn).toBeEnabled();
      await expect(purchaseBtn).toContainText(svc.ctaText);

      // Click and wait for the API call to complete (intercepted above).
      // We must not await further DOM checks after this because window.location.href
      // fires immediately after the API responds, navigating the page away.
      await Promise.all([
        page.waitForRequest((req) => req.url().includes("/api/checkout") && !req.url().includes("/debrief")),
        purchaseBtn.click(),
      ]);

      // Give the browser time to process the location.href → Stripe navigation attempt
      await page.waitForTimeout(2000);

      // 1. The API was POSTed with the correct serviceId
      expect(capturedBody, "API request body must be captured").not.toBeNull();
      expect(
        capturedBody?.["serviceId"],
        `serviceId in request must be "${svc.serviceId}"`
      ).toBe(svc.serviceId);

      // successUrl and cancelUrl must be present
      expect(capturedBody?.["successUrl"], "successUrl must be present").toBeTruthy();
      expect(capturedBody?.["cancelUrl"], "cancelUrl must be present").toBeTruthy();
      const successUrl = String(capturedBody?.["successUrl"] ?? "");
      expect(successUrl).toContain(`service_purchased=${svc.serviceId}`);

      // 2. The browser attempted to navigate to checkout.stripe.com
      expect(
        capturedStripeUrl,
        "Browser must have attempted navigation to checkout.stripe.com"
      ).not.toBeNull();
      expect(capturedStripeUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);

      await ctx.close();
    });
  }

  test("Explore Partnership card opens Calendly in a new tab", async ({ browser }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);

    // Scroll to the service cards section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const partnershipBtn = page.getByTestId("button-purchase-executive-implementation-partnership");
    await expect(partnershipBtn).toBeVisible({ timeout: 8000 });
    await expect(partnershipBtn).toBeEnabled();
    await expect(partnershipBtn).toContainText("Explore Partnership");

    // window.open(..., "_blank") triggers Playwright's "popup" event
    const popupPromise = page.waitForEvent("popup", { timeout: 10000 });
    await partnershipBtn.click();
    const popup = await popupPromise;

    // The new tab's URL must point to Calendly (env fallback: https://calendly.com/tymflo)
    const popupUrl = popup.url();
    expect(
      popupUrl,
      `Partnership popup URL must be a Calendly URL (got: ${popupUrl})`
    ).toMatch(/calendly\.com/);

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Service purchase success banner — Schedule Your Session CTA
// ---------------------------------------------------------------------------

test.describe("Service purchase success banner — Schedule Your Session CTA", () => {
  test("banner is visible with correct service name after ?service_purchased param", async ({
    browser,
  }) => {
    const { ctx, page } = await newCtxWithReportState(browser, {
      query: "service_purchased=executive-growth-strategy",
    });
    const errors = collectErrors(page);

    const banner = page.getByTestId("service-purchase-success");
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Banner must display the resolved service name, not the generic fallback
    await expect(banner).toContainText("Executive Growth Strategy Session");

    assertNoErrors(errors);
    await ctx.close();
  });

  // The component resolves the scheduling URL with the following priority:
  //   VITE_EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL  (per-service override)
  //   → VITE_SERVICE_SCHEDULING_URL                 (shared fallback)
  //   → "" (no URL configured → show "TymFlo will be in touch" fallback text)
  //
  // We read the same env vars from the Node test-runner process (which shares the
  // Replit environment with the Vite dev server) so the assertion is always
  // deterministic — no test.skip required.
  //
  // This catches the key regression: a scheduling URL is configured in the env but
  // the component fails to show the link (wrong var name, broken component, etc.).

  test("'Schedule Your Session' CTA renders correctly for the configured environment", async ({
    browser,
  }) => {
    const { ctx, page } = await newCtxWithReportState(browser, {
      query: "service_purchased=executive-growth-strategy",
    });
    const errors = collectErrors(page);

    const banner = page.getByTestId("service-purchase-success");
    await expect(banner).toBeVisible({ timeout: 10000 });

    const scheduleLink = page.getByTestId("service-purchase-schedule-link");
    const fallback = banner.getByText(/TymFlo will be in touch/);

    // Resolve the expected scheduling URL using the same priority as the component.
    const configuredUrl =
      process.env.VITE_EXECUTIVE_GROWTH_STRATEGY_SCHEDULING_URL ||
      process.env.VITE_SERVICE_SCHEDULING_URL ||
      "";

    if (configuredUrl) {
      // URL is configured — the link must be visible with that EXACT href.
      // Any mismatch (wrong var name, typo, broken component) will fail here.
      await expect(scheduleLink).toBeVisible({ timeout: 5000 });
      await expect(scheduleLink).toContainText("Schedule Your Session");
      const href = await scheduleLink.getAttribute("href");
      expect(
        href,
        `Schedule link href must equal the configured URL "${configuredUrl}"`
      ).toBe(configuredUrl);
      await expect(fallback).not.toBeVisible();
    } else {
      // No URL configured — fallback text must be shown and the link must be absent.
      await expect(fallback).toBeVisible({ timeout: 5000 });
      await expect(scheduleLink).not.toBeVisible();
    }

    assertNoErrors(errors);
    await ctx.close();
  });

  test("URL is cleaned — service_purchased param removed after banner renders", async ({
    browser,
  }) => {
    const { ctx, page } = await newCtxWithReportState(browser, {
      query: "service_purchased=executive-growth-strategy",
    });
    const errors = collectErrors(page);

    // Wait for banner (proves the param was read successfully)
    await expect(page.getByTestId("service-purchase-success")).toBeVisible({ timeout: 10000 });

    // window.history.replaceState must have stripped the query param
    const currentUrl = page.url();
    expect(
      currentUrl,
      "service_purchased must be removed from the URL after the banner renders"
    ).not.toContain("service_purchased");

    assertNoErrors(errors);
    await ctx.close();
  });

  test("no banner when ?service_purchased is absent", async ({ browser }) => {
    const { ctx, page } = await newCtxWithReportState(browser);
    const errors = collectErrors(page);

    const banner = page.getByTestId("service-purchase-success");
    await expect(banner).not.toBeVisible({ timeout: 5000 });

    assertNoErrors(errors);
    await ctx.close();
  });

  test("all three Stripe service IDs show a named banner (no 'your service' fallback)", async ({
    browser,
  }) => {
    const serviceIds = [
      "executive-growth-strategy",
      "marketing-systems-review",
      "ai-workflow-accelerator",
    ] as const;

    for (const serviceId of serviceIds) {
      const { ctx, page } = await newCtxWithReportState(browser, {
        query: `service_purchased=${serviceId}`,
      });

      const banner = page.getByTestId("service-purchase-success");
      await expect(banner).toBeVisible({ timeout: 10000 });

      const bannerText = await banner.textContent();
      expect(
        bannerText,
        `Banner for "${serviceId}" must not fall back to the generic "your service" placeholder`
      ).not.toContain("your service");

      await ctx.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Checkout failure — Stripe unreachable fallback CTA
// ---------------------------------------------------------------------------

test.describe("Checkout failure — Stripe unreachable fallback", () => {
  test("service card: API failure shows error block with 'Contact us instead' link", async ({
    browser,
  }) => {
    // Use the full authenticated flow to ensure a valid diagnostic state is in place
    const { ctx, page } = await setupAuthenticatedReportPage(browser);

    // Intercept /api/checkout (NOT /api/checkout/debrief) and return a 500 error
    await page.route("**/api/checkout", (route) => {
      const url = route.request().url();
      // Only intercept the service-card endpoint, not the debrief endpoint
      if (url.includes("/debrief")) {
        return route.continue();
      }
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      });
    });

    // Scroll to the "Choose Your Next Step" service cards section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click the first Stripe-backed service card purchase button
    const firstStripeServiceId = "executive-growth-strategy";
    const purchaseBtn = page.getByTestId(`button-purchase-${firstStripeServiceId}`);
    await expect(purchaseBtn).toBeVisible({ timeout: 8000 });
    await purchaseBtn.click();

    // Error block must appear — not just red text
    const errorBlock = page.getByTestId(`service-card-${firstStripeServiceId}-error-block`);
    await expect(errorBlock).toBeVisible({ timeout: 8000 });

    // Error block heading must say "Checkout unavailable"
    await expect(errorBlock.getByText("Checkout unavailable")).toBeVisible();

    // "Contact us instead" link must be visible and point to the TymFlo email
    const contactLink = page.getByTestId(`service-card-${firstStripeServiceId}-contact-link`);
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toContainText("Contact us instead");
    const href = await contactLink.getAttribute("href");
    expect(href, "'Contact us instead' link must include a mailto: address").toMatch(/^mailto:/);

    // Purchase button remains clickable (not disabled after error)
    await expect(purchaseBtn).toBeEnabled();

    await ctx.close();
  });

  test("debrief purchase: API failure shows error block with 'Contact us instead' link", async ({
    browser,
  }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);

    // Intercept /api/checkout/debrief and return a 500 error
    await page.route("**/api/checkout/debrief", (route) => {
      void route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      });
    });

    // Scroll to the debrief offer section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const purchaseBtn = page.getByTestId("button-purchase-debrief");
    await expect(purchaseBtn).toBeVisible({ timeout: 8000 });
    await purchaseBtn.click();

    // Error block must appear
    const errorBlock = page.getByTestId("debrief-error-block");
    await expect(errorBlock).toBeVisible({ timeout: 8000 });

    // Error block heading must say "Checkout unavailable"
    await expect(errorBlock.getByText("Checkout unavailable")).toBeVisible();

    // "Contact us instead" link must be visible and point to the TymFlo email
    const contactLink = page.getByTestId("debrief-contact-link");
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toContainText("Contact us instead");
    const href = await contactLink.getAttribute("href");
    expect(href, "'Contact us instead' link must include a mailto: address").toMatch(/^mailto:/);

    // Purchase button remains enabled after error
    await expect(purchaseBtn).toBeEnabled();

    await ctx.close();
  });

  test("service card: 'Try again' dismisses error, shows loading, re-shows error on second failure", async ({
    browser,
  }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);

    // Always fail the service-card checkout endpoint with a 600ms delay so
    // Playwright can observe the loading state before the response arrives.
    await page.route("**/api/checkout", async (route) => {
      const url = route.request().url();
      if (url.includes("/debrief")) return route.continue();
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      });
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const firstStripeServiceId = "executive-growth-strategy";
    const purchaseBtn = page.getByTestId(`button-purchase-${firstStripeServiceId}`);
    await expect(purchaseBtn).toBeVisible({ timeout: 8000 });
    await purchaseBtn.click();

    // Error block must appear first
    const errorBlock = page.getByTestId(`service-card-${firstStripeServiceId}-error-block`);
    await expect(errorBlock).toBeVisible({ timeout: 8000 });

    // Click "Try again"
    const tryAgainBtn = errorBlock.getByRole("button", { name: "Try again" });
    await expect(tryAgainBtn).toBeVisible();
    await tryAgainBtn.click();

    // Error block must disappear immediately
    await expect(errorBlock).toBeHidden({ timeout: 3000 });

    // Purchase button must enter loading state (disabled, text changes)
    await expect(purchaseBtn).toBeDisabled({ timeout: 3000 });
    await expect(purchaseBtn).toContainText("Redirecting to checkout...", { timeout: 3000 });

    // After the retry fails, error block must re-appear
    await expect(errorBlock).toBeVisible({ timeout: 8000 });
    await expect(errorBlock.getByText("Checkout unavailable")).toBeVisible();

    // Purchase button must be enabled again after the retry failure
    await expect(purchaseBtn).toBeEnabled({ timeout: 3000 });

    await ctx.close();
  });

  test("debrief: 'Try again' dismisses error, shows loading, re-shows error on second failure", async ({
    browser,
  }) => {
    const { ctx, page } = await setupAuthenticatedReportPage(browser);

    // Always fail the debrief checkout endpoint with a 600ms delay so
    // Playwright can observe the loading state before the response arrives.
    await page.route("**/api/checkout/debrief", async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      });
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const purchaseBtn = page.getByTestId("button-purchase-debrief");
    await expect(purchaseBtn).toBeVisible({ timeout: 8000 });
    await purchaseBtn.click();

    // Error block must appear first
    const errorBlock = page.getByTestId("debrief-error-block");
    await expect(errorBlock).toBeVisible({ timeout: 8000 });

    // Click "Try again"
    const tryAgainBtn = errorBlock.getByRole("button", { name: "Try again" });
    await expect(tryAgainBtn).toBeVisible();
    await tryAgainBtn.click();

    // Error block must disappear immediately
    await expect(errorBlock).toBeHidden({ timeout: 3000 });

    // Purchase button must enter loading state (disabled, text changes)
    await expect(purchaseBtn).toBeDisabled({ timeout: 3000 });
    await expect(purchaseBtn).toContainText("Redirecting to checkout...", { timeout: 3000 });

    // After the retry fails, error block must re-appear
    await expect(errorBlock).toBeVisible({ timeout: 8000 });
    await expect(errorBlock.getByText("Checkout unavailable")).toBeVisible();

    // Purchase button must be enabled again after the retry failure
    await expect(purchaseBtn).toBeEnabled({ timeout: 3000 });

    await ctx.close();
  });
});

// ---------------------------------------------------------------------------
// Print — roadmap circle visibility without Background Graphics
// ---------------------------------------------------------------------------
//
// Chrome's "Background graphics" print setting maps to CDP printToPDF:
//   page.pdf({ printBackground: false })  ←→  Background graphics OFF
//   page.pdf({ printBackground: true  })  ←→  Background graphics ON
//
// When `print-color-adjust: exact` is set on an element, Chrome's print engine
// is instructed to preserve that element's background regardless of the
// printBackground flag.  These tests verify:
//   A) Every circle carries print-color-adjust:exact in its inline style.
//   B) PNG screenshot pixel-level checks confirm circles are non-white in
//      print media emulation (i.e. Chrome holds the brand colour).
//   C) page.pdf() with printBackground:false AND printBackground:true both
//      produce valid PDFs containing the expected brand-colour data stream.
// ---------------------------------------------------------------------------

/** Brand colours used in roadmap circles */
const BRAND_PURPLE    = { r: 70,  g: 49,  b: 118 }; // #463176
const BRAND_TANGERINE = { r: 246, g: 150, b: 121 }; // #F69679
const COLOUR_TOLERANCE = 20; // ±20 per channel — allows for sub-pixel AA blending

function colourClose(
  actual: { r: number; g: number; b: number },
  expected: { r: number; g: number; b: number },
  tol = COLOUR_TOLERANCE
): boolean {
  return (
    Math.abs(actual.r - expected.r) <= tol &&
    Math.abs(actual.g - expected.g) <= tol &&
    Math.abs(actual.b - expected.b) <= tol
  );
}

test.describe("Report — roadmap print-color-adjust", () => {

  // ── A: Style declarations ────────────────────────────────────────────────
  test(
    "every roadmap circle carries print-color-adjust:exact in its inline style",
    async ({ browser }) => {
      const { ctx, page } = await setupAuthenticatedReportPage(browser);
      await page.emulateMedia({ media: "print" });

      const items = page.locator('[aria-label="Implementation Roadmap steps"] li');
      await expect(items).toHaveCount(6);

      const purpleVariants    = ["#463176", "rgb(70, 49, 118)", "rgb(70,49,118)"];
      const tangerineVariants = ["#F69679", "rgb(246, 150, 121)", "rgb(246,150,121)"];
      const solidBgRe         = /^(#[0-9a-fA-F]{3,6}|rgb\(\d+,\s*\d+,\s*\d+\))$/;

      const circleStyles: Array<{ bg: string; color: string; pca: string; wpca: string }> =
        await items.evaluateAll((liNodes) =>
          liNodes.map((li) => {
            const circle = li.querySelector<HTMLElement>("div:first-child");
            if (!circle) return { bg: "", color: "", pca: "", wpca: "" };
            const s = circle.style;
            return {
              bg:   s.background || s.backgroundColor,
              color: s.color,
              pca:  s.printColorAdjust,
              wpca: (s as CSSStyleDeclaration & { webkitPrintColorAdjust?: string })
                      .webkitPrintColorAdjust ?? "",
            };
          })
        );

      for (let i = 0; i < circleStyles.length; i++) {
        const { bg, color, pca, wpca } = circleStyles[i];
        expect(pca,  `Circle ${i + 1}: printColorAdjust must be "exact"`).toBe("exact");
        expect(wpca, `Circle ${i + 1}: webkitPrintColorAdjust must be "exact"`).toBe("exact");
        expect(color,`Circle ${i + 1}: text must be white`).toMatch(
          /^(white|#fff(fff)?|rgb\(255,\s*255,\s*255\))$/i
        );
        expect(bg, `Circle ${i + 1}: background must be solid hex or rgb`).toMatch(solidBgRe);
      }

      expect(
        purpleVariants.includes(circleStyles[0].bg),
        `Node 1 circle must be brand purple — got: ${circleStyles[0].bg}`
      ).toBe(true);
      expect(
        tangerineVariants.includes(circleStyles[5].bg),
        `Node 6 circle (highlight) must be brand tangerine — got: ${circleStyles[5].bg}`
      ).toBe(true);

      // Highlight li also carries print-color-adjust
      const hLiPca: string = await items.nth(5).evaluate(
        (li) => (li as HTMLElement).style.printColorAdjust
      );
      expect(hLiPca, "Highlight li: printColorAdjust must be 'exact'").toBe("exact");

      await ctx.close();
    }
  );

  // ── B: Background graphics OFF — pdftoppm raster pixel check ─────────────
  //
  //  page.pdf({ printBackground: false }) is the CDP equivalent of Chrome's
  //  "Background graphics: OFF" setting.  With print-color-adjust:exact on
  //  the circle elements, Chrome's print engine MUST write their background
  //  colours into the PDF even in this mode.
  //
  //  We verify this by rasterising the PDF with pdftoppm and scanning every
  //  pixel in every page for the brand purple (rgb 70,49,118).
  // ──────────────────────────────────────────────────────────────────────────
  test(
    "printBackground:false (Background graphics OFF) — brand purple found in rasterised PDF pages",
    async ({ browser }) => {
      const { ctx, page } = await setupAuthenticatedReportPage(browser);
      await page.emulateMedia({ media: "print" });

      // CDP Page.printToPDF with printBackground:false = "Background graphics OFF"
      const pdfBuf: Buffer = await page.pdf({
        printBackground: false,
        format: "Letter",
        margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
      });

      expect(pdfBuf.length, "PDF must be non-empty (>30KB)").toBeGreaterThan(30_000);
      expect(pdfBuf.subarray(0, 5).toString("ascii"), "Valid PDF header").toBe("%PDF-");

      // ── Rasterise PDF pages and scan pixels ────────────────────────────
      // pdftoppm converts PDF pages to PNG images; we then scan all pixels
      // for the brand purple colour.  If print-color-adjust:exact worked,
      // the purple circles will be visible in the rasterised output.
      const pages = pdfToPageImages(pdfBuf, "roadmap-bg-off");
      expect(pages.length, "pdftoppm must produce at least one page image").toBeGreaterThan(0);

      const foundPurple = pages.some((png) =>
        scanPngForColour(png, BRAND_PURPLE.r, BRAND_PURPLE.g, BRAND_PURPLE.b)
      );
      expect(
        foundPurple,
        `Brand purple rgb(${BRAND_PURPLE.r},${BRAND_PURPLE.g},${BRAND_PURPLE.b}) (#463176) ` +
        "must be present in rasterised PDF pages when printBackground:false — " +
        "print-color-adjust:exact must override background-graphics suppression"
      ).toBe(true);

      // ── Label text must also be non-white in print mode ────────────────
      //    (confirms labels, not just circles, remain readable)
      const labelColors: string[] = await page
        .locator('[aria-label="Implementation Roadmap steps"] li p:first-child')
        .evaluateAll((els) =>
          els.map((el) => window.getComputedStyle(el).color)
        );
      for (const lc of labelColors) {
        const isWhite = lc === "rgb(255, 255, 255)" || lc === "white";
        expect(isWhite, `Label text color must not be white — got: ${lc}`).toBe(false);
      }

      await ctx.close();
    }
  );

  // ── C: Background graphics ON — pdftoppm raster pixel check ──────────────
  test(
    "printBackground:true (Background graphics ON) — brand purple found in rasterised PDF pages",
    async ({ browser }) => {
      const { ctx, page } = await setupAuthenticatedReportPage(browser);
      await page.emulateMedia({ media: "print" });

      // CDP Page.printToPDF with printBackground:true = "Background graphics ON"
      const pdfBuf: Buffer = await page.pdf({
        printBackground: true,
        format: "Letter",
        margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
      });

      expect(pdfBuf.length, "PDF must be non-empty (>30KB)").toBeGreaterThan(30_000);
      expect(pdfBuf.subarray(0, 5).toString("ascii"), "Valid PDF header").toBe("%PDF-");

      const pages = pdfToPageImages(pdfBuf, "roadmap-bg-on");
      expect(pages.length, "pdftoppm must produce at least one page image").toBeGreaterThan(0);

      const foundPurple = pages.some((png) =>
        scanPngForColour(png, BRAND_PURPLE.r, BRAND_PURPLE.g, BRAND_PURPLE.b)
      );
      expect(
        foundPurple,
        `Brand purple rgb(${BRAND_PURPLE.r},${BRAND_PURPLE.g},${BRAND_PURPLE.b}) (#463176) ` +
        "must be present in rasterised PDF pages when printBackground:true"
      ).toBe(true);

      await ctx.close();
    }
  );
});
