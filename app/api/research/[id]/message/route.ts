import { NextRequest, NextResponse } from 'next/server'
import { getResearchManager } from '@/lib/research-wizard/singleton'
import path from 'path'
import fs from 'fs/promises'

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/research/[id]/message
 * Send a message to the research agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const manager = getResearchManager()
    
    // Try to get research from database
    let research
    try {
      research = (manager as any).db.getResearch(id)
      console.log('Database research lookup:', { id, found: !!research })
    } catch (err) {
      console.error('Error getting research from database:', err)
      research = null
    }
    
    if (research) {
      // Database-backed research (wizard-created)
      
      let wasResumed = false
      // If research is completed OR running but agent process died, automatically resume it
      console.log('Research status check:', { id, status: research.status })
      
      if (research.status === 'completed' || research.status === 'failed' || research.status === 'in_progress') {
        console.log('Auto-resuming research:', { id, status: research.status, reason: research.status === 'in_progress' ? 'process may have died' : 'completed/failed' })
        try {
          await manager.resumeResearch(id)
          wasResumed = true
          console.log('Research auto-resumed successfully')
        } catch (err) {
          console.error('Failed to auto-resume research:', err)
          return NextResponse.json(
            { error: 'Failed to resume research', details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
          )
        }
      }
      
      let agents
      try {
        agents = (manager as any).db.getResearchAgents(id)
        console.log('Database agents lookup:', { id, agentsType: typeof agents, isArray: Array.isArray(agents), agents })
      } catch (err) {
        console.error('Error getting agents from database:', err)
        return NextResponse.json(
          { error: 'Failed to get agents from database', details: err instanceof Error ? err.message : String(err) },
          { status: 500 }
        )
      }
      
      // Check if agents is an array
      if (!Array.isArray(agents)) {
        console.error('getResearchAgents did not return an array:', typeof agents, agents)
        return NextResponse.json(
          { error: 'Invalid agents data from database', details: `Expected array, got ${typeof agents}` },
          { status: 500 }
        )
      }
      
      if (agents.length === 0) {
        return NextResponse.json(
          { error: 'No agents found for this research' },
          { status: 404 }
        )
      }

      const agent: any = agents[0];

      // Log the user message as an activity
      (manager as any).db.logActivity(
        agent.id,
        'user_message',
        message,
        { source: 'user', timestamp: Date.now() }
      )

      // ALSO write to .messages.json so the Python agent can pick it up
      const messagesFile = path.join(research.projectDir, '.messages.json')
      
      // Load or create messages array
      let messages: any[] = []
      try {
        const content = await fs.readFile(messagesFile, 'utf-8')
        messages = JSON.parse(content)
      } catch {
        // File doesn't exist yet, start with empty array
      }

      // Add new message
      messages.push({
        id: `msg-${Date.now()}`,
        timestamp: Date.now(),
        role: 'user',
        content: message,
        processed: false
      })

      // Save messages
      await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2))

      return NextResponse.json({
        success: true,
        message: 'Message logged successfully',
        logged: true,
        filePath: messagesFile,
        resumed: wasResumed
      })
    } else {
      // File-based research (manual/legacy)
      // Save message to a .messages.json file in the project directory
      const researchDir = process.env.RESEARCH_DIR || './research-projects'
      const projectDir = path.join(researchDir, id)
      const messagesFile = path.join(projectDir, '.messages.json')
      
      // Check if project exists
      try {
        await fs.access(projectDir)
      } catch {
        return NextResponse.json(
          { error: 'Research project not found' },
          { status: 404 }
        )
      }

      // Load or create messages array
      let messages: any[] = []
      try {
        const content = await fs.readFile(messagesFile, 'utf-8')
        messages = JSON.parse(content)
      } catch {
        // File doesn't exist yet, start with empty array
      }

      // Add new message
      messages.push({
        id: `msg-${Date.now()}`,
        timestamp: Date.now(),
        role: 'user',
        content: message
      })

      // Save messages
      await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2))

      return NextResponse.json({
        success: true,
        message: 'Message saved to project directory',
        logged: false,
        filePath: messagesFile
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
