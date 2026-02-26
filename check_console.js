import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message} \n ${error.stack}`);
    });

    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('Navigating to http://127.0.0.1:8080/ ...');
    await page.goto('http://127.0.0.1:8080/');

    console.log('Waiting for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
  } catch (error) {
    console.error('Script failed:', error);
  }
})();
