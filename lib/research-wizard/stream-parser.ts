/**
 * Stream Parser
 * Handles parsing of stdout/stderr from the Python research agent
 * 
 * Extracted from research-manager.ts to follow Single Responsibility Principle.
 * This module is responsible for:
 * - Parsing JSON messages from stdout
 * - Detecting and extracting tool calls
 * - Capturing tool results
 * - Buffering multi-line results
 */

import { PROGRESS_LIMITS } from './constants'

// Types for parsed data
export interface ToolCall {
  tool: string
  args: Record<string, string>
}

export interface ParsedMessage {
  type: string
  [key: string]: unknown
}

// Activity logging callback type
export type ActivityLogger = (
  type: string,
  message: string,
  data?: Record<string, unknown>
) => void

/**
 * State machine for tracking streaming tool call parsing
 */
interface ParserState {
  lastToolName: string | null
  pendingToolCall: ToolCall | null
  inToolsCallParams: boolean
  inArguments: boolean
  lastToolResultId: string | null
  resultBuffer: string | null
  resultToolName: string | null
}

/**
 * Creates initial parser state
 */
export function createParserState(): ParserState {
  return {
    lastToolName: null,
    pendingToolCall: null,
    inToolsCallParams: false,
    inArguments: false,
    lastToolResultId: null,
    resultBuffer: null,
    resultToolName: null,
  }
}

/**
 * Extracts a quoted string value using proper escape handling
 */
function extractQuotedValue(afterKey: string): string | null {
  if (!afterKey.startsWith('"')) return null
  
  let value = ''
  let i = 1 // Skip opening quote
  let escaped = false
  
  while (i < afterKey.length) {
    const char = afterKey[i]
    if (escaped) {
      value += char
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else if (char === '"') {
      break // End of string
    } else {
      value += char
    }
    i++
  }
  
  return value || null
}

/**
 * Checks if a line is noise from tool schemas
 */
export function isToolSchemaNoise(line: string): boolean {
  return (
    line.includes('"type": "function"') ||
    line.includes('"parameters": {') ||
    line.includes('"properties": {') ||
    line.includes('"inputSchema"') ||
    line.includes('"outputSchema"') ||
    line.includes('"required": [') ||
    /^\s*[{}\[\],]\s*$/.test(line) ||
    line.includes('"max_releases"') ||
    line.includes('"default":') ||
    (line.includes('"type":') && 
     !line.includes('"type": "tool_result"') && 
     !line.includes('"type": "tool_use"'))
  )
}

/**
 * Parses a single line for tool call detection (OpenAI and Anthropic formats)
 */
export function parseToolCallLine(
  line: string,
  state: ParserState
): { toolCall: ToolCall | null; stateUpdates: Partial<ParserState> } {
  const stateUpdates: Partial<ParserState> = {}
  
  // Pattern 1: OpenAI format - "tool_name": "xxx"
  const toolNameMatch = line.match(/"tool_name":\s*"([a-zA-Z0-9_.-]+)"/)
  if (toolNameMatch) {
    const toolName = toolNameMatch[1]
    stateUpdates.lastToolName = toolName
    stateUpdates.pendingToolCall = { tool: toolName, args: {} }
    stateUpdates.inToolsCallParams = true
    return { toolCall: null, stateUpdates }
  }
  
  // Pattern 2: Anthropic format - detect tools/call then "name"
  if (line.includes('"method": "tools/call"')) {
    stateUpdates.inToolsCallParams = true
    return { toolCall: null, stateUpdates }
  }
  
  // Capture tool name from "name": "xxx" inside params (Anthropic format)
  if (state.inToolsCallParams && !state.pendingToolCall) {
    const nameMatch = line.match(/^\s*"name":\s*"([a-zA-Z0-9_.-]+)"/)
    if (nameMatch && !nameMatch[1].includes('/')) {
      const toolName = nameMatch[1]
      stateUpdates.lastToolName = toolName
      stateUpdates.pendingToolCall = { tool: toolName, args: {} }
      return { toolCall: null, stateUpdates }
    }
  }
  
  // Detect "arguments": { block
  if (state.pendingToolCall && line.includes('"arguments":')) {
    stateUpdates.inArguments = true
  }
  
  return { toolCall: null, stateUpdates }
}

/**
 * Extracts arguments from a line for a pending tool call
 */
export function extractToolArguments(
  line: string,
  pendingToolCall: ToolCall
): Partial<Record<string, string>> {
  const args: Partial<Record<string, string>> = {}
  
  // Extract "query"
  if (line.includes('"query":')) {
    const queryStartIdx = line.indexOf('"query":')
    const afterQuery = line.substring(queryStartIdx + 8).trim()
    const value = extractQuotedValue(afterQuery)
    if (value) args.query = value
  }
  
  // Extract "url"
  const urlMatch = line.match(/"url":\s*"([^"]+)"/)
  if (urlMatch) args.url = urlMatch[1]
  
  // Extract "path"
  const pathMatch = line.match(/"path":\s*"([^"]+)"/)
  if (pathMatch) args.path = pathMatch[1]
  
  // Extract "reasoning" (truncated)
  const reasoningMatch = line.match(/"reasoning":\s*"([^"]*(?:\\.[^"]*)*)"/)
  if (reasoningMatch) args.reasoning = reasoningMatch[1].substring(0, 100)
  
  // Extract "title"
  if (line.includes('"title":') && !pendingToolCall.args.title) {
    const titleStartIdx = line.indexOf('"title":')
    const afterTitle = line.substring(titleStartIdx + 8).trim()
    const value = extractQuotedValue(afterTitle)
    if (value) args.title = value
  }
  
  // Extract "description" (truncated)
  if (line.includes('"description":') && !pendingToolCall.args.description) {
    const descMatch = line.match(/"description":\s*"([^"]*(?:\\.[^"]*)*)"/)
    if (descMatch) args.description = descMatch[1].substring(0, 100)
  }
  
  // Extract "category"
  const categoryMatch = line.match(/"category":\s*"([^"]+)"/)
  if (categoryMatch && !pendingToolCall.args.category) {
    args.category = categoryMatch[1]
  }
  
  // Extract "percentage"
  const percentMatch = line.match(/"percentage":\s*(\d+)/)
  if (percentMatch) args.percentage = percentMatch[1]
  
  // Extract "current_task"
  const taskMatch = line.match(/"current_task":\s*"([^"]+)"/)
  if (taskMatch) args.current_task = taskMatch[1]
  
  // Extract "repo"
  const repoMatch = line.match(/"repo":\s*"([^"]+)"/)
  if (repoMatch) args.repo = repoMatch[1]
  
  // Extract "filePath"
  const filePathMatch = line.match(/"filePath":\s*"([^"]+)"/)
  if (filePathMatch && !pendingToolCall.args.filePath) {
    args.filePath = filePathMatch[1]
  }
  
  return args
}

/**
 * Checks if we should emit a tool call based on line content
 */
export function shouldEmitToolCall(
  line: string,
  state: ParserState
): boolean {
  if (!state.pendingToolCall) return false
  
  const hasToolAndMethod = line.includes('"method": "tools/call"') && Boolean(state.pendingToolCall.tool)
  const isEndOfArguments = state.inArguments && (/^\s*}\s*$/.test(line) || line.includes('"meta":'))
  
  return hasToolAndMethod || isEndOfArguments
}

/**
 * Builds a human-readable description for a tool call
 */
export function buildToolDescription(toolCall: ToolCall): string {
  const { tool, args } = toolCall
  
  if (args.query) {
    return `${tool}: "${args.query}"`
  }
  if (args.url) {
    return `${tool}: ${args.url}`
  }
  if (args.path) {
    return `${tool}: ${args.path}`
  }
  if (args.filePath) {
    return `${tool}: ${args.filePath}`
  }
  if (args.title) {
    const extra = args.category ? ` [${args.category}]` : ''
    return `${tool}: "${args.title}"${extra}`
  }
  if (args.current_task) {
    return `${tool}: ${args.percentage || 0}% - ${args.current_task}`
  }
  if (args.repo) {
    return `${tool}: ${args.repo}`
  }
  
  return tool
}

export interface ResultParseResult {
  resultText: string | null
  isComplete: boolean
  startBuffer: boolean
  bufferContent: string | null
}

/**
 * Processes a result line and returns the cleaned result text
 */
export function processResultLine(
  line: string,
  state: ParserState
): ResultParseResult {
  const resultStartMatch = line.match(/"result":\s*"(.*)/)
  if (!resultStartMatch || !state.lastToolName) {
    return { resultText: null, isComplete: false, startBuffer: false, bufferContent: null }
  }
  
  const afterQuote = resultStartMatch[1]
  let resultContent = ''
  let isComplete = false
  let i = 0
  
  while (i < afterQuote.length) {
    const char = afterQuote[i]
    if (char === '\\' && i + 1 < afterQuote.length) {
      resultContent += char + afterQuote[i + 1]
      i += 2
    } else if (char === '"') {
      isComplete = true
      break
    } else {
      resultContent += char
      i++
    }
  }
  
  if (isComplete) {
    const maxLen = state.lastToolName === 'read_file' 
      ? PROGRESS_LIMITS.READ_FILE_MAX_LENGTH 
      : PROGRESS_LIMITS.RESULT_MAX_LENGTH
      
    let resultText = resultContent
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .substring(0, maxLen)
    
    if (resultText.length >= maxLen) {
      resultText += '...'
    }
    
    return { resultText, isComplete: true, startBuffer: false, bufferContent: null }
  }
  
  return { resultText: null, isComplete: false, startBuffer: true, bufferContent: afterQuote }
}

/**
 * Completes a multi-line result buffer
 */
export function completeResultBuffer(
  buffer: string,
  toolName: string | null
): string | null {
  const maxLen = toolName === 'read_file' 
    ? PROGRESS_LIMITS.READ_FILE_MAX_LENGTH 
    : PROGRESS_LIMITS.RESULT_MAX_LENGTH
    
  let resultText = buffer
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/"\s*,?\s*$/, '')
    .substring(0, maxLen)
  
  if (resultText.length >= maxLen) {
    resultText += '...'
  }
  
  return resultText.length > 5 ? resultText : null
}

/**
 * Attempts to parse a line as JSON message
 */
export function tryParseJsonMessage(line: string): ParsedMessage | null {
  try {
    const message = JSON.parse(line)
    if (message && typeof message.type === 'string') {
      return message as ParsedMessage
    }
    return null
  } catch {
    return null
  }
}
