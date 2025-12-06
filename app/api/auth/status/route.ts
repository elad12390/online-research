import { NextResponse } from 'next/server'
import { apiKeys } from '@/lib/config'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Check which providers have API keys configured (using centralized config)
  const providers = {
    anthropic: {
      hasKey: apiKeys.hasAnthropic,
      keyValid: true, // We'll validate when actually using it
    },
    openai: {
      hasKey: apiKeys.hasOpenai,
      keyValid: true,
    },
    google: {
      hasKey: apiKeys.hasGoogle,
      keyValid: true,
    },
  }

  return NextResponse.json({
    providers,
    hasAnyProvider: apiKeys.hasAny,
  })
}
