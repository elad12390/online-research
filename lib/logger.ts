/**
 * Structured Logger
 * Implements logging best practices with proper log levels, context, and JSON formatting
 */

type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL"

interface LogContext {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  correlationId?: string
  userId?: string
  requestId?: string
  duration?: number
  [key: string]: any
}

class Logger {
  private serviceName: string
  private enableDebug: boolean
  private logBuffer: LogContext[] = []

  constructor(serviceName: string, enableDebug: boolean = false) {
    this.serviceName = serviceName
    this.enableDebug = enableDebug
  }

  private createContext(
    level: LogLevel,
    message: string,
    extra: Record<string, any> = {}
  ): LogContext {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      ...extra,
    }
  }

  private formatLog(context: LogContext): string {
    // For structured logging, output JSON
    return JSON.stringify(context)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"]
    const currentIndex = this.enableDebug ? 0 : 2 // INFO level default
    return levels.indexOf(level) >= currentIndex
  }

  trace(message: string, context: Record<string, any> = {}) {
    if (this.shouldLog("TRACE")) {
      const logContext = this.createContext("TRACE", message, context)
      console.log(this.formatLog(logContext))
      this.logBuffer.push(logContext)
    }
  }

  debug(message: string, context: Record<string, any> = {}) {
    if (this.shouldLog("DEBUG")) {
      const logContext = this.createContext("DEBUG", message, context)
      console.log(this.formatLog(logContext))
      this.logBuffer.push(logContext)
    }
  }

  info(message: string, context: Record<string, any> = {}) {
    if (this.shouldLog("INFO")) {
      const logContext = this.createContext("INFO", message, context)
      console.log(this.formatLog(logContext))
      this.logBuffer.push(logContext)
    }
  }

  warn(message: string, context: Record<string, any> = {}) {
    if (this.shouldLog("WARN")) {
      const logContext = this.createContext("WARN", message, context)
      console.warn(this.formatLog(logContext))
      this.logBuffer.push(logContext)
    }
  }

  error(message: string, error?: Error | unknown, context: Record<string, any> = {}) {
    if (this.shouldLog("ERROR")) {
      const errorContext = {
        ...context,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : undefined,
      }
      const logContext = this.createContext("ERROR", message, errorContext)
      console.error(this.formatLog(logContext))
      this.logBuffer.push(logContext)
    }
  }

  fatal(message: string, error?: Error | unknown, context: Record<string, any> = {}) {
    const errorContext = {
      ...context,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : undefined,
    }
    const logContext = this.createContext("FATAL", message, errorContext)
    console.error(this.formatLog(logContext))
    this.logBuffer.push(logContext)
  }

  /**
   * Canonical log line for request completion
   * Contains all essential information about a request
   */
  logRequest(context: {
    correlationId: string
    researchId: string
    topic: string
    duration_ms: number
    status: "success" | "failed"
    agent_count: number
    files_created: number
    error?: string
  }) {
    const requestLog = this.createContext("INFO", "Research request completed", {
      ...context,
      canonical_request: true,
    })
    console.log(this.formatLog(requestLog))
    this.logBuffer.push(requestLog)
  }

  /**
   * Get all logs from buffer
   */
  getBuffer(): LogContext[] {
    return this.logBuffer
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.logBuffer = []
  }
}

import { config } from '@/lib/config'

// Create singleton instances for different services
export const researchLogger = new Logger("research-wizard", config.debug)
export const opencodeLogger = new Logger("opencode", config.debug)
export const databaseLogger = new Logger("database", config.debug)

export default Logger
