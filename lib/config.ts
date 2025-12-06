/**
 * Centralized Configuration Module
 * 
 * All environment variables and configuration should be accessed through this module.
 * This follows the KISS principle by providing a single source of truth for configuration.
 * 
 * Benefits:
 * - Single place to see all configuration
 * - Type safety for configuration values
 * - Default values defined in one place
 * - Easy to test (can mock this module)
 */

// Directory configuration
export const config = {
  /** Base directory for research projects */
  researchDir: process.env.RESEARCH_DIR || './research-projects',
  
  /** OpenCode URL for API communication */
  opencodeUrl: process.env.OPENCODE_URL || 'http://localhost:4096',
  
  /** Database path (defaults to inside research dir) */
  dbPath: process.env.DB_PATH,
  
  /** SearXNG base URL for web search */
  searxngBaseUrl: process.env.SEARXNG_BASE_URL || 'http://localhost:8847/search',
  
  /** Debug mode */
  debug: process.env.DEBUG === 'true',
} as const

// API Keys configuration
export const apiKeys = {
  /** Anthropic API key for Claude */
  get anthropic(): string | undefined {
    return process.env.ANTHROPIC_API_KEY
  },
  
  /** OpenAI API key */
  get openai(): string | undefined {
    return process.env.OPENAI_API_KEY
  },
  
  /** Google API key */
  get google(): string | undefined {
    return process.env.GOOGLE_API_KEY
  },
  
  /** Check if Anthropic key is configured */
  get hasAnthropic(): boolean {
    return !!process.env.ANTHROPIC_API_KEY
  },
  
  /** Check if OpenAI key is configured */
  get hasOpenai(): boolean {
    return !!process.env.OPENAI_API_KEY
  },
  
  /** Check if Google key is configured */
  get hasGoogle(): boolean {
    return !!process.env.GOOGLE_API_KEY
  },
  
  /** Check if any API key is configured */
  get hasAny(): boolean {
    return this.hasAnthropic || this.hasOpenai || this.hasGoogle
  },
} as const

// Provider validation
export function validateProviderKey(provider: 'anthropic' | 'openai' | 'google'): void {
  const keyMap = {
    anthropic: { key: apiKeys.anthropic, name: 'ANTHROPIC_API_KEY' },
    openai: { key: apiKeys.openai, name: 'OPENAI_API_KEY' },
    google: { key: apiKeys.google, name: 'GOOGLE_API_KEY' },
  }
  
  const { key, name } = keyMap[provider]
  if (!key) {
    throw new Error(`${name} environment variable is not set. Please authenticate at /auth`)
  }
}

// Environment variables for spawned processes
export function getProcessEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ANTHROPIC_API_KEY: apiKeys.anthropic,
    OPENAI_API_KEY: apiKeys.openai,
    GOOGLE_API_KEY: apiKeys.google,
    SEARXNG_BASE_URL: config.searxngBaseUrl,
  }
}

/**
 * Set an API key at runtime (used by auth flow)
 */
export function setAnthropicKey(key: string): void {
  process.env.ANTHROPIC_API_KEY = key
}

/**
 * Get the current Anthropic key
 */
export function getAnthropicKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY
}
