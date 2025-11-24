import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: '/tmp/portal-screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/portal-screenshot.png');
  
  // Keep browser open for 30 seconds
  await new Promise(r => setTimeout(r, 30000));
  
  await browser.close();
})();
