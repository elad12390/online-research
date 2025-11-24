import { NextRequest, NextResponse } from 'next/server'
import { getResearchManager } from '@/lib/research-wizard/singleton'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/research/[id]/resume
 * Resume a completed research project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const manager = getResearchManager()
    
    // Check if research exists
    const research = (manager as any).db.getResearch(id)
    if (!research) {
      return NextResponse.json(
        { error: 'Research not found' },
        { status: 404 }
      )
    }
    
    // Check if research is already running
    if (research.status === 'in_progress' || research.status === 'pending') {
      return NextResponse.json(
        { error: 'Research is already running', status: research.status },
        { status: 400 }
      )
    }
    
    // Resume the research
    await manager.resumeResearch(id)
    
    return NextResponse.json({
      success: true,
      message: 'Research resumed successfully',
      researchId: id
    })
  } catch (error) {
    console.error('Error resuming research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resume research' },
      { status: 500 }
    )
  }
}
