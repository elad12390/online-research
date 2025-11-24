import { NextRequest, NextResponse } from 'next/server'
import { loginWithClaude, checkClaudeCLI, isValidClaudeToken, setTokenInEnvironment } from '@/lib/claude-auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/claude
 * Check authentication status
 */
export async function GET() {
  try {
    const currentToken = process.env.ANTHROPIC_API_KEY
    const hasToken = !!currentToken
    const tokenValid = currentToken ? isValidClaudeToken(currentToken) : false
    const cliInstalled = await checkClaudeCLI()

    return NextResponse.json({
      authenticated: hasToken && tokenValid,
      hasToken,
      tokenValid,
      cliInstalled,
      tokenType: currentToken?.startsWith('sk-ant-oat01-') ? 'oauth' : 
                 currentToken?.startsWith('sk-ant-api03-') ? 'api_key' : 'unknown',
    })
  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/claude
 * Start OAuth login flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'login') {
      // Check if CLI is installed
      const cliInstalled = await checkClaudeCLI()
      
      if (!cliInstalled) {
        return NextResponse.json({
          success: false,
          error: 'Claude CLI is not installed. Please install it first: npm install -g @anthropic-ai/claude-code',
          installRequired: true,
        }, { status: 400 })
      }

      // Start OAuth login flow
      const result = await loginWithClaude()

      if (result.success && result.token) {
        // Set token in environment for this process
        setTokenInEnvironment(result.token)

        return NextResponse.json({
          success: true,
          message: 'Successfully authenticated with Claude! Token saved to .env.local. Please restart the server (npm run dev) for changes to take effect.',
          tokenType: result.token.startsWith('sk-ant-oat01-') ? 'oauth' : 'api_key',
          requiresRestart: true,
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Authentication failed',
        }, { status: 400 })
      }
    } else if (action === 'set_token') {
      // Manually set a token
      const { token } = body

      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'Token is required',
        }, { status: 400 })
      }

      if (!isValidClaudeToken(token)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid token format. Token should start with sk-ant-oat01- or sk-ant-api03-',
        }, { status: 400 })
      }

      // Set token in environment
      setTokenInEnvironment(token)

      return NextResponse.json({
        success: true,
        message: 'Token set successfully and saved to .env.local. Please restart the server (npm run dev) for changes to take effect.',
        tokenType: token.startsWith('sk-ant-oat01-') ? 'oauth' : 'api_key',
        requiresRestart: true,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "login" or "set_token"',
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error during authentication:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }, { status: 500 })
  }
}
