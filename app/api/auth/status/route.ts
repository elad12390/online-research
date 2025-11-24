import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Check which providers have API keys configured
  const providers = {
    anthropic: {
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyValid: true, // We'll validate when actually using it
    },
    openai: {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyValid: true,
    },
    google: {
      hasKey: !!process.env.GOOGLE_API_KEY,
      keyValid: true,
    },
  }

  const hasAnyProvider = Object.values(providers).some(p => p.hasKey)

  return NextResponse.json({
    providers,
    hasAnyProvider,
  })
}
