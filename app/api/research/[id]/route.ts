import { NextRequest, NextResponse } from 'next/server'
import { getResearchManager } from '@/lib/research-wizard/singleton'
import path from 'path'
import fs from 'fs/promises'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/research/[id]
 * Get specific research project details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 GET /api/research/[id] - Requested ID:', params.id)
  try {
    const { id } = params
    const manager = getResearchManager()
    
    // Get research details
    const research = (manager as any).db.getResearch(id)
    if (!research) {
      console.log('❌ Research not found for ID:', id)
      console.log('💡 Hint: Make sure you\'re using the full UUID, not the project directory name')
      return NextResponse.json(
        { 
          error: 'Research not found',
          hint: 'Use the full UUID (e.g., ba4ff168-e890-4223-9d2a-e2a457ecde18) not the project directory name'
        },
        { status: 404 }
      )
    }

    // Get agents for this research
    const agents = (manager as any).db.getResearchAgents(id)
    
    // Enrich agents with their activities
    const agentsWithActivities = agents.map((agent: any) => ({
      ...agent,
      activities: (manager as any).db.getAgentActivities(agent.id),
    }))

    // Also check for .messages.json and .research-progress.json files
    const researchDir = process.env.RESEARCH_DIR || './research-projects'
    
    // Try to find the actual project directory (might have ID as suffix or prefix)
    const researchDirContents = await fs.readdir(researchDir).catch(() => [])
    // First try to find by exact match, then by ID anywhere in the name
    let projectDirName = researchDirContents.find(name => name === id)
    if (!projectDirName) {
      // Try finding directory that contains the first part of the ID
      const idPrefix = id.split('-')[0]
      projectDirName = researchDirContents.find(name => name.includes(idPrefix))
    }
    const projectDir = projectDirName ? path.join(researchDir, projectDirName) : research.projectDir
    
    const messagesFile = path.join(projectDir, '.messages.json')
    const progressFile = path.join(projectDir, '.research-progress.json')
    const activitiesFile = path.join(projectDir, '.activities.json')
    
    // Read progress file if it exists
    let progress = null
    try {
      const progressContent = await fs.readFile(progressFile, 'utf-8')
      progress = JSON.parse(progressContent)
    } catch (err) {
      // No progress file - that's okay
      if ((err as any).code !== 'ENOENT') {
        console.error('Error reading .research-progress.json:', err)
      }
    }
    
    try {
      const content = await fs.readFile(messagesFile, 'utf-8')
      const messages = JSON.parse(content)
      
      // Convert messages to activities and append to the first agent
      if (agentsWithActivities.length > 0 && Array.isArray(messages)) {
        const messageActivities: any[] = []
        
        messages.forEach((msg: any) => {
          // Add user message
          messageActivities.push({
            id: msg.id,
            agentId: agentsWithActivities[0].id,
            timestamp: msg.timestamp,
            action: 'user_message',
            description: msg.content,
            metadata: { source: 'file', role: msg.role }
          })
          
          // Add assistant response if it exists
          if (msg.response) {
            console.log('📝 Adding assistant_response activity:', {
              id: `${msg.id}-response`,
              responseLength: msg.response.length,
              preview: msg.response.substring(0, 100)
            })
            messageActivities.push({
              id: `${msg.id}-response`,
              agentId: agentsWithActivities[0].id,
              timestamp: msg.processed_at ? new Date(msg.processed_at).getTime() : msg.timestamp + 1,
              action: 'assistant_response',
              description: msg.response,
              metadata: { source: 'file', role: 'assistant', messageId: msg.id }
            })
          }
        })
        
        // Append and sort by timestamp
        agentsWithActivities[0].activities = [
          ...agentsWithActivities[0].activities,
          ...messageActivities
        ].sort((a, b) => a.timestamp - b.timestamp)
      }
    } catch (err) {
      // No messages file - that's okay, just skip silently
      // Only log if it's not a "file not found" error
      if ((err as any).code !== 'ENOENT') {
        console.error('Error reading .messages.json:', err)
      }
    }
    
    // Also read .activities.json if it exists (for tool calls/thoughts during resume)
    try {
      const activitiesContent = await fs.readFile(activitiesFile, 'utf-8')
      const fileActivities = JSON.parse(activitiesContent)
      
      if (agentsWithActivities.length > 0 && Array.isArray(fileActivities)) {
        // Convert file activities to database activity format
        const convertedActivities = fileActivities.map((act: any) => ({
          id: act.id || `file-${Date.now()}-${Math.random()}`,
          agentId: agentsWithActivities[0].id,
          timestamp: new Date(act.timestamp).getTime(),
          action: act.type, // 'tool_call', 'thought', 'tool_result'
          description: act.type === 'tool_call' ? `Calling tool: ${act.tool}` : 
                      act.type === 'thought' ? act.content :
                      act.type === 'tool_result' ? 'Tool output received' : act.type,
          metadata: act
        }))
        
        // Append and sort
        agentsWithActivities[0].activities = [
          ...agentsWithActivities[0].activities,
          ...convertedActivities
        ].sort((a, b) => a.timestamp - b.timestamp)
      }
    } catch (err) {
      // No activities file - that's okay
      if ((err as any).code !== 'ENOENT') {
        console.error('Error reading .activities.json:', err)
      }
    }

    return NextResponse.json({
      research,
      agents: agentsWithActivities,
      progress, // Include progress data from file
    })
  } catch (error) {
    console.error('Error fetching research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch research' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/research/[id]
 * Delete a research project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const manager = getResearchManager()
    
    // Try to get research from database first
    const research = (manager as any).db.getResearch(id)
    
    if (research) {
      // Database-backed research
      await manager.deleteResearch(id)
      return NextResponse.json({ success: true })
    } else {
      // Fallback: Try to delete as a legacy file-based project
      try {
        const { deleteProject } = await import('@/lib/server/file-scanner')
        const success = await deleteProject(id)
        
        if (success) {
          return NextResponse.json({ success: true })
        } else {
          return NextResponse.json(
            { error: 'Research not found' },
            { status: 404 }
          )
        }
      } catch (err) {
        console.error('Error using file scanner delete:', err)
        return NextResponse.json(
          { error: 'Research not found' },
          { status: 404 }
        )
      }
    }
  } catch (error) {
    console.error('Error deleting research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete research' },
      { status: 500 }
    )
  }
}
