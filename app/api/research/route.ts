import { NextRequest, NextResponse } from 'next/server'
import { getResearchManager } from '@/lib/research-wizard/singleton'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/research
 * Get all research projects with stats
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'activities') {
      // Get recent activities
      const limit = parseInt(searchParams.get('limit') || '50')
      const manager = getResearchManager()
      const activities = (manager as any).db.getRecentActivities(limit)
      return NextResponse.json(activities)
    }

    // Default: Get all research with stats
    const manager = getResearchManager()
    const researches = (manager as any).db.getAllResearches()
    const recentActivities = (manager as any).db.getRecentActivities(10)

    // Calculate stats from research data
    const completedCount = researches.filter((r: any) => r.status === 'completed').length
    const totalAgents = researches.reduce((sum: number, r: any) => sum + (r.totalAgents || 0), 0)
    const completedAgents = researches.filter((r: any) => r.status === 'completed').length

    const stats = {
      researches: {
        total: researches.length,
        completed: completedCount,
      },
      agents: {
        total: totalAgents,
        completed: completedAgents,
      },
      activities: recentActivities.length,
    }

    return NextResponse.json({
      researches,
      stats,
      recentActivities,
    })
  } catch (error) {
    console.error('Error fetching research data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch research data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/research
 * Start a new research project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      topic, 
      depth = 'standard', 
      focus, 
      style = 'comprehensive',
      provider: requestedProvider = 'auto',
      model
    } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Auto-detect provider based on available API keys
    let provider = requestedProvider
    if (provider === 'auto') {
      if (process.env.ANTHROPIC_API_KEY) {
        provider = 'anthropic'
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai'
      } else if (process.env.GOOGLE_API_KEY) {
        provider = 'google'
      } else {
        return NextResponse.json(
          { 
            error: 'No API key configured',
            message: 'Please set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY in your environment',
          },
          { status: 503 }
        )
      }
    }

    // Check for appropriate API key based on provider
    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          error: 'ANTHROPIC_API_KEY is not set',
          message: 'Please authenticate at /auth or set ANTHROPIC_API_KEY in .env.local',
          setupUrl: 'https://console.anthropic.com/'
        },
        { status: 503 }
      )
    }

    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OPENAI_API_KEY is not set',
          message: 'Please set OPENAI_API_KEY in .env.local or authenticate at /auth',
          setupUrl: 'https://platform.openai.com/api-keys'
        },
        { status: 503 }
      )
    }

    if (provider === 'google' && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { 
          error: 'GOOGLE_API_KEY is not set',
          message: 'Please set GOOGLE_API_KEY in .env.local or authenticate at /auth',
          setupUrl: 'https://aistudio.google.com/apikey'
        },
        { status: 503 }
      )
    }

    const manager = getResearchManager()
    const researchId = await manager.startResearch({
      topic,
      depth: depth as 'quick' | 'standard' | 'deep',
      focus,
      style: style as 'comprehensive' | 'comparing' | 'practical',
      provider: provider as 'anthropic' | 'openai' | 'google',
      model,
    })

    return NextResponse.json(
      { researchId, status: 'started' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error starting research:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to start research'
    
    // Provide helpful error message for API key issues
    if (errorMessage.includes('API_KEY')) {
      return NextResponse.json(
        { 
          error: errorMessage,
          message: 'API key configuration error. Please authenticate at /auth or check .env.local',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
