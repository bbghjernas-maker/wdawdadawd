const puppeteer = require("puppeteer");
const fs = require("fs");

const SITE_URL = "https://discord.com";
const STORAGE_KEY = "token";
const STORAGE_STATE_FILE = "./storage_state.json";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu"
    ]
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  // Restore cookies if present
  if (fs.existsSync(STORAGE_STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE_FILE, "utf8"));
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
      await page.setCookie(...state.cookies);
    }
  }

  // Navigate (do NOT use networkidle2 on Discord)
  await page.goto(SITE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // Safely attempt to read localStorage
  const result = await page.evaluate((key) => {
    try {
      if (typeof window === "undefined") {
        return { available: false, value: null };
      }

      if (!("localStorage" in window)) {
        return { available: false, value: null };
      }

      return {
        available: true,
        value: window.localStorage.getItem(key)
      };
    } catch (e) {
      return { available: false, value: null };
    }
  }, STORAGE_KEY);

  if (!result.available) {
    console.log("localStorage is NOT available on this page.");
  } else {
    console.log("LocalStorage value:", result.value);
  }

  // Save cookies only (localStorage may not exist)
  const cookies = await page.cookies();

  fs.writeFileSync(
    STORAGE_STATE_FILE,
    JSON.stringify({ cookies }, null, 2)
  );

  await browser.close();
})();
s
