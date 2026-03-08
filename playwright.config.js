// playwright.config.js
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  use: {
    headless: false,
    slowMo: 500, // 500ms delay between actions for slow motion
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
};

module.exports = config;
