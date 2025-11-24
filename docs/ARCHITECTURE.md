# Research Portal Architecture Documentation

## Overview

The Research Portal is a sophisticated web application built with Next.js (React 18) and TypeScript that enables users to browse research projects and deploy autonomous AI agents to conduct research. It implements a two-system architecture: the **Research Portal** (file-based project browser) and the **Research Wizard** (database-driven AI research orchestration).

**Version:** 2.0.0  
**Runtime:** Node.js with Next.js 14  
**Database:** SQLite with better-sqlite3  
**State Management:** Zustand  

---

## 1. Technology Stack

### Core Framework
- **Next.js 14** - Full-stack React framework with App Router
- **React 18.2** - UI components and React Server Components
- **TypeScript 5.3** - Type-safe development
- **Node.js** - Runtime environment

### State Management & Data Flow
- **Zustand 4.4** - Lightweight global state management with localStorage persistence
- **better-sqlite3** - Synchronous SQLite database for research tracking
- **Node.js fs** - Filesystem operations for project storage

### UI Framework & Styling
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **CSS Variables** - Notion-style color system
- **react-resizable-panels** - Draggable layout panels
- **@dnd-kit** - Drag-and-drop for project reordering

### Markdown & Content
- **marked 17.0** - Markdown parsing and rendering
- **dompurify** - HTML sanitization for security
- **isomorphic-dompurify** - SSR-safe HTML sanitization

### AI & Research Integration
- **@anthropic-ai/sdk** - Anthropic Claude API integration
- **@anthropic-ai/claude-agent-sdk** - Research agent orchestration
- **@modelcontextprotocol/sdk** - MCP (Model Context Protocol) implementation
- **mcp-agent** (Python) - External agent process orchestration

### File System & Watching
- **chokidar** - File system watching for real-time updates
- **node-pty** - Pseudo-terminal for agent process management
- **ws** - WebSocket for real-time communication

### Development & Build
- **typescript** - Type checking
- **autoprefixer** - CSS vendor prefixes
- **postcss** - CSS processing
- **puppeteer** - Screenshot and rendering (optional utilities)

---

## 2. Folder Structure & Organization

```
online-research/
├── app/                          # Next.js App Router (all routes)
│   ├── api/                      # REST API endpoints
│   │   ├── auth/                 # Authentication routes
│   │   │   ├── claude/           # Claude auth flow
│   │   │   ├── set-key/          # Manual token setting
│   │   │   └── status/           # Auth status check
│   │   ├── health/               # Server health check
│   │   ├── mcp/                  # Model Context Protocol endpoint
│   │   ├── projects/             # Project management API
│   │   │   ├── route.ts          # GET all projects, POST new
│   │   │   ├── [id]/             # Specific project routes
│   │   │   │   ├── route.ts      # Project details
│   │   │   │   ├── files/        # File operations
│   │   │   │   │   └── [filename]/
│   │   │   │   │       └── route.ts
│   │   │   │   └── progress/     # Progress tracking
│   │   │   └── route.ts
│   │   └── research/             # Research Wizard API
│   │       ├── route.ts          # Create/list research
│   │       └── [id]/
│   │           ├── route.ts      # Get research details
│   │           ├── message/      # Chat message endpoint
│   │           ├── resume/       # Resume research
│   │           └── stop/         # Stop research
│   ├── auth/                     # Authentication page (/auth)
│   ├── projects/                 # Project browsing
│   │   └── [projectId]/
│   │       ├── page.tsx          # Project overview
│   │       └── files/
│   │           └── [filename]/
│   │               └── page.tsx  # File viewer
│   ├── research/                 # Research Wizard UI
│   │   └── [id]/
│   │       └── page.tsx          # Research chat interface
│   ├── wizard/                   # Research Wizard form
│   │   └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── Sidebar.tsx               # Project navigation sidebar
│   ├── ProjectTree.tsx           # Project file tree
│   ├── DocumentView.tsx          # File content display
│   ├── DocumentHeader.tsx        # File header with tabs
│   ├── DocumentTabs.tsx          # File tab switcher
│   ├── WelcomeScreen.tsx         # Empty state screen
│   ├── SearchBox.tsx             # Project search
│   ├── CommandPalette.tsx        # Keyboard command menu (Cmd+K)
│   ├── ProgressPanel.tsx         # Research progress display
│   ├── ProjectMetadata.tsx       # Project info panel
│   ├── ResearchWizardForm.tsx    # Research creation form
│   ├── ResearchSidePanel.tsx     # Right sidebar for research
│   └── ResearchSidePanel.css     # Component-specific styles
│
├── lib/                          # Shared library code
│   ├── types.ts                  # TypeScript interfaces
│   ├── store.ts                  # Zustand global state
│   ├── logger.ts                 # Logging utilities
│   ├── claude-auth.ts            # Authentication utilities
│   │
│   ├── server/                   # Server-side utilities
│   │   ├── file-scanner.ts       # Project discovery and metadata
│   │   ├── file-watcher.ts       # Real-time file change detection
│   │   └── markdown-parser.ts    # Markdown parsing and extraction
│   │
│   └── research-wizard/          # AI Research Wizard
│       ├── research-manager.ts   # Research orchestration
│       ├── research-wizard-db.ts # SQLite database layer
│       ├── research-wizard-cli.ts# CLI integration
│       └── claude-cli-executor.ts# Claude CLI execution
│
├── mcp-servers/                  # MCP Server implementations
│   └── filesystem-server.py      # Filesystem MCP server (Python)
│
├── scripts/                      # Utility scripts
│   ├── research-agent.py         # Main AI research agent
│   ├── research-prompt.txt       # Agent prompt template
│   ├── research-instruction.txt  # Research instructions
│   ├── simulate-agent.py         # Agent simulator
│   └── convert-md-to-html.ts     # Markdown to HTML converter
│
├── research-projects/            # Storage for research projects (file-based)
│   └── [project-id]/
│       ├── README.md
│       ├── *.md or *.html files
│       ├── metadata.json         # Project metadata
│       └── .research-progress.json # Progress tracking
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # This file
│   └── MCP-SERVER.md            # MCP Server documentation
│
├── public/                       # Static assets (if any)
├── .next/                        # Next.js build output
├── .env                          # Environment secrets
├── .env.local                    # Local overrides
├── .env.example                  # Configuration template
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── mcp_agent.config.yaml         # MCP Agent configuration
├── package.json                  # Dependencies
├── README.md                      # User documentation
├── AGENTS.md                      # Agent integration guide
├── SETUP.md                       # Setup instructions
└── START.md                       # Quick start guide
```

---

## 3. Data Flow & Architecture Patterns

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Research Portal (Next.js)                 │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Frontend (React Components)              │  │
│  │  ┌─────────────┬──────────────┬──────────────────────────┐│  │
│  │  │ Sidebar     │ DocumentView │  ResearchSidePanel       ││  │
│  │  │ ProjectTree │ DocumentTabs │  ProgressPanel          ││  │
│  │  │ SearchBox   │ WelcomeScreen│  CommandPalette         ││  │
│  │  └─────────────┴──────────────┴──────────────────────────┘│  │
│  │                      ▲          ▲                          │  │
│  │                      │ Zustand  │                          │  │
│  │                      │ Store    │                          │  │
│  │              ┌───────┴──────────┴───────┐                 │  │
│  │              │   useStore (Global       │                 │  │
│  │              │   State Management)      │                 │  │
│  │              └───────┬──────────────────┘                 │  │
│  └───────────────────────┼────────────────────────────────────┘  │
│                          │                                        │
│              ┌───────────┴───────────┐                            │
│              ▼                       ▼                            │
│   ┌──────────────────┐    ┌──────────────────┐                  │
│   │   REST API       │    │   WebSocket      │                  │
│   │   Endpoints      │    │   Connection     │                  │
│   └────────┬─────────┘    └──────────────────┘                  │
│            │                                                      │
└────────────┼──────────────────────────────────────────────────────┘
             │
     ┌───────┴────────────────────────────┬──────────────┐
     ▼                                    ▼              ▼
┌─────────────────┐      ┌──────────────────────┐  ┌───────────┐
│ Research Portal │      │  Research Wizard     │  │ MCP       │
│ (File-based)    │      │  (Database-driven)   │  │ Server    │
│                 │      │                      │  │           │
│ /api/projects   │      │ /api/research        │  │ /api/mcp  │
│                 │      │ SQLite Database      │  │           │
│ Filesystem      │      │ ResearchManager      │  │ Tools:    │
│ Scanning        │      │ Agent Orchestration  │  │ - read    │
│ File Watching   │      │                      │  │ - write   │
│ Markdown Parse  │      │ ┌────────────────┐  │  │ - list    │
│                 │      │ │ researches     │  │  │           │
└─────────────────┘      │ │ agents         │  │  └───────────┘
                         │ │ activities     │  │
                         │ └────────────────┘  │
                         │                      │
                         │ Python mcp-agent    │
                         │ Process (subprocess)│
                         └──────────────────────┘
```

### 3.2 Request Flow for Project Browsing

```
User Navigation
      ▼
Sidebar/Project Selection
      ▼
Client-side Zustand Store Update
      ▼
Next.js Navigation Router
      ▼
Route: /projects/[projectId]/files/[filename]
      ▼
DocumentView Component
      ▼
Fetch: GET /api/projects/[id]/files/[filename]
      ▼
API Handler → file-scanner.getProjectFilePath()
      ▼
Read from RESEARCH_DIR/projectId/filename
      ▼
Parse Markdown (if .md)
      ▼
Render HTML
      ▼
Client displays DocumentView with Content
```

### 3.3 Request Flow for Research Creation

```
User Submits Research Form
      ▼
ResearchWizardForm POST
      ▼
POST /api/research
      ▼
ResearchManager.startResearch()
      ▼
Generate UUID for research
      ▼
Create project directory
      ▼
Create SQLite record
      ▼
Spawn Python mcp-agent process
      ▼
Return researchId to client
      ▼
Navigate to /research/[id]
      ▼
Poll GET /api/research/[id] for updates
      ▼
Agents → Activities → Activities log
      ▼
WebSocket updates to client
      ▼
Live progress display in Research view
```

---

## 4. Core Module Dependencies

### 4.1 State Management (lib/store.ts)

**Purpose:** Global state management using Zustand with localStorage persistence

**Key State:**
- `projects` - Map of all discovered projects
- `currentProjectId` - Currently selected project
- `currentFileName` - Currently viewed file
- `expandedProjects` - Which projects are expanded in sidebar
- `projectOrder` - Custom drag-sorted project order
- `favorites` - Starred files (projectId:fileName)
- `recent` - Recently viewed files with timestamps
- `wsConnected` - WebSocket connection status
- `commandPaletteOpen` - Command menu visibility

**Persistence:**
- Saves to localStorage keys: `portal-*`
- Hydrated on app mount
- Survives page refreshes

**Actions:**
- `setProjects()` - Update all projects
- `setCurrentProject()` / `setCurrentFile()` - Navigation
- `toggleFavorite()` / `addToRecent()` - User interactions
- `setProjectOrder()` / `setExpandedProjects()` - UI state

### 4.2 File Scanning (lib/server/file-scanner.ts)

**Purpose:** Discovers projects in RESEARCH_DIR and extracts metadata

**Key Functions:**

```typescript
scanResearchProjects()
  → Scans RESEARCH_DIR
  → Finds directories with README.md
  → Extracts metadata from metadata.json or README
  → Returns Record<projectId, ResearchProject>

getProject(projectId)
  → Returns single project details

getProjectFilePath(projectId, fileName)
  → Security: Prevents directory traversal
  → Returns absolute path to file

deleteProject(projectId)
  → Recursively deletes project directory
```

**Metadata Resolution Order:**
1. `metadata.json` → `title` field (highest priority)
2. `README.md` → YAML frontmatter `title`
3. `README.md` → First `# Heading`
4. Folder name (fallback)

### 4.3 Research Database (lib/research-wizard/research-wizard-db.ts)

**Purpose:** SQLite database for tracking research sessions and agent activities

**Schema:**

```sql
researches (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status: "pending" | "in_progress" | "completed" | "failed",
  createdAt INTEGER,
  completedAt INTEGER,
  projectDir TEXT UNIQUE,
  totalAgents INTEGER
)

agents (
  id TEXT PRIMARY KEY,
  researchId TEXT FOREIGN KEY,
  name TEXT,
  status: "pending" | "running" | "completed" | "failed",
  startedAt INTEGER,
  completedAt INTEGER,
  taskOutput TEXT,
  errorMessage TEXT
)

activities (
  id TEXT PRIMARY KEY,
  agentId TEXT FOREIGN KEY,
  timestamp INTEGER,
  action TEXT,
  description TEXT,
  metadata TEXT (JSON)
)
```

**Key Operations:**
- `createResearch()` - Create new research session
- `updateResearchStatus()` - Track progress
- `getResearchAgents()` - List agents for research
- `logActivity()` - Record agent actions
- `getAllResearches()` - List all sessions

### 4.4 Research Manager (lib/research-wizard/research-manager.ts)

**Purpose:** Orchestrates AI research workflows

**Key Methods:**

```typescript
startResearch(config)
  → Create project directory
  → Initialize database records
  → Spawn Python mcp-agent process
  → Return researchId

resumeResearch(researchId)
  → Kill any existing agents
  → Respawn research agent
  → Continue from last checkpoint

stopResearch(researchId)
  → Send kill signal to agent
  → Update status to "cancelled"

addMessage(researchId, message)
  → Add user message to conversation
  → Trigger agent response

deleteResearch(researchId)
  → Delete database records
  → Remove project directory
```

**Subprocess Management:**
- Spawns Node.js child process
- Manages lifecycle (start, pause, resume, stop)
- Captures stdout/stderr
- Handles process cleanup

---

## 5. Database Schemas

### 5.1 Research Wizard Database (SQLite)

**File Location:** `$RESEARCH_DIR/research-wizard.db` or `./research-wizard.db`

**Tables:**

#### researches
```typescript
{
  id: string;                    // UUID
  topic: string;                 // Research topic
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: number;            // Unix timestamp
  completedAt?: number;         // Unix timestamp
  projectDir: string;           // Absolute path to project
  totalAgents: number;          // Number of agents
}
```

#### agents
```typescript
{
  id: string;                    // UUID
  researchId: string;           // Foreign key
  name: string;                 // Agent name
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: number;
  completedAt?: number;
  taskOutput?: string;
  errorMessage?: string;
}
```

#### activities
```typescript
{
  id: string;                    // UUID
  agentId: string;              // Foreign key
  timestamp: number;            // Unix timestamp
  action: string;               // "research_started", "tool_call", etc.
  description: string;
  metadata?: Record<string, any>; // JSON metadata
}
```

**Indexes:**
- `idx_agents_research` - On agents(researchId)
- `idx_activities_agent` - On activities(agentId)
- `idx_activities_timestamp` - On activities(timestamp DESC)

### 5.2 Project Metadata Files (JSON)

**Location:** `$RESEARCH_DIR/[projectId]/metadata.json`

```typescript
{
  title: string;                 // Display name
  description?: string;          // Brief description
  category?: string;             // Research category
  tags?: string[];              // Search tags
  summary?: string;             // Executive summary
  [key: string]: any;           // Other custom fields
}
```

### 5.3 Research Progress Files (JSON)

**Location:** `$RESEARCH_DIR/[projectId]/.research-progress.json`

```typescript
{
  percentage: number;            // 0-100
  currentTask: string;           // Current task name
  currentTaskDescription: string;
  completedTasks: string[];     // List of completed tasks
  startedAt: string;            // ISO datetime
  estimatedCompletion: string;  // ISO datetime
  updatedAt: string;            // ISO datetime
}
```

---

## 6. API Architecture

### 6.1 REST API Endpoints

#### Projects API

**GET /api/projects**
- Returns all discovered research projects
- Force dynamic rendering (no caching)
- Response: `ProjectsResponse`

**GET /api/projects/[id]**
- Get specific project details
- Returns: `ResearchProject`

**GET /api/projects/[id]/files/[filename]**
- Get file content and rendered HTML
- Path validation: prevents directory traversal
- Response: `FileContentResponse`

**GET /api/projects/[id]/progress**
- Get research progress for project
- Response: `ProgressResponse`

#### Research API

**POST /api/research**
- Start new research session
- Body: `ResearchConfig`
- Returns: `{ researchId: string }`

**GET /api/research**
- List all research sessions
- Returns: `Research[]`

**GET /api/research/[id]**
- Get research details with agents and activities
- Returns: Research + agents + activities

**POST /api/research/[id]/message**
- Send message to research agent
- Body: `{ message: string }`
- Returns: `{ success: boolean }`

**POST /api/research/[id]/resume**
- Resume paused research
- Returns: `{ success: boolean }`

**POST /api/research/[id]/stop**
- Stop running research
- Returns: `{ success: boolean }`

**DELETE /api/research/[id]**
- Delete research and all its files
- Returns: `{ success: boolean }`

#### Authentication API

**GET /api/auth/claude**
- Check Claude authentication status
- Returns: `{ authenticated, hasToken, tokenValid, cliInstalled }`

**POST /api/auth/claude**
- Authenticate with Claude or set API key
- Body: `{ action: "login" | "set_token", token?: string }`
- Returns: `{ success, message, requiresRestart }`

**GET /api/auth/status**
- Check all auth provider status
- Returns: Provider availability information

#### Utility Endpoints

**GET /api/health**
- Server health check
- Returns: `HealthResponse`

**POST /api/mcp** or **GET /api/mcp**
- MCP (Model Context Protocol) endpoint
- Handles tool requests from AI agents

### 6.2 WebSocket Events

**Initial Connection:**
```json
{
  "type": "initial_data",
  "projects": { ... },
  "timestamp": "2024-01-01T..."
}
```

**Projects Updated:**
```json
{
  "type": "projects_updated",
  "projects": { ... },
  "timestamp": "2024-01-01T..."
}
```

**Progress Updated:**
```json
{
  "type": "progress_updated",
  "projectId": "project-name",
  "progress": { percentage, currentTask, ... },
  "timestamp": "2024-01-01T..."
}
```

---

## 7. Authentication Flow

### 7.1 Claude Authentication

**Two Methods:**

1. **OAuth Login (Recommended)**
   - POST /api/auth/claude with `{ action: "login" }`
   - Checks if Claude CLI is installed
   - Launches CLI login flow
   - Returns token to save in .env.local
   - Requires server restart

2. **Manual Token Setting**
   - POST /api/auth/claude with `{ action: "set_token", token }`
   - Validates token format (sk-ant-oat01-* or sk-ant-api03-*)
   - Saves to .env.local
   - Requires server restart

**Token Validation:**
```typescript
isValidClaudeToken(token)
  → Checks token starts with sk-ant-oat01- or sk-ant-api03-
  → Returns boolean
```

**Implementation:**
- Stored in environment: `ANTHROPIC_API_KEY`
- Used by both Next.js routes and Python agent
- Validated on every API call

---

## 8. Research Agent Interaction

### 8.1 Architecture

```
Next.js Backend
      ↓
ResearchManager
      ↓
Spawn Python Process: mcp-agent
      ↓
mcp-agent reads mcp_agent.config.yaml
      ↓
Loads MCP Servers:
  - web-research-assistant
  - filesystem-server.py
      ↓
Executes research-prompt.txt template
      ↓
Claude makes decisions & uses tools
      ↓
Tools write files to project directory
      ↓
Agent subprocess tracks in .research-progress.json
      ↓
Backend polls for updates
      ↓
UI displays in Research view
```

### 8.2 MCP Server Configuration

**File:** `mcp_agent.config.yaml`

```yaml
execution_engine: asyncio

mcp:
  servers:
    web-research-assistant:
      command: "uvx"
      args: ["web-research-assistant"]
    
    filesystem:
      command: "uv"
      args: ["run", "python", "mcp-servers/filesystem-server.py"]

anthropic:
  default_model: "claude-sonnet-4-5"
```

### 8.3 Filesystem MCP Server (Python)

**Location:** `mcp-servers/filesystem-server.py`

**Tools Provided:**

```python
@mcp.tool()
def read_file(path: str) -> str
  → Read file contents

@mcp.tool()
def write_file(path: str, content: str) -> str
  → Write/create file

@mcp.tool()
def write_research_metadata(...)
  → Write metadata.json

@mcp.tool()
def update_research_progress(...)
  → Write .research-progress.json

@mcp.tool()
def list_directory(path: str) -> List[str]
  → List directory contents

@mcp.tool()
def create_directory(path: str) -> str
  → Create directory
```

### 8.4 Research Agent Workflow

**Steps:**

1. User submits research form with topic and config
2. `/api/research` creates database record with UUID
3. ResearchManager creates project directory: `RESEARCH_DIR/[project-name-uuid]`
4. Spawns Python subprocess: `mcp-agent`
5. Agent uses MCP tools to read research prompt template
6. Claude processes research using available tools:
   - web-research-assistant (web search)
   - filesystem-server (read/write files)
7. Agent writes progress to `.research-progress.json`
8. Backend polls this file for UI updates
9. Files written to project directory automatically appear in portal
10. Agent subprocess terminates when complete

---

## 9. Key Architectural Decisions

### 9.1 Dual-System Architecture

**Design:** Two separate systems serve different purposes

**Research Portal (File-based)**
- Lightweight, stateless, filesystem-based
- Scans directories for completed projects
- Real-time file watching
- No database needed

**Research Wizard (Database-driven)**
- Tracks active research sessions
- Records agent activities and logs
- Enables resume/pause functionality
- Persistent state across restarts

**Rationale:**
- Portal remains performant with thousands of projects
- Wizard can have complex state management
- Clear separation of concerns
- Each system optimized for its use case

### 9.2 State Management with Zustand + localStorage

**Why Zustand?**
- Lightweight (~2KB)
- No boilerplate (vs Redux)
- Excellent TypeScript support
- Built-in middleware for persistence

**Why localStorage?**
- User preferences persisted
- Fast reload of sidebar state
- Favorites and recent files survive page refresh
- No server-side session needed for UI state

### 9.3 SQLite for Research Tracking

**Why SQLite?**
- Single-file database (easy backups)
- better-sqlite3 for synchronous access
- Perfect for moderate data volumes
- No separate server needed

**Why Not PostgreSQL?**
- Single-machine deployment focus
- Operational simplicity
- Sufficient for research agent tracking

### 9.4 Python mcp-agent for AI Research

**Why subprocess instead of HTTP API?**
- Full control over agent lifecycle
- Direct filesystem access (no proxying)
- Process isolation (crashes don't crash portal)
- Can pause/resume by managing process

**MCP Server Strategy:**
- Gives agents standardized interface
- Multiple tools available (web search, filesystem)
- Can be extended with custom tools
- Language-agnostic (agents can be Python, JS, etc.)

### 9.5 File-based Project Storage

**Why not database for all projects?**
- Humans work with files naturally
- Git-friendly (can commit projects)
- Portable (copy directories around)
- No schema migrations needed
- Markdown is portable

**Metadata in JSON files:**
- Coexists with human-readable markdown
- Can be version controlled
- Easy for agents to write
- No ORM complexity

### 9.6 Next.js for Full-Stack

**Why Next.js?**
- Full-stack in one framework
- React for UI, Node.js for backend
- Built-in API routes
- SSR/SSG flexibility
- TypeScript excellent support
- Automatic code splitting

---

## 10. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    app/page.tsx (Home)                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ├─→ components/Sidebar.tsx ─→ lib/store.ts
         ├─→ components/DocumentView.tsx ─→ API
         ├─→ components/ResearchSidePanel.tsx
         ├─→ components/CommandPalette.tsx
         └─→ components/ProgressPanel.tsx

┌─────────────────────────────────────────────────────────────┐
│              app/api/projects/route.ts                       │
└────────┬────────────────────────────────────────────────────┘
         │
         └─→ lib/server/file-scanner.ts
             ├─→ lib/server/markdown-parser.ts
             ├─→ lib/research-wizard/research-wizard-db.ts
             └─→ fs/promises (filesystem)

┌─────────────────────────────────────────────────────────────┐
│              app/api/research/[id]/route.ts                  │
└────────┬────────────────────────────────────────────────────┘
         │
         └─→ lib/research-wizard/research-manager.ts
             ├─→ lib/research-wizard/research-wizard-db.ts
             ├─→ child_process.spawn
             ├─→ lib/logger.ts
             └─→ uuid

┌─────────────────────────────────────────────────────────────┐
│              app/api/auth/claude/route.ts                    │
└────────┬────────────────────────────────────────────────────┘
         │
         └─→ lib/claude-auth.ts
             ├─→ child_process.exec
             └─→ fs (filesystem)

┌─────────────────────────────────────────────────────────────┐
│           mcp-servers/filesystem-server.py                   │
└────────┬────────────────────────────────────────────────────┘
         │
         └─→ mcp.server.fastmcp
             ├─→ pathlib (filesystem)
             └─→ json (serialization)
```

---

## 11. Component Hierarchy

### UI Layout Structure

```
RootLayout (app/layout.tsx)
  └── Home (app/page.tsx)
      └── PanelGroup (react-resizable-panels)
          ├── Panel (Left)
          │   └── Sidebar
          │       ├── ProjectTree
          │       │   └── Project files list
          │       ├── SearchBox
          │       └── Favorites/Recent
          │
          ├── PanelResizeHandle
          │
          ├── Panel (Center)
          │   └── (currentProject && currentFileName) ?
          │       └── DocumentView
          │           ├── DocumentHeader
          │           ├── DocumentTabs
          │           └── Markdown Content
          │           : WelcomeScreen
          │
          ├── PanelResizeHandle
          │
          └── Panel (Right)
              └── ResearchSidePanel
                  ├── ResearchWizardForm
                  └── Active Research List

Floating Overlays
├── ProgressPanel (top-right, contextual)
└── CommandPalette (modal, Cmd+K)
```

---

## 12. Performance Considerations

### 12.1 Project Scanning
- **Strategy:** Incremental scanning with caching
- **Frequency:** Every 5 seconds via polling
- **Optimization:** Only reads changed files

### 12.2 Markdown Rendering
- **Strategy:** Parsed on-demand per file
- **Caching:** Not cached (re-parsed on view)
- **Performance:** Acceptable for most documents (<10MB)

### 12.3 State Management
- **Zustand:** Efficient re-renders (selector pattern)
- **localStorage:** Async save on state change
- **Memory:** Minimal footprint for projects data

### 12.4 Database Queries
- **SQLite:** Synchronous queries (blocking)
- **Acceptable:** Small dataset (hundreds of records)
- **Indexes:** Key queries indexed for speed

---

## 13. Security Considerations

### 13.1 Path Traversal Prevention

```typescript
// From file-scanner.ts
if (fileName.includes('..') || fileName.includes('/')) {
  throw new Error('Invalid filename');
}

const normalized = path.normalize(filePath);
const projectNormalized = path.normalize(projectPath);

if (!normalized.startsWith(projectNormalized)) {
  throw new Error('File path outside project directory');
}
```

### 13.2 HTML Sanitization

```typescript
// Using dompurify for user-generated markdown HTML
const sanitized = DOMPurify.sanitize(html);
```

### 13.3 API Authentication

- Claude authentication via env variables
- Token validation on every research request
- No authentication required for project browsing (public)

---

## 14. Environment Configuration

### 14.1 Required Variables

```bash
# At minimum, one AI provider key:
ANTHROPIC_API_KEY=sk-ant-api03-...
# OR
OPENAI_API_KEY=sk-...
# OR
GOOGLE_API_KEY=AIza...

# Directory where research projects stored
RESEARCH_DIR=/Users/eladbenhaim/research

# Database location (optional, defaults to RESEARCH_DIR)
DB_PATH=/Users/eladbenhaim/research/research-wizard.db

# NextJS internals
NODE_ENV=production
```

### 14.2 Optional Variables

```bash
# Server configuration
PORT=3000
OPENCODE_URL=http://localhost:4096

# Logging
LOG_LEVEL=info
```

---

## 15. Testing Strategy

### 15.1 Types of Tests Needed

**Unit Tests:**
- `lib/store.ts` - State management actions
- `lib/server/markdown-parser.ts` - Parsing logic
- `lib/claude-auth.ts` - Token validation

**Integration Tests:**
- API routes → file-scanner → filesystem
- Database operations
- Project discovery

**E2E Tests:**
- Create research → UI updates
- Browse projects → file viewing
- Project ordering/favorites

### 15.2 Manual Testing Checklist

- [ ] Project discovery works after startup
- [ ] File changes detected within 5 seconds
- [ ] Research agent starts and completes
- [ ] Progress updates display in real-time
- [ ] File navigation works
- [ ] Favorites persist across refresh
- [ ] Project reordering works
- [ ] Authentication flow completes

---

## 16. Deployment Considerations

### 16.1 Build Process

```bash
npm run build
  → TypeScript compilation
  → Next.js optimization
  → Output to .next/
npm run start
  → Runs production Next.js server
```

### 16.2 Environment Setup for Production

```bash
# Build app
npm run build

# Set environment variables
export ANTHROPIC_API_KEY=...
export RESEARCH_DIR=/path/to/research

# Start server
npm start
# Runs on default port 3000
```

### 16.3 Process Management

```bash
# Recommended: PM2
pm2 start npm --name "research-portal" -- start
pm2 save
pm2 startup

# Or: Docker
docker build -t research-portal .
docker run -p 3000:3000 -v /path/to/research:/research research-portal
```

### 16.4 Reverse Proxy

```nginx
upstream portal {
  server localhost:3000;
}

server {
  listen 80;
  server_name research.example.com;
  
  location / {
    proxy_pass http://portal;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 17. Future Architecture Improvements

### 17.1 Planned Enhancements

1. **Real-time Sync**
   - Replace polling with WebSocket pushes
   - Reduce latency for file updates

2. **Full-text Search**
   - Index project content
   - Elasticsearch or Meilisearch integration

3. **User Authentication**
   - Multi-user support
   - Per-user project access control
   - Activity logging

4. **Research Collaboration**
   - Shared projects
   - Comments on research
   - Version control integration

5. **Plugin System**
   - Custom exporters (PDF, EPUB)
   - Custom renderers
   - API extensions

### 17.2 Performance Optimizations

1. **Caching Layer**
   - Redis for frequently accessed projects
   - ETags for file content

2. **Database Migration**
   - PostgreSQL for multi-user scenarios
   - GraphQL API layer

3. **Frontend Optimization**
   - Next.js Image optimization
   - Code splitting by route
   - Service Worker caching

---

## 18. Troubleshooting Guide

### Common Issues

**Projects not appearing:**
- Ensure directories have `README.md`
- Check `RESEARCH_DIR` environment variable
- Verify folder names match project IDs

**Research agent not starting:**
- Check `ANTHROPIC_API_KEY` is set
- Verify `mcp_agent.config.yaml` exists
- Check Python environment has `mcp-agent` installed

**File changes not updating:**
- Ensure chokidar is watching correct directory
- Check file permissions
- Verify polling interval settings

**Database locked errors:**
- Multiple processes accessing SQLite
- Check for crashed processes
- Restart server

---

## Conclusion

The Research Portal is a sophisticated full-stack application combining Next.js frontend, Node.js/Python backend, and SQLite database. Its dual-system architecture elegantly separates concerns between file-based project browsing and database-driven research orchestration, enabling both scalability and flexibility.

Key strengths:
- Clean separation of concerns
- Type-safe throughout (TypeScript)
- Minimal dependencies
- Good performance characteristics
- Extensible via MCP servers

This architecture supports current needs while remaining flexible for future enhancements.
