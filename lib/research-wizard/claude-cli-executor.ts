/**
 * Claude CLI Executor
 * Simple wrapper to execute research using Claude CLI with MCP tools
 * 
 * Refactored to use shared constants (DRY principle)
 */

import { spawn } from 'child_process'
import { researchLogger } from '@/lib/logger'
import { DEPTH_INSTRUCTIONS, STYLE_INSTRUCTIONS, HTML_BASE_STYLES, CLI_DEFAULTS } from './constants'

interface ClaudeExecutorOptions {
  topic: string
  projectDir: string
  depth: 'quick' | 'standard' | 'deep'
  style: 'comprehensive' | 'comparing' | 'practical'
  maxTurns?: number
  model?: string
  onProgress?: (data: {
    percentage: number
    currentTask: string
    completedTasks: string[]
  }) => void
}

export class ClaudeCliExecutor {
  /**
   * Build prompt using shared constants (DRY principle)
   */
  private buildPrompt(topic: string, depth: string, style: string): string {
    return `You are a professional research agent conducting thorough research on a topic.

TOPIC: ${topic}
DEPTH: ${DEPTH_INSTRUCTIONS[depth as keyof typeof DEPTH_INSTRUCTIONS]}
STYLE: ${STYLE_INSTRUCTIONS[style as keyof typeof STYLE_INSTRUCTIONS]}

INSTRUCTIONS:

1. USE WEB RESEARCH TOOLS:
   - Use mcp__web-research-assistant__web_search to search for information
   - Use mcp__web-research-assistant__crawl_url to read detailed content from web pages
   - Use other MCP tools as needed for thorough research

2. CREATE HTML FILES:
   - Save your research as numbered HTML files in the current directory
   - Use the Write tool to create files
   - Name files like: 01-executive-summary.html, 02-detailed-analysis.html, 03-recommendations.html
   - Each file should be complete HTML documents with proper structure

3. HTML STRUCTURE:
   Each HTML file MUST use this exact template:

   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Your Title</title>
       <style>
           ${HTML_BASE_STYLES}
       </style>
   </head>
   <body>
       <h1>Your Title Here</h1>
       <!-- Your content here -->
   </body>
   </html>

4. RESEARCH STRUCTURE:
   Create HTML files covering:
   - Executive Summary (key findings and TL;DR)
   - Detailed Analysis (main research content with data and facts)
   - Comparisons (if applicable - use <table> for side-by-side analysis)
   - Recommendations (actionable advice and next steps)
   - Sources (list of URLs and references with proper <a> links)

5. WRITING STYLE:
   - Use clear, professional language
   - Include specific data, numbers, and facts
   - Cite sources with clickable links using <a href="url">source</a>
   - Use semantic HTML (headers, lists, tables, code blocks)
   - Be thorough and comprehensive

Begin your research now. Use MCP tools to gather information, then create well-organized HTML files with your findings.`
  }

  async execute(options: ClaudeExecutorOptions): Promise<void> {
    const { topic, projectDir, depth, style, maxTurns, model = CLI_DEFAULTS.DEFAULT_MODEL } = options
    const correlationId = Date.now().toString(36)

    researchLogger.info('Starting Claude CLI execution', {
      correlationId,
      topic,
      projectDir,
      depth,
      style,
      model,
      maxTurns,
    })

    // Build MCP config
    const mcpConfig = JSON.stringify({
      mcpServers: {
        'web-research-assistant': {
          type: 'stdio',
          command: 'uvx',
          args: ['web-research-assistant'],
        },
      },
    })

    // List of allowed MCP tools
    const allowedTools = [
      'mcp__web-research-assistant__web_search',
      'mcp__web-research-assistant__crawl_url',
      'mcp__web-research-assistant__package_info',
      'mcp__web-research-assistant__search_examples',
      'mcp__web-research-assistant__search_images',
      'mcp__web-research-assistant__package_search',
      'mcp__web-research-assistant__github_repo',
      'mcp__web-research-assistant__translate_error',
      'mcp__web-research-assistant__api_docs',
      'mcp__web-research-assistant__extract_data',
      'mcp__web-research-assistant__compare_tech',
      'mcp__web-research-assistant__get_changelog',
      'mcp__web-research-assistant__check_service_status',
      'Write',
      'Read',
    ].join(',')

    // Build prompt
    const prompt = this.buildPrompt(topic, depth, style)

    // Claude CLI command
    const args = [
      '-p', // Print mode (non-interactive)
      '--verbose', // Verbose output
      '--model', model,
      '--output-format', 'stream-json',
      '--mcp-config', mcpConfig,
      '--allowedTools', allowedTools,
      '--setting-sources', '', // Don't load any filesystem settings
    ]

    // Only add --max-turns if explicitly provided (avoid artificial limits)
    if (maxTurns !== undefined) {
      args.push('--max-turns', maxTurns.toString())
    }

    researchLogger.debug('Spawning Claude CLI', {
      correlationId,
      cwd: projectDir,
      args,
    })

    return new Promise((resolve, reject) => {
      // Spawn Claude CLI process
      const claude = spawn('claude', args, {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env, // OAuth token is in environment
      })

      // Send prompt via stdin
      claude.stdin.write(prompt)
      claude.stdin.end()

      let completedTasks: string[] = []
      let messageCount = 0

      // Handle stdout (JSON stream)
      claude.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n')

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const message = JSON.parse(line)
            messageCount++

            researchLogger.debug('Claude CLI message', {
              correlationId,
              type: message.type,
              messageCount,
            })

            // Handle different message types
            if (message.type === 'assistant') {
              const content = message.message?.content || []

              for (const block of content) {
                if (block.type === 'text') {
                  completedTasks.push('Generated content')
                  options.onProgress?.({
                    percentage: Math.min(85, 10 + messageCount * 5),
                    currentTask: 'Generating Research',
                    completedTasks,
                  })
                }
              }
            } else if (message.type === 'result') {
              researchLogger.info('Claude CLI completed', {
                correlationId,
                numTurns: message.num_turns,
                costUsd: message.total_cost_usd,
              })

              options.onProgress?.({
                percentage: 100,
                currentTask: 'Complete',
                completedTasks: [...completedTasks, 'Research completed'],
              })
            }
          } catch (err) {
            // Ignore JSON parse errors (some lines might not be JSON)
          }
        }
      })

      // Handle stderr
      claude.stderr.on('data', (data: Buffer) => {
        researchLogger.debug('Claude CLI stderr', {
          correlationId,
          stderr: data.toString(),
        })
      })

      // Handle process exit
      claude.on('close', (code) => {
        researchLogger.info('Claude CLI process exited', {
          correlationId,
          exitCode: code,
        })

        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Claude CLI exited with code ${code}`))
        }
      })

      // Handle errors
      claude.on('error', (err) => {
        researchLogger.error('Claude CLI process error', err, {
          correlationId,
        })
        reject(err)
      })
    })
  }
}
