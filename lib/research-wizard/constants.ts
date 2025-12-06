/**
 * Research Wizard Constants
 * Shared configuration for depth, style, and other settings
 * 
 * This file follows the DRY principle - these values were previously
 * duplicated across research-manager.ts, claude-cli-executor.ts, and research-agent.py
 */

// Research depth configuration
export const DEPTH_INSTRUCTIONS = {
  quick: 'Provide a concise 15-20 minute research summary',
  standard: 'Provide a comprehensive 45-60 minute research',
  deep: 'Provide an exhaustive in-depth research with multiple perspectives',
} as const

// Research style configuration
export const STYLE_INSTRUCTIONS = {
  comprehensive: 'Create detailed, well-structured documentation with multiple sections',
  comparing: 'Focus on comparisons and contrasts between options',
  practical: 'Focus on practical, actionable insights and implementation',
} as const

// Type exports for type safety
export type ResearchDepth = keyof typeof DEPTH_INSTRUCTIONS
export type ResearchStyle = keyof typeof STYLE_INSTRUCTIONS

// Default model configuration per provider
export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
  google: 'gemini-pro',
} as const

export type LLMProvider = keyof typeof DEFAULT_MODELS

// Progress file limits
export const PROGRESS_LIMITS = {
  RESULT_MAX_LENGTH: 500,
  READ_FILE_MAX_LENGTH: 2000,
  ACTIVITY_MAX_COUNT: 1000,
  MAX_CONSECUTIVE_ERRORS: 5,
  COMPLETION_THRESHOLD: 90,  // Percentage at which to check for missing files
  BLOCKED_PERCENTAGE: 85,    // Cap percentage when blocked by missing files
} as const

// CLI execution defaults
export const CLI_DEFAULTS = {
  DEFAULT_MODEL: 'sonnet',   // Default model for CLI execution
  POLL_INTERVAL_MS: 1000,    // Activity polling interval
  RECENT_ACTIVITIES_LIMIT: 50, // Default limit for recent activities query
} as const

// HTML template base styles (shared across document generation)
export const HTML_BASE_STYLES = `
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
code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
blockquote { border-left: 4px solid #0066cc; margin: 1rem 0; padding-left: 1rem; color: #666; }
ul, ol { margin: 1rem 0; padding-left: 2rem; }
`.trim()

// Status icons for UI display
export const STATUS_ICONS = {
  completed: '✅',
  failed: '❌',
  running: '⏳',
  pending: '⏸️',
  waiting: '💤',
  error: '🔴',
  success: '✅',
} as const

export type StatusType = keyof typeof STATUS_ICONS
