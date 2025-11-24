/**
 * Research Manager
 * Orchestrates research projects using Claude Agent SDK and manages the workflow
 */

import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { ResearchDatabase } from "./research-wizard-db"
import { v4 as uuidv4 } from "uuid"
import { researchLogger } from "@/lib/logger"

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

    // Create research record in database
    this.db.createResearch(researchId, config.topic, projectDir)

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

    // Build config from research data
    const config: ResearchConfig = {
      topic: research.topic,
      depth: 'deep',
      style: 'comprehensive',
    }

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

      // Determine provider and model
      const provider = config.provider || "openai"
      const model = config.model || (provider === "openai" ? "gpt-5-mini" : "claude-sonnet-4-5")
      
      // Check for appropriate API key based on provider
      if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY environment variable is not set. Please authenticate at /auth")
      }
      if (provider === "openai" && !process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is not set. Please set it in .env.local")
      }
      if (provider === "google" && !process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY environment variable is not set. Please set it in .env.local")
      }

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
        env: {
          ...process.env,
          // Pass all provider API keys
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        },
        cwd: projectRoot, // Project root for mcp_agent.config.yaml
      })

      // Handle stdout (JSON messages)
      let buffer = ''
      let suppressNextLines = 0 // Track if we should suppress upcoming lines (for multi-line non-JSON)
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          // Check if this is a noisy line we should suppress
          const isToolSchemaNoise = 
            line.includes('"type": "function"') ||
            line.includes('"parameters": {') ||
            line.includes('"properties": {') ||
            line.includes('"title":') ||
            line.includes('"description":') ||
            line.includes('"required": [') ||
            line.match(/^\s*[{}\[\],]\s*$/) || // Just brackets/braces
            line.includes('"reasoning"') ||
            line.includes('"max_releases"')
          
          if (isToolSchemaNoise) {
            // Skip noisy tool schema lines
            continue
          }
          
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
   */
  private buildResearchPrompt(config: ResearchConfig, projectDir: string): string {
    const depthInstructions = {
      quick: "Provide a concise 15-20 minute research summary",
      standard: "Provide a comprehensive 45-60 minute research",
      deep: "Provide an exhaustive in-depth research with multiple perspectives",
    }

    const styleInstructions = {
      comprehensive: "Create detailed, well-structured documentation with multiple sections",
      comparing: "Focus on comparisons and contrasts between options",
      practical: "Focus on practical, actionable insights and implementation",
    }

    return `
You are a research agent tasked with conducting thorough research on a topic.

TOPIC: ${config.topic}
${config.focus ? `FOCUS: ${config.focus}` : ""}
DEPTH: ${depthInstructions[config.depth]}
STYLE: ${styleInstructions[config.style || "comprehensive"]}

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

      // Wrap content in HTML structure
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${section.title}</title>
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
        h3 { color: #3a3a3a; margin-top: 1.5rem; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
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
