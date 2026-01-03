const puppeteer = require("puppeteer");
const fs = require("fs");

const SITE_URL = "https://discord.com"; // must be exact origin
const STORAGE_KEY = "token";            // will be null on Discord
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

  // Modern Puppeteer (v20+)
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  /* ============================
     Restore cookies (if present)
     ============================ */
  if (fs.existsSync(STORAGE_STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE_FILE, "utf8"));
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
      await page.setCookie(...state.cookies);
    }
  }

  /* ============================
     Navigate safely
     ============================ */
  await page.goto(SITE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  /* ============================
     Ensure localStorage exists
     ============================ */
  await page.waitForFunction(() => {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  }, { timeout: 30000 });

  /* ============================
     Read localStorage key
     ============================ */
  const value = await page.evaluate((key) => {
    return window.localStorage.getItem(key);
  }, STORAGE_KEY);

  console.log("LocalStorage value:", value);

  /* ============================
     Save cookies + localStorage
     ============================ */
  const cookies = await page.cookies();

  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      data[k] = window.localStorage.getItem(k);
    }
    return data;
  });

  fs.writeFileSync(
    STORAGE_STATE_FILE,
    JSON.stringify(
      { cookies, localStorage: localStorageData },
      null,
      2
    )
  );

  await browser.close();
})();
s
