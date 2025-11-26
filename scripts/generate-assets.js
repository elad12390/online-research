#!/usr/bin/env node

/**
 * Generate logo, icons, and capture screenshots for the Research Portal
 * Uses Flux API (BFL) for image generation and Puppeteer for screenshots
 */

import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FLUX_API_KEY = process.env.FLUX_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'website', 'public', 'assets');
const API_BASE = 'https://api.bfl.ai';
const MODEL = 'flux-2-pro';

if (!FLUX_API_KEY) {
  console.error('Error: FLUX_API_KEY environment variable not set');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateImage(prompt, width = 1024, height = 1024, filename) {
  console.log(`\nGenerating: ${filename}`);
  console.log(`Prompt: ${prompt}`);
  
  try {
    // Request image generation using FLUX.2 [pro]
    const requestResponse = await fetch(`${API_BASE}/v1/${MODEL}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': FLUX_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
        safety_tolerance: 2,
        output_format: 'png',
      }),
    });

    if (!requestResponse.ok) {
      const error = await requestResponse.text();
      throw new Error(`API request failed: ${requestResponse.status} - ${error}`);
    }

    const data = await requestResponse.json();
    console.log(`Task ID: ${data.id}`);
    console.log(`Cost: ${data.cost} credits`);

    // Poll for completion
    let result;
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      const checkResponse = await fetch(data.polling_url, {
        headers: { 
          'accept': 'application/json',
          'x-key': FLUX_API_KEY,
        },
      });

      if (!checkResponse.ok) {
        throw new Error(`Status check failed: ${checkResponse.status}`);
      }

      result = await checkResponse.json();

      if (result.status === 'Ready') {
        console.log(`Generated successfully!`);
        break;
      }

      if (result.status === 'Error') {
        throw new Error(`Generation failed: ${result.error}`);
      }

      console.log(`Status: ${result.status} (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }

    if (!result || result.status !== 'Ready') {
      throw new Error('Generation timeout');
    }

    // Download image
    let imageUrl = result.result?.url;
    
    // Handle different response formats
    if (!imageUrl && result.result) {
      if (typeof result.result === 'string') {
        imageUrl = result.result;
      } else if (result.result.sample) {
        imageUrl = result.result.sample;
      }
    }

    if (!imageUrl) {
      console.log('Full result object:', JSON.stringify(result, null, 2));
      throw new Error('No image URL found in response');
    }

    const filePath = path.join(OUTPUT_DIR, filename);

    console.log(`Downloading from: ${imageUrl}`);
    
    await downloadFile(imageUrl, filePath);
    console.log(`Saved to: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error(`Error generating ${filename}:`, error.message);
    throw error;
  }
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if error
        reject(err);
      });
  });
}

async function generateAllAssets() {
  console.log('='.repeat(60));
  console.log('Research Portal Asset Generation - FLUX.2 [pro]');
  console.log('='.repeat(60));

  try {
    // Generate logo - clean dark theme with cyan accent
    await generateImage(
      'Minimalist AI research logo, geometric compass rose design with circuit board pattern, sophisticated teal/cyan accent color #0ea5e9, dark background, clean tech aesthetic, professional and elegant, square format',
      1024,
      1024,
      'logo.png'
    );

    // Generate icon - minimal and crisp
    await generateImage(
      'Simple AI research icon, magnifying glass with subtle circuit nodes, teal accent #0ea5e9, clean minimalist design, perfect for favicon, dark background, sharp and professional',
      512,
      512,
      'icon.png'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✓ Logo and icon generation complete!');
    console.log('Files saved to:', OUTPUT_DIR);
    console.log('='.repeat(60));
    console.log('\nNote: Screenshots will be captured separately using Puppeteer');

  } catch (error) {
    console.error('Failed to generate assets:', error);
    process.exit(1);
  }
}

// Main
generateAllAssets().catch(console.error);
