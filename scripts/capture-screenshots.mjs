#!/usr/bin/env node

/**
 * Capture screenshots of the Research Portal using Puppeteer
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'website', 'public', 'assets');
const PORTAL_URL = process.env.PORTAL_URL || 'http://localhost:3000';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshot(page, name, width = 1280, height = 800) {
  console.log(`\nCapturing screenshot: ${name} (${width}x${height})`);
  
  try {
    const filePath = path.join(OUTPUT_DIR, `screenshot-${name}.png`);
    
    // Set viewport
    await page.setViewport({ width, height });
    
    // Capture screenshot
    await page.screenshot({
      path: filePath,
      omitBackground: false,
    });

    console.log(`✓ Saved to: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Error capturing ${name}:`, error.message);
    throw error;
  }
}

async function captureAllScreenshots() {
  console.log('='.repeat(60));
  console.log('Research Portal Screenshot Capture');
  console.log('='.repeat(60));
  console.log(`Portal URL: ${PORTAL_URL}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
    });

    const page = await browser.newPage();

    // Capture main portal page
    console.log(`\nNavigating to ${PORTAL_URL}...`);
    try {
      await page.goto(PORTAL_URL, { 
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
      await captureScreenshot(page, 'main', 1280, 800);
    } catch (err) {
      console.warn(`Main page not available: ${err.message}`);
    }

    // Capture wizard page
    try {
      console.log(`\nNavigating to ${PORTAL_URL}/wizard...`);
      await page.goto(`${PORTAL_URL}/wizard`, { 
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
      await captureScreenshot(page, 'wizard', 1280, 800);
    } catch (err) {
      console.warn(`Wizard page not available: ${err.message}`);
    }

    // Capture auth page
    try {
      console.log(`\nNavigating to ${PORTAL_URL}/auth...`);
      await page.goto(`${PORTAL_URL}/auth`, { 
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
      await captureScreenshot(page, 'auth', 1280, 800);
    } catch (err) {
      console.warn(`Auth page not available: ${err.message}`);
    }

    // Capture wide desktop view
    console.log('\n--- Capturing wide desktop view ---');
    try {
      await page.goto(PORTAL_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
      await captureScreenshot(page, 'desktop-wide', 1920, 1080);
    } catch (err) {
      console.warn(`Wide desktop view not available: ${err.message}`);
    }

    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log('✓ Screenshot capture complete!');
    console.log('Files saved to:', OUTPUT_DIR);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Failed to capture screenshots:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Main
captureAllScreenshots().catch(console.error);
