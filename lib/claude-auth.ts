/**
 * Claude Authentication Helper
 * Handles OAuth token setup via Claude CLI using node-pty for pseudo-terminal
 */

import * as pty from 'node-pty'
import * as fs from 'fs'
import * as path from 'path'

export interface ClaudeAuthResult {
  success: boolean
  token?: string
  error?: string
}

/**
 * Launch Claude OAuth login flow using pseudo-terminal
 * Opens browser for user to approve, then extracts token automatically
 * 
 * Uses node-pty to create a real pseudo-terminal which allows Claude CLI's
 * Ink-based UI to work properly.
 */
export async function loginWithClaude(): Promise<ClaudeAuthResult> {
  return new Promise((resolve) => {
    try {
      console.log('[Claude Auth] Spawning claude setup-token with PTY...')
      
      // Spawn with pseudo-terminal (required for Ink UI)
      const ptyProcess = pty.spawn('claude', ['setup-token'], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME || process.cwd(),
        env: process.env as { [key: string]: string },
      })

      let output = ''

      // Collect output
      ptyProcess.onData((data) => {
        output += data
        console.log('[Claude Auth]', data)
      })

      // Handle exit
      ptyProcess.onExit(({ exitCode }) => {
        console.log('[Claude Auth] Process exited with code:', exitCode)
        
        if (exitCode === 0) {
          // Extract OAuth token from output
          // Token format: sk-ant-oat01-...
          const tokenMatch = output.match(/sk-ant-oat01-[a-zA-Z0-9_-]+/)
          
          if (tokenMatch) {
            console.log('[Claude Auth] ✅ Token extracted successfully')
            resolve({
              success: true,
              token: tokenMatch[0],
            })
          } else {
            resolve({
              success: false,
              error: 'Token not found in output. Please check the browser and try again.',
            })
          }
        } else {
          resolve({
            success: false,
            error: `Claude CLI exited with code ${exitCode}. Please try again.`,
          })
        }
      })

      // Timeout after 5 minutes
      setTimeout(() => {
        console.log('[Claude Auth] ⏱️ Timeout, killing process')
        ptyProcess.kill()
        resolve({
          success: false,
          error: 'Authentication timeout. Please try again and approve faster in the browser.',
        })
      }, 5 * 60 * 1000)
    } catch (error) {
      console.error('[Claude Auth] Error:', error)
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during authentication',
      })
    }
  })
}

/**
 * Get OAuth setup instructions
 */
export function getOAuthInstructions(): string {
  return `To get an OAuth token:

1. Open your terminal
2. Run: claude setup-token
3. Browser will open for Claude login
4. Click "Approve" in the browser
5. Copy the token from terminal (sk-ant-oat01-...)
6. Paste it in the form above

The token is valid for 1 year.`
}

/**
 * Check if Claude CLI is installed
 */
export async function checkClaudeCLI(): Promise<boolean> {
  return new Promise((resolve) => {
    const { spawn } = require('child_process')
    const process = spawn('which', ['claude'])
    
    process.on('close', (code: number) => {
      resolve(code === 0)
    })
    
    process.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Verify a token is valid by checking format
 */
export function isValidClaudeToken(token: string): boolean {
  // OAuth tokens: sk-ant-oat01-...
  // API keys: sk-ant-api03-...
  return /^sk-ant-(oat01|api03)-[a-zA-Z0-9_-]{95,}$/.test(token)
}

/**
 * Save token to .env.local file for persistence
 */
export function saveTokenToEnvFile(token: string): { success: boolean; error?: string } {
  try {
    const projectRoot = process.cwd()
    const envLocalPath = path.join(projectRoot, '.env.local')
    
    // Read existing .env.local if it exists
    let envContent = ''
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf-8')
    }
    
    // Check if ANTHROPIC_API_KEY already exists
    const keyRegex = /^ANTHROPIC_API_KEY=.*$/m
    
    if (keyRegex.test(envContent)) {
      // Replace existing key
      envContent = envContent.replace(keyRegex, `ANTHROPIC_API_KEY=${token}`)
    } else {
      // Add new key
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n'
      }
      envContent += `ANTHROPIC_API_KEY=${token}\n`
    }
    
    // Write back to file
    fs.writeFileSync(envLocalPath, envContent, 'utf-8')
    
    console.log('[Claude Auth] ✅ Token saved to .env.local')
    return { success: true }
  } catch (error) {
    console.error('[Claude Auth] Error saving token to .env.local:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save token to file',
    }
  }
}

/**
 * Save token to environment (for current process)
 * Note: This only sets for the current Node.js process
 * For persistence, save to .env file or system config
 */
export function setTokenInEnvironment(token: string) {
  process.env.ANTHROPIC_API_KEY = token
  
  // Also save to .env.local for persistence
  saveTokenToEnvFile(token)
}

/**
 * Get current token from environment
 */
export function getCurrentToken(): string | undefined {
  return process.env.ANTHROPIC_API_KEY
}
