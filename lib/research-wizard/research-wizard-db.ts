/**
 * Research Wizard Database
 * Small SQLite-based database for tracking research projects and agent activities
 */

import Database from "better-sqlite3"
import * as path from "path"
import * as fs from "fs"

export interface Research {
  id: string
  topic: string
  status: "pending" | "in_progress" | "completed" | "failed"
  createdAt: number
  completedAt?: number
  projectDir: string
  totalAgents: number
  provider?: "anthropic" | "openai" | "google"
  model?: string
}

export interface Agent {
  id: string
  researchId: string
  name: string
  status: "pending" | "running" | "completed" | "failed"
  startedAt?: number
  completedAt?: number
  taskOutput?: string
  errorMessage?: string
}

export interface Activity {
  id: string
  agentId: string
  timestamp: number
  action: string
  description: string
  metadata?: Record<string, any>
}

export class ResearchDatabase {
  private db: Database.Database

  constructor(dbPath: string = "./research-wizard.db") {
    // Ensure directory exists
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(dbPath)
    this.db.pragma("journal_mode = WAL")
    this.initializeTables()
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS researches (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        completedAt INTEGER,
        projectDir TEXT NOT NULL UNIQUE,
        totalAgents INTEGER NOT NULL DEFAULT 0,
        provider TEXT,
        model TEXT
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        researchId TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        startedAt INTEGER,
        completedAt INTEGER,
        taskOutput TEXT,
        errorMessage TEXT,
        FOREIGN KEY (researchId) REFERENCES researches(id)
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (agentId) REFERENCES agents(id)
      );

      CREATE INDEX IF NOT EXISTS idx_agents_research 
        ON agents(researchId);
      CREATE INDEX IF NOT EXISTS idx_activities_agent 
        ON activities(agentId);
      CREATE INDEX IF NOT EXISTS idx_activities_timestamp 
        ON activities(timestamp DESC);
    `)
    
    // Migration: Add provider and model columns if they don't exist (for existing databases)
    this.migrateAddProviderColumns()
  }
  
  private migrateAddProviderColumns() {
    try {
      // Check if columns exist by querying pragma
      const columns = this.db.prepare("PRAGMA table_info(researches)").all() as any[]
      const columnNames = columns.map(c => c.name)
      
      if (!columnNames.includes('provider')) {
        this.db.exec("ALTER TABLE researches ADD COLUMN provider TEXT")
      }
      if (!columnNames.includes('model')) {
        this.db.exec("ALTER TABLE researches ADD COLUMN model TEXT")
      }
    } catch (err) {
      // Columns might already exist, ignore error
      console.error('[ResearchDatabase] Migration error (may be safe to ignore):', err)
    }
  }

  // Research operations
  createResearch(
    id: string,
    topic: string,
    projectDir: string,
    provider?: "anthropic" | "openai" | "google",
    model?: string
  ): Research {
    const now = Date.now()
    const research: Research = {
      id,
      topic,
      status: "pending",
      createdAt: now,
      projectDir,
      totalAgents: 0,
      provider,
      model,
    }

    const stmt = this.db.prepare(`
      INSERT INTO researches (id, topic, status, createdAt, projectDir, totalAgents, provider, model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      research.id,
      research.topic,
      research.status,
      research.createdAt,
      research.projectDir,
      research.totalAgents,
      research.provider || null,
      research.model || null
    )

    return research
  }

  getResearch(id: string): Research | null {
    const stmt = this.db.prepare("SELECT * FROM researches WHERE id = ?")
    return (stmt.get(id) as Research | undefined) || null
  }

  getAllResearches(): Research[] {
    const stmt = this.db.prepare("SELECT * FROM researches ORDER BY createdAt DESC")
    return stmt.all() as Research[]
  }

  deleteResearch(id: string): void {
    // Delete activities linked to agents of this research
    this.db.prepare(`
      DELETE FROM activities 
      WHERE agentId IN (SELECT id FROM agents WHERE researchId = ?)
    `).run(id)

    // Delete agents linked to this research
    this.db.prepare("DELETE FROM agents WHERE researchId = ?").run(id)

    // Delete the research itself
    this.db.prepare("DELETE FROM researches WHERE id = ?").run(id)
  }

  updateResearchStatus(
    id: string,
    status: Research["status"],
    completedAt?: number
  ): void {
    const stmt = this.db.prepare(
      "UPDATE researches SET status = ?, completedAt = ? WHERE id = ?"
    )
    stmt.run(status, completedAt || null, id)
  }

  // Agent operations
  createAgent(researchId: string, name: string): Agent {
    const id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const agent: Agent = {
      id,
      researchId,
      name,
      status: "pending",
    }

    const stmt = this.db.prepare(`
      INSERT INTO agents (id, researchId, name, status)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run(agent.id, agent.researchId, agent.name, agent.status)

    // Update total agents count
    this.db.prepare(
      "UPDATE researches SET totalAgents = totalAgents + 1 WHERE id = ?"
    ).run(researchId)

    return agent
  }

  getAgent(id: string): Agent | null {
    const stmt = this.db.prepare("SELECT * FROM agents WHERE id = ?")
    return (stmt.get(id) as Agent | undefined) || null
  }

  getResearchAgents(researchId: string): Agent[] {
    const stmt = this.db.prepare(
      "SELECT * FROM agents WHERE researchId = ? ORDER BY startedAt DESC"
    )
    return stmt.all(researchId) as Agent[]
  }

  updateAgentStatus(
    id: string,
    status: Agent["status"],
    output?: string,
    error?: string
  ): void {
    const now = status === "completed" || status === "failed" ? Date.now() : null
    const stmt = this.db.prepare(`
      UPDATE agents 
      SET status = ?, startedAt = COALESCE(startedAt, ?), completedAt = ?, 
          taskOutput = ?, errorMessage = ?
      WHERE id = ?
    `)
    stmt.run(status, now, now, output || null, error || null, id)
  }

  // Activity operations
  logActivity(
    agentId: string,
    action: string,
    description: string,
    metadata?: Record<string, any>
  ): Activity {
    const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO activities (id, agentId, timestamp, action, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      agentId,
      timestamp,
      action,
      description,
      metadata ? JSON.stringify(metadata) : null
    )

    return {
      id,
      agentId,
      timestamp,
      action,
      description,
      metadata,
    }
  }

  getAgentActivities(agentId: string): Activity[] {
    const stmt = this.db.prepare(
      "SELECT id, agentId, timestamp, action, description, metadata FROM activities WHERE agentId = ? ORDER BY timestamp DESC"
    )
    const rows = stmt.all(agentId) as any[]
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }))
  }

  getRecentActivities(limit: number = 50): Activity[] {
    const stmt = this.db.prepare(
      "SELECT id, agentId, timestamp, action, description, metadata FROM activities ORDER BY timestamp DESC LIMIT ?"
    )
    const rows = stmt.all(limit) as any[]
    return rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }))
  }

  // Statistics
  getStats() {
    const researches = this.db.prepare(
      "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM researches"
    ).get() as any

    const agents = this.db.prepare(
      "SELECT COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM agents"
    ).get() as any

    const activities = this.db.prepare(
      "SELECT COUNT(*) as count FROM activities"
    ).get() as any

    return {
      researches: {
        total: researches.count,
        completed: researches.completed || 0,
      },
      agents: {
        total: agents.count,
        completed: agents.completed || 0,
      },
      activities: activities.count,
    }
  }

  close() {
    this.db.close()
  }
}
