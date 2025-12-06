/**
 * Dark Theme Styles for Document View
 * 
 * These styles are injected into HTML files displayed in the document iframe
 * to ensure they match the portal's dark theme.
 * 
 * Extracted from DocumentView.tsx to follow SRP and make styles maintainable.
 */

export const DOCUMENT_DARK_THEME_CSS = `
  /* Override body styles to match dark theme */
  * {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Lucida Grande', sans-serif !important;
  }
  
  body {
    background: #191919 !important;
    color: #ececec !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 2rem !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Lucida Grande', sans-serif !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
  }
  
  /* Update text colors */
  h1, h2, h3, h4, h5, h6 {
    color: #ececec !important;
    font-weight: 600 !important;
  }
  
  h1 {
    font-size: 1.95em !important;
    margin: 1em 0 0.5em 0 !important;
    border-bottom: 1px solid #3d3d3d !important;
    padding-bottom: 0.3em !important;
  }
  
  h2 {
    font-size: 1.6em !important;
    margin: 1em 0 0.5em 0 !important;
  }
  
  h3 {
    font-size: 1.35em !important;
    margin: 0.8em 0 0.4em 0 !important;
  }
  
  p, li, td, th {
    color: #ececec !important;
    line-height: 1.8 !important;
  }
  
  p {
    margin: 0.8em 0 !important;
  }
  
  /* Update link colors */
  a {
    color: #0ea5e9 !important;
  }
  
  a:hover {
    color: #0b7285 !important;
  }
  
  /* Update table styling */
  table {
    background: #2d2d2d !important;
    border-color: #3d3d3d !important;
  }
  
  th {
    background: #3d3d3d !important;
    color: #ececec !important;
    border-color: #3d3d3d !important;
  }
  
  td {
    border-color: #3d3d3d !important;
    background: transparent !important;
  }
  
  tr:hover td {
    background: #373737 !important;
  }
  
  tr:nth-child(even) td {
    background: rgba(255, 255, 255, 0.02) !important;
  }
  
  tr:nth-child(even):hover td {
    background: #373737 !important;
  }
  
  /* Update code blocks */
  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
    background: #2d2d2d !important;
    color: #ececec !important;
    padding: 0.2em 0.4em !important;
    border-radius: 3px !important;
    font-size: 0.9em !important;
  }
  
  pre {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
    background: #2d2d2d !important;
    border-color: #3d3d3d !important;
    border: 1px solid #3d3d3d !important;
    border-radius: 6px !important;
    padding: 1em !important;
    overflow-x: auto !important;
  }
  
  pre code {
    background: transparent !important;
    padding: 0 !important;
  }
  
  /* Update highlights */
  .highlight, mark {
    background: rgba(14, 165, 233, 0.2) !important;
    color: #ececec !important;
  }
`.trim()

/**
 * Script to intercept link clicks in the iframe and send to parent
 */
export const LINK_INTERCEPT_SCRIPT = `
  <script>
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (target && target.tagName === 'A' && target.href) {
        e.preventDefault();
        window.parent.postMessage({
          type: 'internal-link-click',
          href: target.getAttribute('href')
        }, '*');
      }
    });
  </script>
`

/**
 * Injects dark theme styles into HTML content
 */
export function injectDarkTheme(htmlContent: string): string {
  const darkThemeStyle = `<style>${DOCUMENT_DARK_THEME_CSS}</style>`
  let result = htmlContent
  
  // Inject style after <head> tag or at the beginning if no head
  if (result.includes('<head>')) {
    result = result.replace('<head>', '<head>' + darkThemeStyle)
  } else if (result.includes('<!DOCTYPE')) {
    result = result.replace('<!DOCTYPE html>', '<!DOCTYPE html>' + darkThemeStyle)
  } else {
    result = darkThemeStyle + result
  }
  
  // Inject link intercept script before </body> or at the end
  if (result.includes('</body>')) {
    result = result.replace('</body>', LINK_INTERCEPT_SCRIPT + '</body>')
  } else {
    result = result + LINK_INTERCEPT_SCRIPT
  }
  
  return result
}
