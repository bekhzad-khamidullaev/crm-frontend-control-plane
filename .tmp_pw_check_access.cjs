const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4174' });
  await page.goto('/#/login');
  await page.fill('#login_username', 'admin');
  await page.fill('#login_password', 't3sl@admin');
  await Promise.all([
    page.waitForTimeout(1500),
    page.click('button:has-text("Войти")'),
  ]);
  await page.goto('/#/dashboard');
  await page.waitForTimeout(1000);
  console.log('dashboard', page.url());
  await page.goto('/#/leads');
  await page.waitForTimeout(1000);
  console.log('leads', page.url());
  await page.screenshot({ path: '/tmp/control-plane-leads-after-login.png', fullPage: true });
  await browser.close();
})();
