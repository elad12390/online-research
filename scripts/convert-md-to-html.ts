#!/usr/bin/env ts-node
/**
 * Convert Markdown files to HTML
 * Runs automatically to convert any .md files to .html
 */

import * as fs from 'fs'
import * as path from 'path'
import { marked } from 'marked'

const RESEARCH_DIR = process.env.RESEARCH_DIR || './research-projects'

function convertMarkdownToHTML(mdContent: string, title: string): string {
  const htmlBody = marked(mdContent)
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(title)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1 { color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3rem; }
        h2 { color: #2a2a2a; margin-top: 2rem; }
        h3 { color: #3a3a3a; margin-top: 1.5rem; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #0066cc; margin: 1rem 0; padding-left: 1rem; color: #666; }
        ul, ol { margin: 1rem 0; padding-left: 2rem; }
        li { margin: 0.5rem 0; }
    </style>
</head>
<body>
${htmlBody}
</body>
</html>`
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function processDirectory(dir: string) {
  const items = fs.readdirSync(dir)
  let converted = 0
  
  for (const item of items) {
    const itemPath = path.join(dir, item)
    const stat = fs.statSync(itemPath)
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (item === 'node_modules' || item === '.git' || item === 'code') {
        continue
      }
      // Recurse into subdirectories
      converted += processDirectory(itemPath)
    } else if (item.endsWith('.md') && item !== 'README.md') {
      // Convert markdown file to HTML
      const mdContent = fs.readFileSync(itemPath, 'utf-8')
      const title = item.replace('.md', '')
      const htmlContent = convertMarkdownToHTML(mdContent, title)
      
      // Write HTML file
      const htmlPath = itemPath.replace('.md', '.html')
      fs.writeFileSync(htmlPath, htmlContent)
      
      // Delete the markdown file
      fs.unlinkSync(itemPath)
      
      console.log(`✅ Converted: ${item} → ${path.basename(htmlPath)}`)
      converted++
    }
  }
  
  return converted
}

// Main execution
console.log('🔄 Converting markdown files to HTML...')
console.log(`📁 Directory: ${RESEARCH_DIR}\n`)

const total = processDirectory(RESEARCH_DIR)

console.log(`\n✨ Done! Converted ${total} file(s)`)
