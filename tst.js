const puppeteer = require("puppeteer");
const fs = require("fs");

/*
  SET THESE
*/
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

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  // Load saved storage (if it exists)
  if (fs.existsSync(STORAGE_STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE_FILE, "utf8"));
    for (const cookie of state.cookies || []) {
      await page.setCookie(cookie);
    }
  }

  await page.goto(SITE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  const value = await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, STORAGE_KEY);

  console.log("LocalStorage value:", value);

  await browser.close();
})();
