import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Provider = 'anthropic' | 'openai' | 'google'

const ENV_VAR_NAMES: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API key are required' },
        { status: 400 }
      )
    }

    if (!ENV_VAR_NAMES[provider as Provider]) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Validate API key format (basic check)
    const trimmedKey = apiKey.trim()
    if (trimmedKey.length < 10) {
      return NextResponse.json(
        { success: false, error: 'API key appears to be invalid (too short)' },
        { status: 400 }
      )
    }

    // Path to .env.local
    const envPath = path.join(process.cwd(), '.env.local')
    
    // Read existing .env.local or create empty string
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch (error) {
      // File doesn't exist, will create new one
      console.log('.env.local not found, creating new file')
    }

    const envVarName = ENV_VAR_NAMES[provider as Provider]
    const envVarLine = `${envVarName}=${trimmedKey}`

    // Check if this env var already exists
    const envVarRegex = new RegExp(`^${envVarName}=.*$`, 'm')
    
    if (envVarRegex.test(envContent)) {
      // Replace existing
      envContent = envContent.replace(envVarRegex, envVarLine)
    } else {
      // Add new line
      envContent = envContent.trim() + '\n' + envVarLine + '\n'
    }

    // Write back to .env.local
    await fs.writeFile(envPath, envContent, 'utf-8')

    // Also set in current process.env for immediate use
    process.env[envVarName] = trimmedKey

    // Check if user has any provider now
    const hasAnyProvider = !!(
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_API_KEY
    )

    return NextResponse.json({
      success: true,
      message: `${provider} API key saved successfully`,
      hasAnyProvider,
      requiresRestart: false, // process.env is updated immediately
    })
  } catch (error) {
    console.error('Error setting API key:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}
