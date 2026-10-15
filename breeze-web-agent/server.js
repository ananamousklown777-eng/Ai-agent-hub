import express from "express";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import dns from "node:dns/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const windows = new Map();
const dnsCache = new Map();
const WINDOW_MS = Math.max(60_000, Number(process.env.BWA_RATE_WINDOW_MS) || 10 * 60 * 1000);
// Keep a reasonable abuse guard while allowing more development testing.
const MAX_RUNS_PER_WINDOW = Math.max(1, Math.min(30, Number(process.env.BWA_MAX_RUNS_PER_WINDOW) || 12));

function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || a >= 224;
}

function isPrivateIPv6(ip) {
  const value = ip.toLowerCase();
  return value === "::" || value === "::1" || value.startsWith("fc") ||
    value.startsWith("fd") || value.startsWith("fe80:") ||
    value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") ||
    value.startsWith("::ffff:192.168.");
}

async function assertPublicUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid full URL, such as https://example.com"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS websites are supported.");
  if (url.username || url.password) throw new Error("URLs containing usernames or passwords are not allowed.");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Private and local network addresses are blocked.");
  }
  if (net.isIP(hostname)) {
    const privateIp = net.isIPv4(hostname) ? isPrivateIPv4(hostname) : isPrivateIPv6(hostname);
    if (privateIp) throw new Error("Private and local network addresses are blocked.");
    return url;
  }
  let addresses = dnsCache.get(hostname);
  if (!addresses) {
    try {
      addresses = await dns.lookup(hostname, { all: true, verbatim: true });
      dnsCache.set(hostname, addresses);
      // Keep DNS results briefly to avoid repeating lookups for every page asset.
      setTimeout(() => dnsCache.delete(hostname), 60_000).unref?.();
    } catch { throw new Error("The website hostname could not be resolved."); }
  }
  if (!addresses.length || addresses.some(item => net.isIPv4(item.address) ? isPrivateIPv4(item.address) : isPrivateIPv6(item.address))) {
    throw new Error("This website resolves to a private or unsupported network address and was blocked.");
  }
  return url;
}

function allowRate(ip) {
  const now = Date.now();
  const entry = windows.get(ip);
  if (!entry || now - entry.start >= WINDOW_MS) {
    windows.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= MAX_RUNS_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

app.get("/health", (_req, res) => res.json({
  ok: true,
  service: "big-shark",
  version: "0.1.0",
  feature: "public webpage inspection",
  productionReady: false
}));


/**
 * Free, read-only multi-page workflow endpoint.
 * Accepts up to 3 public URLs and returns structured research results.
 * Deliberately does not click, submit forms, log in, or run user-supplied code.
 */
app.post("/api/workflow", async (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  if (!allowRate(ip)) return res.status(429).json({ ok: false, error: "Rate limit reached. Try again in 10 minutes." });

  const urls = req.body?.urls;
  if (!Array.isArray(urls) || urls.length < 1 || urls.length > 3 ||
      urls.some(url => typeof url !== "string" || url.length > 2048)) {
    return res.status(400).json({ ok: false, error: "Provide an array of 1 to 3 public website URLs, each up to 2048 characters." });
  }

  const validated = [];
  try {
    for (const raw of urls) validated.push(await assertPublicUrl(raw));
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }

  let browser;
  try {
    browser = await playwright.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath()
    });
    const context = await browser.newContext({
      viewport: { width: 800, height: 600 },
      serviceWorkers: "block",
      acceptDownloads: false
    });
    const results = [];
    for (const target of validated) {
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(15000);
      page.setDefaultTimeout(4000);
      await page.route("**/*", async route => {
        try {
          const requestUrl = route.request().url();
          if (requestUrl.startsWith("data:") || requestUrl.startsWith("blob:") || requestUrl === "about:blank") return route.continue();
          await assertPublicUrl(requestUrl);
          return route.continue();
        } catch {
          return route.abort("blockedbyclient");
        }
      });
      try {
        await page.goto(target.href, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(300);
        const data = await page.evaluate(() => ({
          title: document.title || "",
          description: document.querySelector('meta[name="description"]')?.content || "",
          text: (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 12000),
          links: Array.from(document.querySelectorAll("a[href]"))
            .map(a => ({ text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 120), url: a.href }))
            .filter(a => a.text && /^https?:/.test(a.url))
            .slice(0, 25)
        }));
        results.push({ ok: true, requestedUrl: target.href, finalUrl: page.url(), ...data });
      } catch (error) {
        results.push({ ok: false, requestedUrl: target.href, error: "This page could not be read; it may block automated browsers or time out." });
        console.warn("Big Shark workflow page failed:", target.href, String(error?.message || error).slice(0, 200));
      } finally {
        await page.close().catch(() => {});
      }
    }
    await context.close();
    return res.json({
      ok: true,
      service: "big-shark",
      workflow: "public-page-research",
      completedAt: new Date().toISOString(),
      pageCount: results.length,
      results
    });
  } catch (error) {
    console.error("Big Shark workflow failed:", error?.stack || error);
    return res.status(502).json({ ok: false, error: "The browser workflow could not start. Try again later." });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

app.post("/api/inspect", async (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  if (!allowRate(ip)) return res.status(429).json({ ok: false, error: "Rate limit reached. Try again in 10 minutes." });

  let target;
  try {
    if (typeof req.body?.url !== "string" || req.body.url.length > 2048) {
      return res.status(400).json({ ok: false, error: "Provide a website URL up to 2048 characters." });
    }
    target = await assertPublicUrl(req.body.url);
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }

  let browser;
  let inspectionStage = "starting browser";
  try {
    browser = await playwright.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath()
    });
    inspectionStage = "creating browser context";
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      serviceWorkers: "block",
      acceptDownloads: false
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(20000);
    page.setDefaultTimeout(5000);

    inspectionStage = "validating page requests";
    // Re-check every navigation and subresource request to reduce private-network access risk.
    await page.route("**/*", async route => {
      try {
        const requestUrl = route.request().url();
        if (requestUrl.startsWith("data:") || requestUrl.startsWith("blob:") || requestUrl === "about:blank") return route.continue();
        await assertPublicUrl(requestUrl);
        return route.continue();
      } catch {
        return route.abort("blockedbyclient");
      }
    });

    inspectionStage = "loading website";
    await page.goto(target.href, { waitUntil: "domcontentloaded", timeout: 20000 });
    inspectionStage = "extracting page content";
    await page.waitForTimeout(700);
    const result = await page.evaluate(() => {
      const title = document.title || "";
      const description = document.querySelector('meta[name="description"]')?.content || "";
      const text = (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 20000);
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map(a => ({ text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 160), url: a.href }))
        .filter(a => a.text && /^https?:/.test(a.url))
        .slice(0, 40);
      return { title, description, text, links };
    });
    inspectionStage = "finishing inspection";
    // Screenshot capture repeatedly stalls on some pages and can exceed the hosting
    // platform's request window. Return collected text and links promptly instead of
    // risking a dropped request. Screenshot support can be reintroduced as a separate,
    // independently timed operation after it is reliable.
    const screenshotDataUrl = null;
    const screenshotError = "Screenshot capture is temporarily paused while browser performance is stabilized. Page text and links were collected.";
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    browser = null;
    res.json({
      ok: true,
      requestedUrl: target.href,
      finalUrl: page.url(),
      inspectedAt: new Date().toISOString(),
      ...result,
      screenshotDataUrl,
      screenshotError
    });
  } catch (error) {
    console.error(`Big Shark inspection failed during ${inspectionStage}:`, error?.stack || error);
    res.status(502).json({
      ok: false,
      error: "The page could not be inspected. It may block automated browsers or take too long to load.",
      stage: inspectionStage,
      detail: process.env.NODE_ENV === "production" ? undefined : String(error.message || error).slice(0, 300)
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Big Shark listening on port ${PORT}`);
});
