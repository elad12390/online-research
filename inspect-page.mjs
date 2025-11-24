import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Check for panel-related elements
  const panelCheck = await page.evaluate(() => {
    const hasReact = !!document.querySelector('[data-panel-group-id]');
    const allDataAttrs = Array.from(document.querySelectorAll('[data-panel]'))
      .map(el => ({
        tag: el.tagName,
        style: el.getAttribute('style'),
        width: el.offsetWidth
      }));
    
    return { hasReact, panels: allDataAttrs };
  });
  
  console.log('Panel check:', JSON.stringify(panelCheck, null, 2));
  
  await browser.close();
})();
