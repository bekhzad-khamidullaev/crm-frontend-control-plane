const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: 'http://127.0.0.1:4173' });
  await page.goto('/#/login');
  await page.waitForTimeout(1000);
  const inputs = await page.$$eval('input', (els) =>
    els.map((e) => ({ name: e.name, id: e.id, type: e.type, placeholder: e.placeholder }))
  );
  const buttons = await page.$$eval('button', (els) =>
    els.map((e) => (e.textContent || '').trim()).filter(Boolean)
  );
  console.log('inputs', JSON.stringify(inputs));
  console.log('buttons', JSON.stringify(buttons));
  await browser.close();
})();
