const puppeteer = require("puppeteer");
const fs = require("fs");

const SITE_URL = "https://site";
const STORAGE_KEY = "thing";
const STORAGE_STATE_FILE = "./storage_state.json";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  // Restore cookies
  if (fs.existsSync(STORAGE_STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STORAGE_STATE_FILE, "utf8"));
    if (state.cookies) {
      await page.setCookie(...state.cookies);
    }
  }

  await page.goto(SITE_URL, { waitUntil: "networkidle2" });

  // Read localStorage
  const value = await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, STORAGE_KEY);

  console.log("LocalStorage value:", value);

  // Save cookies + localStorage
  const cookies = await page.cookies();
  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      data[k] = localStorage.getItem(k);
    }
    return data;
  });

  fs.writeFileSync(
    STORAGE_STATE_FILE,
    JSON.stringify({ cookies, localStorage: localStorageData }, null, 2)
  );

  await browser.close();
})();
