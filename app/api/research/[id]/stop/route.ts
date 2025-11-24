import { NextRequest, NextResponse } from 'next/server'
import { getResearchManager } from '@/lib/research-wizard/singleton'
import path from 'path'
import fs from 'fs/promises'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/research/[id]/stop
 * Stop a running research
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('[STOP] Attempting to stop research:', id)
    
    const manager = getResearchManager()
    console.log('[STOP] Got manager')
    
    // Get research details
    const research = (manager as any).db.getResearch(id)
    console.log('[STOP] Research found:', research)
    
    if (!research) {
      console.error('[STOP] Research not found in database:', id)
      console.log('[STOP] Checking all researches in database...')
      const allResearches = (manager as any).db.getAllResearches()
      console.log('[STOP] All researches:', allResearches.map((r: any) => ({ id: r.id, topic: r.topic })))
      
      return NextResponse.json(
        { 
          error: 'Research not found',
          details: 'This research session may have been started outside of the research wizard system. Only research started via the wizard can be stopped through this interface.',
          researchId: id
        },
        { status: 404 }
      )
    }

    // Get agents first
    const agents = (manager as any).db.getResearchAgents(id)
    console.log('[STOP] Agents found:', agents.length)
    
    // Update status to stopped/paused
    try {
      (manager as any).db.updateResearchStatus(id, 'failed', Date.now())
      console.log('[STOP] Updated research status')
      
      // Create .kill file to signal Python agent to exit
      try {
        const killFile = path.join(research.projectDir, '.kill')
        await fs.writeFile(killFile, '')
        console.log('[STOP] Created .kill file at', killFile)
      } catch (err) {
        console.error('[STOP] Error creating .kill file:', err)
      }
    } catch (err) {
      console.error('[STOP] Error updating research status:', err)
      throw err
    }
    
    // Log the stop activity
    if (agents.length > 0) {
      const agent: any = agents[0]
      try {
        (manager as any).db.logActivity(
          agent.id,
          'research_stopped',
          'Research stopped by user',
          { stoppedAt: Date.now(), stoppedBy: 'user' }
        )
        console.log('[STOP] Logged stop activity')
      } catch (err) {
        console.error('[STOP] Error logging activity:', err)
        // Don't throw - stopping is more important than logging
      }
    }

    console.log('[STOP] Successfully stopped research')
    return NextResponse.json({
      success: true,
      message: 'Research stopped'
    })
  } catch (error) {
    console.error('[STOP] Error stopping research:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to stop research'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[STOP] Error details:', { message: errorMessage, stack: errorStack })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
