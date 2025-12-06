/**
 * Research Manager
 * Orchestrates research projects using Claude Agent SDK and manages the workflow
 * 
 * Refactored to follow KISS and SRP principles:
 * - Stream parsing logic extracted to stream-parser.ts
 * - Constants extracted to constants.ts
 * - Main class focused on orchestration only
 */

import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { ResearchDatabase } from "./research-wizard-db"
import { v4 as uuidv4 } from "uuid"
import { researchLogger } from "@/lib/logger"
import { 
  DEPTH_INSTRUCTIONS, 
  STYLE_INSTRUCTIONS, 
  HTML_BASE_STYLES,
} from "./constants"
import { apiKeys, validateProviderKey, getProcessEnv } from "@/lib/config"

interface ResearchConfig {
  topic: string
  depth: "quick" | "standard" | "deep"
  focus?: string
  style?: "comprehensive" | "comparing" | "practical"
  provider?: "anthropic" | "openai" | "google"
  model?: string
}

interface ProgressUpdate {
  percentage: number
  currentTask: string
  currentTaskDescription: string
  completedTasks: string[]
  startedAt: string
  estimatedCompletion: string
}

export class ResearchManager {
  private db: ResearchDatabase
  private baseResearchDir: string

  constructor(
    _baseUrl?: string,
    baseResearchDir: string = "./research-projects"
  ) {
    this.baseResearchDir = baseResearchDir
    this.db = new ResearchDatabase(path.join(baseResearchDir, "research-wizard.db"))
    this.cleanupStaleResearches()
  }

  /**
   * Check for stale in_progress researches on startup and mark them failed
   */
  private cleanupStaleResearches() {
    try {
      const researches = this.db.getAllResearches()
      const staleResearches = researches.filter(r => r.status === 'in_progress')
      
      if (staleResearches.length > 0) {
        console.log(`[ResearchManager] Found ${staleResearches.length} stale researches. Cleaning up...`)
        
        for (const research of staleResearches) {
          console.log(`[ResearchManager] Marking stale research failed: ${research.id}`)
          this.db.updateResearchStatus(research.id, 'failed', Date.now())
          
          const agents = this.db.getResearchAgents(research.id)
          for (const agent of agents) {
            if (agent.status === 'running' || agent.status === 'pending') {
              this.db.updateAgentStatus(
                agent.id, 
                'failed', 
                undefined, 
                'Process terminated unexpectedly (server restart)'
              )
              
              this.db.logActivity(
                agent.id,
                'error',
                'Agent process terminated unexpectedly due to server restart'
              )
            }
          }
        }
      }
    } catch (err) {
      console.error('[ResearchManager] Error cleaning up stale researches:', err)
    }
  }

  /**
   * Create and start a new research project
   */
  async startResearch(config: ResearchConfig): Promise<string> {
    const researchId = uuidv4()
    const projectDir = this.createProjectDirectory(config.topic, researchId)

    // Create research record in database (with provider and model)
    this.db.createResearch(researchId, config.topic, projectDir, config.provider, config.model)

    // Initialize progress file
    this.initializeProgressFile(projectDir)

    // Create initial README
    this.createReadme(projectDir, config)

    // Log startup activity
    const agentRecord = this.db.createAgent(researchId, "Research Agent")
    this.db.logActivity(
      agentRecord.id,
      "research_started",
      `Starting research on: ${config.topic}`,
      config
    )

    // Spawn research agent asynchronously
    this.spawnResearchAgent(researchId, projectDir, config, agentRecord.id)

    return researchId
  }

  /**
   * Resume a completed research project
   */
  async resumeResearch(researchId: string): Promise<boolean> {
    console.log('[ResearchManager] Starting resumeResearch:', { researchId })
    
    // Get research from database
    const research = this.db.getResearch(researchId)
    if (!research) {
      throw new Error(`Research ${researchId} not found`)
    }
    console.log('[ResearchManager] Found research:', { topic: research.topic, status: research.status })

    // Get the agent
    const agents = this.db.getResearchAgents(researchId)
    if (!agents || agents.length === 0) {
      throw new Error(`No agents found for research ${researchId}`)
    }

    const agent = agents[0]
    console.log('[ResearchManager] Found agent:', { id: agent.id, status: agent.status })

    // Kill any existing running agents first to prevent duplicates
    const killFile = path.join(research.projectDir, '.kill')
    console.log('[ResearchManager] Sending kill signal to any existing agents...')
    try {
      await fs.promises.writeFile(killFile, '')
      // Wait for agent to pick up signal (it polls every 2s)
      await new Promise(resolve => setTimeout(resolve, 2500))
      // Remove kill file so new agent doesn't die immediately
      if (fs.existsSync(killFile)) {
        await fs.promises.unlink(killFile)
      }
      console.log('[ResearchManager] Kill signal handled')
    } catch (e) {
      console.error('Error handling kill signal:', e)
    }

    // Update status to in_progress
    this.db.updateResearchStatus(researchId, 'in_progress')
    this.db.updateAgentStatus(agent.id, 'running')
    this.db.logActivity(
      agent.id,
      'research_resumed',
      'Resuming research session with message history'
    )
    console.log('[ResearchManager] Updated statuses to in_progress/running')

    // Build config from research data (use stored provider/model)
    const config: ResearchConfig = {
      topic: research.topic,
      depth: 'deep',
      style: 'comprehensive',
      provider: research.provider,
      model: research.model,
    }
    console.log('[ResearchManager] Using stored provider/model:', { provider: research.provider, model: research.model })

    console.log('[ResearchManager] Spawning agent in resume mode...')
    // Spawn agent in resume mode (pass resume=true as 5th parameter)
    await this.spawnResearchAgent(researchId, research.projectDir, config, agent.id, true)
    console.log('[ResearchManager] Agent spawned successfully')

    return true
  }

  /**
   * Delete a research project (DB and files)
   */
  async deleteResearch(researchId: string): Promise<boolean> {
    const research = this.db.getResearch(researchId)
    if (!research) return false

    // Delete from DB
    this.db.deleteResearch(researchId)

    // Delete files
    if (research.projectDir && fs.existsSync(research.projectDir)) {
      try {
        await fs.promises.rm(research.projectDir, { recursive: true, force: true })
        console.log(`[ResearchManager] Deleted research directory: ${research.projectDir}`)
      } catch (err) {
        console.error(`[ResearchManager] Failed to delete directory ${research.projectDir}:`, err)
        // Continue - we deleted the DB record so it's effectively gone from the UI
      }
    }

    return true
  }

  /**
   * Spawn the research agent as a background task
   */
  /**
   * Spawn the research agent as a background task using mcp-agent Python script
   */
  private async spawnResearchAgent(
    researchId: string,
    projectDir: string,
    config: ResearchConfig,
    agentId: string,
    resume: boolean = false
  ) {
    let startTime = 0
    try {
      startTime = Date.now()
      const correlationId = uuidv4().slice(0, 8)
      
      researchLogger.info("Starting research with mcp-agent", {
        correlationId,
        researchId,
        topic: config.topic,
        depth: config.depth,
        style: config.style,
      })

      // Determine provider and model (default to anthropic since it's more commonly configured)
      const provider = config.provider || "anthropic"
      // Handle "auto" model - replace with actual default model for the provider
      // "auto" is not a valid model name for any LLM provider
      let model = config.model
      if (!model || model === "auto") {
        model = provider === "anthropic" ? "claude-sonnet-4-5" : "gpt-4o-mini"
      }
      
      // Check for appropriate API key based on provider (using centralized config)
      validateProviderKey(provider as 'anthropic' | 'openai' | 'google')

      // Update agent status
      this.db.updateAgentStatus(agentId, "running")
      this.db.updateResearchStatus(researchId, "in_progress")
      
      // Path to Python research script (use process.cwd() to get project root)
      const projectRoot = process.cwd()
      const scriptPath = path.join(projectRoot, 'scripts/research-agent.py')
      const venvPython = path.join(projectRoot, '.venv/bin/python3')
      
      researchLogger.info("Spawning Python research agent", {
        correlationId,
        script: scriptPath,
        python: venvPython,
      })

      // Spawn Python script
      const args = [
        scriptPath,
        config.topic,
        projectDir,
        provider,
        model,
      ]
      
      // Add --resume flag if resuming
      if (resume) {
        args.push('--resume')
        console.log(`[${correlationId}] RESUMING research with args:`, args)
      } else {
        console.log(`[${correlationId}] STARTING NEW research with args:`, args)
      }
      
      const pythonProcess = spawn(venvPython, args, {
        env: getProcessEnv(),  // Use centralized config for environment
        cwd: projectRoot, // Project root for mcp_agent.config.yaml
      })

      // Handle stdout (JSON messages)
      let buffer = ''
      let lastToolName: string | null = null // Track tool name from streaming output
      let pendingToolCall: { tool: string, args: Record<string, string> } | null = null
      let inToolsCallParams = false // Track if we're inside tools/call params
      let inArguments = false // Track if we're inside arguments block
      let lastToolResultId: string | null = null // Track tool_use_id for results
      
      // Multi-line result buffering
      let resultBuffer: string | null = null // Accumulate multi-line results
      let resultToolName: string | null = null // Tool for the buffered result
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          // Check if this is a noisy line we should suppress (tool schemas, etc.)
          const isToolSchemaNoise = 
            line.includes('"type": "function"') ||
            line.includes('"parameters": {') ||
            line.includes('"properties": {') ||
            line.includes('"inputSchema"') ||
            line.includes('"outputSchema"') ||
            line.includes('"required": [') ||
            line.match(/^\s*[{}\[\],]\s*$/) || // Just brackets/braces
            line.includes('"max_releases"') ||
            line.includes('"default":') ||
            (line.includes('"type":') && !line.includes('"type": "tool_result"') && !line.includes('"type": "tool_use"'))
          
          if (isToolSchemaNoise) {
            continue
          }
          
          // ===== PATTERN 1: OpenAI format - "tool_name": "xxx" =====
          const toolNameMatch = line.match(/"tool_name":\s*"([a-zA-Z0-9_.-]+)"/)
          if (toolNameMatch) {
            const toolName = toolNameMatch[1]
            lastToolName = toolName
            pendingToolCall = { tool: toolName, args: {} }
            inToolsCallParams = true
            continue
          }
          
          // ===== PATTERN 2: Anthropic format - detect tools/call then "name" =====
          if (line.includes('"method": "tools/call"')) {
            inToolsCallParams = true
            continue
          }
          
          // Capture tool name from "name": "xxx" inside params (Anthropic format)
          // Only capture if we're in tools/call context and it's not a tool schema
          if (inToolsCallParams && !pendingToolCall) {
            const nameMatch = line.match(/^\s*"name":\s*"([a-zA-Z0-9_.-]+)"/)
            if (nameMatch) {
              const toolName = nameMatch[1]
              // Skip if it looks like a method name
              if (!toolName.includes('/')) {
                lastToolName = toolName
                pendingToolCall = { tool: toolName, args: {} }
              }
              continue
            }
          }
          
          // Detect "arguments": { block
          if (pendingToolCall && line.includes('"arguments":')) {
            inArguments = true
            // Don't continue - might have args on same line
          }
          
          // ===== CAPTURE ARGUMENTS =====
          // Capture args when we have a pendingToolCall (don't require inArguments 
          // because some streaming formats emit arguments before the "arguments:" block marker)
          if (pendingToolCall) {
            // Capture "query" for web_search - handle escaped quotes properly
            // Use a more robust approach: find the value after "query": and handle escapes
            if (line.includes('"query":')) {
              const queryStartIdx = line.indexOf('"query":')
              const afterQuery = line.substring(queryStartIdx + 8).trim()
              if (afterQuery.startsWith('"')) {
                // Find the closing quote (not escaped)
                let value = ''
                let i = 1 // skip opening quote
                let escaped = false
                while (i < afterQuery.length) {
                  const char = afterQuery[i]
                  if (escaped) {
                    value += char
                    escaped = false
                  } else if (char === '\\') {
                    escaped = true
                  } else if (char === '"') {
                    break // end of string
                  } else {
                    value += char
                  }
                  i++
                }
                if (value) {
                  pendingToolCall.args.query = value
                }
              }
            }
            
            // Capture "url" for crawl_url
            const urlMatch = line.match(/"url":\s*"([^"]+)"/)
            if (urlMatch) {
              pendingToolCall.args.url = urlMatch[1]
            }
            
            // Capture "path" for file operations
            const pathMatch = line.match(/"path":\s*"([^"]+)"/)
            if (pathMatch) {
              pendingToolCall.args.path = pathMatch[1]
            }
            
            // Capture "reasoning" (useful context)
            const reasoningMatch = line.match(/"reasoning":\s*"([^"]*(?:\\.[^"]*)*)"/)
            if (reasoningMatch) {
              pendingToolCall.args.reasoning = reasoningMatch[1].substring(0, 100) // Truncate
            }
            
            // Capture "title" for write_research_metadata (use same robust parsing as query)
            if (line.includes('"title":') && !pendingToolCall.args.title) {
              const titleStartIdx = line.indexOf('"title":')
              const afterTitle = line.substring(titleStartIdx + 8).trim()
              if (afterTitle.startsWith('"')) {
                let value = ''
                let i = 1
                let escaped = false
                while (i < afterTitle.length) {
                  const char = afterTitle[i]
                  if (escaped) { value += char; escaped = false }
                  else if (char === '\\') { escaped = true }
                  else if (char === '"') { break }
                  else { value += char }
                  i++
                }
                if (value) {
                  pendingToolCall.args.title = value
                }
              }
            }
            
            // Capture "description" for write_research_metadata
            if (line.includes('"description":') && !pendingToolCall.args.description) {
              const descMatch = line.match(/"description":\s*"([^"]*(?:\\.[^"]*)*)"/)
              if (descMatch) {
                pendingToolCall.args.description = descMatch[1].substring(0, 100)
              }
            }
            
            // Capture "category" for write_research_metadata
            const categoryMatch = line.match(/"category":\s*"([^"]+)"/)
            if (categoryMatch && !pendingToolCall.args.category) {
              pendingToolCall.args.category = categoryMatch[1]
            }
            
            // Capture "percentage" for update_research_progress
            const percentMatch = line.match(/"percentage":\s*(\d+)/)
            if (percentMatch) {
              pendingToolCall.args.percentage = percentMatch[1]
            }
            
            // Capture "current_task" for update_research_progress
            const taskMatch = line.match(/"current_task":\s*"([^"]+)"/)
            if (taskMatch) {
              pendingToolCall.args.current_task = taskMatch[1]
            }
            
            // Capture "repo" for github_repo
            const repoMatch = line.match(/"repo":\s*"([^"]+)"/)
            if (repoMatch) {
              pendingToolCall.args.repo = repoMatch[1]
            }
            
            // Capture "filePath" for file write operations
            const filePathMatch = line.match(/"filePath":\s*"([^"]+)"/)
            if (filePathMatch && !pendingToolCall.args.filePath) {
              pendingToolCall.args.filePath = filePathMatch[1]
            }
          }
          
          // ===== EMIT TOOL CALL when we see closing patterns =====
          // Anthropic: end of arguments block or start of next message
          // OpenAI: "method": "tools/call" after tool_name
          const shouldEmit = pendingToolCall && (
            (line.includes('"method": "tools/call"') && pendingToolCall.tool) ||
            (inArguments && (line.match(/^\s*}\s*$/) || line.includes('"meta":')))
          )
          
          if (shouldEmit && pendingToolCall) {
            // Build description based on tool type and args
            let toolDescription = pendingToolCall.tool
            const args = pendingToolCall.args
            
            if (args.query) {
              toolDescription = `${pendingToolCall.tool}: "${args.query}"`
            } else if (args.url) {
              toolDescription = `${pendingToolCall.tool}: ${args.url}`
            } else if (args.path) {
              toolDescription = `${pendingToolCall.tool}: ${args.path}`
            } else if (args.filePath) {
              toolDescription = `${pendingToolCall.tool}: ${args.filePath}`
            } else if (args.title) {
              // For write_research_metadata, show title and category if available
              const extra = args.category ? ` [${args.category}]` : ''
              toolDescription = `${pendingToolCall.tool}: "${args.title}"${extra}`
            } else if (args.current_task) {
              toolDescription = `${pendingToolCall.tool}: ${args.percentage || 0}% - ${args.current_task}`
              
              // If progress reaches 100%, mark research as completed
              // This is a safety net in case research_fully_completed message is missed
              if (pendingToolCall.tool === 'update_research_progress' && args.percentage === '100') {
                console.log(`[${correlationId}] Progress hit 100% - marking research as completed`)
                this.db.updateResearchStatus(researchId, "completed", Date.now())
                this.db.updateAgentStatus(agentId, "completed", "Research completed successfully")
              }
            } else if (args.repo) {
              toolDescription = `${pendingToolCall.tool}: ${args.repo}`
            }
            
            // Only emit if we have args OR if we explicitly saw the tool
            if (Object.keys(args).length > 0 || inToolsCallParams) {
              this.db.logActivity(
                agentId,
                "tool_call",
                toolDescription,
                { tool: pendingToolCall.tool, args: pendingToolCall.args, source: "streaming" }
              )
              console.log(`[${correlationId}] TOOL_CALL: ${toolDescription}`)
              
              // Update lastToolName AFTER emitting so results are attributed correctly
              lastToolName = pendingToolCall.tool
            }
            
            pendingToolCall = null
            inToolsCallParams = false
            inArguments = false
            continue
          }
          
          // ===== CAPTURE TOOL RESULTS =====
          // MCP format: "structuredContent": { "result": "..." } followed by "isError": false/true
          // Handle multi-line results by buffering
          
          // Check if we're accumulating a multi-line result
          if (resultBuffer !== null) {
            // Continue accumulating until we find the closing quote
            // Add newline to preserve formatting (the original newline was stripped by split)
            resultBuffer += '\n' + line
            
            // Check if this line completes the result (ends with ", or just ")
            if (line.match(/[^\\]"\s*,?\s*$/) || line.match(/^"\s*,?\s*$/)) {
              // Result complete - emit it
              // Use larger limit for read_file to show more content
              const maxLen = resultToolName === 'read_file' ? 2000 : 500
              let resultText = resultBuffer
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/"\s*,?\s*$/, '') // Remove trailing quote and comma
                .substring(0, maxLen)
              
              if (resultText.length >= maxLen) {
                resultText += '...'
              }
              
              if (resultToolName && resultText.length > 5) {
                this.db.logActivity(
                  agentId,
                  "tool_result",
                  `${resultToolName} result`,
                  { tool: resultToolName, result: resultText, source: "streaming" }
                )
                console.log(`[${correlationId}] TOOL_RESULT (${resultToolName}): ${resultText.substring(0, 100)}...`)
              }
              
              resultBuffer = null
              resultToolName = null
              lastToolName = null
            }
            continue
          }
          
          // Check for start of result content
          const resultStartMatch = line.match(/"result":\s*"(.*)/)
          if (resultStartMatch && lastToolName) {
            const afterQuote = resultStartMatch[1]
            
            // Check if the result is complete on this line
            // Look for closing quote that's not preceded by odd number of backslashes
            // Find the last unescaped quote
            let resultContent = ''
            let isComplete = false
            let i = 0
            while (i < afterQuote.length) {
              const char = afterQuote[i]
              if (char === '\\' && i + 1 < afterQuote.length) {
                // Escape sequence - add both chars and skip next
                resultContent += char + afterQuote[i + 1]
                i += 2
              } else if (char === '"') {
                // Unescaped quote - this ends the string
                isComplete = true
                break
              } else {
                resultContent += char
                i++
              }
            }
            
            if (isComplete) {
              // Single-line result - use larger limit for read_file
              const maxLen = lastToolName === 'read_file' ? 2000 : 500
              let resultText = resultContent
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
                .substring(0, maxLen)
              
              if (resultText.length >= maxLen) {
                resultText += '...'
              }
              
              if (resultText.length > 5) {
                const toolForResult = lastToolName
                this.db.logActivity(
                  agentId,
                  "tool_result",
                  `${toolForResult} result`,
                  { tool: toolForResult, result: resultText, source: "streaming" }
                )
                console.log(`[${correlationId}] TOOL_RESULT (${toolForResult}): ${resultText.substring(0, 100)}...`)
                lastToolName = null
              }
            } else {
              // Multi-line result - start buffering
              resultBuffer = afterQuote
              resultToolName = lastToolName
            }
            continue
          }
          
          // Capture "text" results (used by some MCP responses like read_file)
          // Handle both single-line and multi-line text content
          const textStartMatch = line.match(/"text":\s*"(.*)/)
          if (textStartMatch && lastToolName && !line.includes('"type":')) {
            const afterQuote = textStartMatch[1]
            
            // Use character-by-character parsing to handle escaped quotes properly
            let textContent = ''
            let isComplete = false
            let i = 0
            while (i < afterQuote.length) {
              const char = afterQuote[i]
              if (char === '\\' && i + 1 < afterQuote.length) {
                // Escape sequence - add both chars and skip next
                textContent += char + afterQuote[i + 1]
                i += 2
              } else if (char === '"') {
                // Unescaped quote - this ends the string
                isComplete = true
                break
              } else {
                textContent += char
                i++
              }
            }
            
            if (isComplete) {
              // Single-line text result - use larger limit for read_file
              const maxLen = lastToolName === 'read_file' ? 2000 : 500
              let textResult = textContent
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
                .substring(0, maxLen)
              
              if (textResult.length >= maxLen) {
                textResult += '...'
              }
              
              // Only log if it looks like meaningful content
              if (textResult.length > 20 && !textResult.startsWith('{')) {
                const toolForText = lastToolName
                this.db.logActivity(
                  agentId,
                  "tool_result",
                  `${toolForText} returned`,
                  { tool: toolForText, text: textResult, source: "streaming" }
                )
                console.log(`[${correlationId}] TOOL_TEXT (${toolForText}): ${textResult.substring(0, 80)}...`)
                lastToolName = null
              }
            }
            // Note: Multi-line text buffering could be added here if needed
            continue
          }
          
          // Capture search results - web_search returns structured data with titles/urls
          // We want to capture a summary of what was found
          if (lastToolName && lastToolName.includes('web_search')) {
            // Capture individual result titles
            const searchTitleMatch = line.match(/"title":\s*"([^"]+)"/)
            if (searchTitleMatch && searchTitleMatch[1].length > 5) {
              console.log(`[${correlationId}] SEARCH_RESULT: ${searchTitleMatch[1].substring(0, 60)}`)
            }
            
            // Capture URLs from search results
            const searchUrlMatch = line.match(/"url":\s*"(https?:\/\/[^"]+)"/)
            if (searchUrlMatch) {
              console.log(`[${correlationId}] SEARCH_URL: ${searchUrlMatch[1].substring(0, 60)}`)
            }
          }
          
          // Capture crawl_url results - these return page content
          if (lastToolName && lastToolName.includes('crawl_url')) {
            // Look for content field which has the crawled text
            const contentMatch = line.match(/"content":\s*"([^"]{50,})"/)
            if (contentMatch) {
              const preview = contentMatch[1].substring(0, 200).replace(/\\n/g, ' ')
              this.db.logActivity(
                agentId,
                "tool_result", 
                `${lastToolName} fetched page`,
                { tool: lastToolName, preview: preview + '...', source: "streaming" }
              )
              console.log(`[${correlationId}] CRAWL_CONTENT: ${preview.substring(0, 80)}...`)
              lastToolName = null
            }
          }
          
          // Check for error results
          if (line.includes('"isError": true') && lastToolName) {
            this.db.logActivity(
              agentId,
              "tool_error",
              `${lastToolName} failed`,
              { tool: lastToolName, error: true, source: "streaming" }
            )
            console.log(`[${correlationId}] TOOL_ERROR: ${lastToolName}`)
            continue
          }
          
          // Capture tool_use_id for correlation (Anthropic format)
          const toolUseIdMatch = line.match(/"tool_use_id":\s*"([^"]+)"/)
          if (toolUseIdMatch) {
            lastToolResultId = toolUseIdMatch[1]
            continue
          }
          
          // ===== PARSE JSON MESSAGES =====
          try {
            const message = JSON.parse(line)
            
            if (!message.type) {
              // Not a structured message, skip
              continue
            }
            
            // ALWAYS log to console so you can see what's happening
            console.log(`[${correlationId}] ${message.type}:`, message)
            
            researchLogger.info("Python agent message", {
              correlationId,
              type: message.type,
              data: message,
            })
            
            // Handle different message types
            if (message.type === 'debug_raw_log') {
              // Log raw messages for debugging
              researchLogger.info("RAW LOG:", { 
                correlationId, 
                message: message.message,
                logger: message.logger 
              })
            } else if (message.type === 'progress') {
              this.db.logActivity(agentId, "progress", message.message)
            } else if (message.type === 'tools_loaded') {
              this.db.logActivity(agentId, "tools_loaded", `Loaded ${message.count} MCP tools`)
            } else if (message.type === 'research_completed') {
              this.db.logActivity(agentId, "research_completed", "Research generation completed")
            } else if (message.type === 'app_started') {
              this.db.logActivity(agentId, "app_started", "MCPApp started successfully")
            } else if (message.type === 'research_started') {
              this.db.logActivity(agentId, "research_started", "Research started")
            } else if (message.type === 'llm_starting') {
              this.db.logActivity(agentId, "llm_starting", `LLM starting research on: ${message.topic}`)
            } else if (message.type === 'llm_completed') {
              this.db.logActivity(agentId, "llm_completed", "LLM completed research")
            } else if (message.type === 'research_fully_completed') {
              // Initial research is complete, but agent stays alive for messages
              this.db.updateResearchStatus(researchId, "completed", Date.now())
              this.db.logActivity(agentId, "success", "Initial research completed. Agent ready for follow-up questions.")
            } else if (message.type === 'waiting_for_messages') {
              this.db.logActivity(agentId, "waiting", "Waiting for follow-up messages...")
            } else if (message.type === 'user_message_received') {
              this.db.logActivity(agentId, "user_message", message.message)
            } else if (message.type === 'message_processed') {
              this.db.logActivity(agentId, "message_processed", `Processed message ${message.message_id}`)
            } else if (message.type === 'assistant_response') {
              // Log the assistant's response to the user message
              this.db.logActivity(agentId, "assistant_response", message.response, {
                messageId: message.message_id
              })
            } else if (message.type === 'tool_call') {
              // Generic tool call logging
              this.db.logActivity(
                agentId, 
                "tool_call", 
                `Calling tool: ${message.tool}`,
                { tool: message.tool, args: message.args }
              )
            } else if (message.type === 'thought') {
              // Agent thought logging
              this.db.logActivity(
                agentId,
                "thought",
                message.content,
                { type: "thought" }
              )
            } else if (message.type === 'tool_result') {
              // Tool output logging
              this.db.logActivity(
                agentId,
                "tool_result",
                "Tool output received",
                { 
                  output: message.output,
                  tool: message.tool || 'Unknown Tool'
                }
              )
            } else if (message.type === 'log') {
              // Generic log message
              this.db.logActivity(agentId, "log", message.message)
            }
          } catch (err) {
            // Not JSON, log as regular output - ALWAYS show in console
            console.log(`[${correlationId}] RAW:`, line)
            researchLogger.info("Python stdout (non-JSON)", { correlationId, output: line })
          }
        }
      })

      // Handle stderr
      pythonProcess.stderr.on('data', (data: Buffer) => {
        const stderrText = data.toString()
        
        // Filter out known harmless MCP parsing errors from web-research-assistant
        // These are cosmetic - the server prints status messages that aren't valid JSON-RPC
        const isHarmlessMcpError = 
          stderrText.includes('Failed to parse JSONRPC message from server') &&
          stderrText.includes('pydantic_core._pydantic_core.ValidationError')
        
        if (isHarmlessMcpError) {
          // Suppress these known cosmetic errors from web-research-assistant
          return
        }
        
        // ALWAYS show stderr in console
        console.log(`[${correlationId}] STDERR:`, stderrText)
        
        // Log actual errors prominently, other output as info
        if (stderrText.includes('ERROR') || stderrText.includes('Error')) {
          researchLogger.error("Python agent error output", new Error(stderrText), {
            correlationId,
          })
        } else {
          // Show non-error stderr at info level so user can see progress
          researchLogger.info("Python stderr", {
            correlationId,
            stderr: stderrText,
          })
        }
      })

      // Handle process completion
      pythonProcess.on('close', (code) => {
        const totalTime = Date.now() - startTime
        
        researchLogger.info("Python agent completed", {
          correlationId,
          exitCode: code,
          duration_ms: totalTime,
        })
        
        if (code === 0) {
          // Success
          this.db.updateAgentStatus(agentId, "completed", "Research completed successfully")
          this.db.updateResearchStatus(researchId, "completed", Date.now())
          this.db.logActivity(agentId, "success", `Research completed in ${Math.round(totalTime / 1000)}s`)
        } else {
          // Failure
          this.db.updateAgentStatus(agentId, "failed", undefined, `Python process exited with code ${code}`)
          this.db.updateResearchStatus(researchId, "failed")
          this.db.logActivity(agentId, "error", `Research failed with exit code ${code}`)
        }
      })

      // Handle errors
      pythonProcess.on('error', (err) => {
        const totalTime = Date.now() - startTime
        
        researchLogger.error("Python agent error", err, {
          correlationId,
          duration_ms: totalTime,
        })
        
        this.db.updateAgentStatus(agentId, "failed", undefined, err.message)
        this.db.updateResearchStatus(researchId, "failed")
        this.db.logActivity(agentId, "error", `Process error: ${err.message}`)
      })
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      const totalTime = Date.now() - startTime
      
      researchLogger.error("Research execution failed", error, {
        researchId,
        duration_ms: totalTime,
      })
      
      this.db.updateAgentStatus(agentId, "failed", undefined, errorMsg)
      this.db.updateResearchStatus(researchId, "failed")
      this.db.logActivity(
        agentId,
        "error",
        `Research failed: ${errorMsg}`,
        { stack }
      )
    }
  }

  /**
   * Build the research prompt based on configuration
   * Uses shared constants from constants.ts (DRY principle)
   */
  private buildResearchPrompt(config: ResearchConfig): string {

    return `
You are a research agent tasked with conducting thorough research on a topic.

TOPIC: ${config.topic}
${config.focus ? `FOCUS: ${config.focus}` : ""}
DEPTH: ${DEPTH_INSTRUCTIONS[config.depth]}
STYLE: ${STYLE_INSTRUCTIONS[config.style || "comprehensive"]}

‼️ CRITICAL FILE FORMAT REQUIREMENT ‼️
YOU MUST CREATE HTML FILES ONLY - NO MARKDOWN FILES ALLOWED!
FILE EXTENSION MUST BE .html NOT .md
VIOLATING THIS WILL CAUSE THE RESEARCH TO FAIL!

INSTRUCTIONS:

1. USE WEB RESEARCH TOOLS:
   - Use web-research-assistant_web_search to search for information
   - Use web-research-assistant_crawl_url to read web pages
   - Use web-research-assistant_compare_tech to compare technologies/products
   - Use other web-research-assistant tools as needed

2. CREATE HTML FILES (NOT MARKDOWN!):
   ⚠️ MANDATORY: All files MUST end with .html extension
   ⚠️ FORBIDDEN: Do NOT create any .md files
   
   File naming examples (CORRECT):
   ✅ 01-executive-summary.html
   ✅ 02-detailed-analysis.html  
   ✅ 03-recommendations.html
   
   File naming examples (WRONG - DO NOT USE):
   ❌ 01-executive-summary.md
   ❌ analysis.md
   ❌ Any file ending in .md
   
   Use the Write tool to create HTML files with this structure:
   
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Your Title</title>
       <style>
           body {
               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
               line-height: 1.6;
               max-width: 900px;
               margin: 0 auto;
               padding: 2rem;
               color: #333;
           }
           h1 { color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3rem; }
           h2 { color: #2a2a2a; margin-top: 2rem; }
           table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
           th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
           th { background-color: #f5f5f5; font-weight: 600; }
       </style>
   </head>
   <body>
       <h1>Your Title Here</h1>
       <!-- Your HTML content here -->
   </body>
   </html>

3. RESEARCH STRUCTURE:
   Create HTML files covering:
   - Executive Summary (key findings)
   - Detailed Analysis (main research content)
   - Comparisons (if applicable - use HTML tables)
   - Recommendations (actionable advice)
   - Sources (list of URLs with <a> links)

4. WRITING STYLE:
   - Use clear, professional language
   - Include specific data, numbers, and facts
   - Cite sources with clickable <a href="url">links</a>
   - Use semantic HTML: <h1>, <h2>, <p>, <ul>, <ol>, <table>, <a>
   - NO markdown syntax allowed - use proper HTML tags

REMINDER: Create .html files ONLY! The system expects HTML format!

Begin your research now. Use web-research-assistant tools to gather information, then create well-organized HTML files (.html extension) with your findings.
`
  }

  /**
   * Process AI response and create HTML files
   */
  private async processResearchResponse(
    projectDir: string,
    fullText: string,
    config: ResearchConfig,
    agentId: string
  ) {
    // Parse content into sections
    const sections = this.parseContent(fullText)
    
    let fileCount = 1
    const files: string[] = []

    for (const section of sections) {
      const fileName = `${String(fileCount).padStart(2, "0")}-${this.slugify(
        section.title
      )}.html`
      const filePath = path.join(projectDir, fileName)

      // Wrap content in HTML structure using shared styles (DRY principle)
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${section.title}</title>
    <style>
        ${HTML_BASE_STYLES}
    </style>
</head>
<body>
    <h1>${section.title}</h1>
    ${section.content}
</body>
</html>`

      fs.writeFileSync(filePath, htmlContent)

      files.push(fileName)
      fileCount++

      this.db.logActivity(
        agentId,
        "file_created",
        `Created: ${fileName}`,
        { size: section.content.length }
      )
    }
  }

  /**
   * Parse content into sections based on markdown structure
   */
  private parseContent(text: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = []
    const lines = text.split("\n")
    let currentSection = { title: "Overview", content: "" }

    for (const line of lines) {
      if (line.startsWith("# ") || line.startsWith("## ")) {
        if (currentSection.content.trim()) {
          sections.push(currentSection)
        }
        const title = line.replace(/^#+\s*/, "").trim()
        currentSection = { title, content: "" }
      } else {
        currentSection.content += line + "\n"
      }
    }

    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Create project directory structure
   */
  private createProjectDirectory(topic: string, researchId: string): string {
    const dirName = `${this.slugify(topic)}-${researchId.substring(0, 8)}`
    const projectDir = path.join(this.baseResearchDir, dirName)

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true })
    }

    // Create code subdirectory for examples
    const codeDir = path.join(projectDir, "code")
    if (!fs.existsSync(codeDir)) {
      fs.mkdirSync(codeDir, { recursive: true })
    }

    return projectDir
  }

  /**
   * Create initial README.md with metadata
   */
  private createReadme(projectDir: string, config: ResearchConfig) {
    const readmeContent = `---
title: Research on ${config.topic}
category: Consumer Product Research
tags:
  - ${config.topic}
  - Research
  - ${config.depth === "deep" ? "In-Depth" : "Standard"}
---

# ${config.topic}

## Quick Summary

Research project on **${config.topic}** initiated on ${new Date().toLocaleDateString()}.

${config.focus ? `**Focus**: ${config.focus}` : ""}
${config.style ? `**Style**: ${config.style}` : ""}

## Research Status

This research is currently being conducted by the AI research agent. Check back soon for detailed findings.

### Project Structure

- \`README.md\` - This file (project overview)
- \`01-*.md\` through \`0N-*.md\` - Detailed research documents
- \`code/\` - Code examples and samples (if applicable)

---

*Generated automatically by Research Wizard*
`

    fs.writeFileSync(path.join(projectDir, "README.md"), readmeContent)
  }

  /**
   * Initialize progress file for Research Portal sync
   */
  private initializeProgressFile(projectDir: string) {
    const progress: ProgressUpdate = {
      percentage: 0,
      currentTask: "Initializing",
      currentTaskDescription: "Setting up research project",
      completedTasks: [],
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min estimate
    }

    fs.writeFileSync(
      path.join(projectDir, ".research-progress.json"),
      JSON.stringify(progress, null, 2)
    )
  }

  /**
   * Update progress file (called by research agent)
   */
  private updateProgressFile(
    projectDir: string,
    percentage: number,
    currentTask: string,
    completedTasks: string[]
  ) {
    const progressFile = path.join(projectDir, ".research-progress.json")
    const progress: ProgressUpdate = {
      percentage,
      currentTask,
      currentTaskDescription: `Currently working on: ${currentTask}`,
      completedTasks,
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + (100 - percentage) * 10000).toISOString(),
    }

    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
  }

  /**
   * Get research status with agent activities
   */
  async getResearchStatus(researchId: string) {
    const research = this.db.getResearch(researchId)
    if (!research) return null

    const agents = this.db.getResearchAgents(researchId)
    const agentsWithActivities = agents.map(agent => ({
      ...agent,
      activities: this.db.getAgentActivities(agent.id),
    }))

    return {
      research,
      agents: agentsWithActivities,
    }
  }

  /**
   * Get all researches with summary
   */
  getAllResearches() {
    const researches = this.db.getAllResearches()
    const stats = this.db.getStats()

    return {
      researches,
      stats,
      recentActivities: this.db.getRecentActivities(20),
    }
  }

  /**
   * Utility: convert to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30)
  }

  close() {
    this.db.close()
  }
}
