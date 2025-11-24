# Research Portal - Comprehensive Features Documentation

**Last Updated:** November 24, 2025

This document provides a complete overview of all features, pages, API endpoints, components, and utilities in the Research Portal application.

---

## Table of Contents

1. [Main Pages & Routes](#main-pages--routes)
2. [API Endpoints](#api-endpoints)
3. [React Components](#react-components)
4. [Utilities & Helpers](#utilities--helpers)
5. [User-Facing Features](#user-facing-features)
6. [Data Models](#data-models)

---

## Main Pages & Routes

### Core Pages

#### 1. **Home Page** (`app/page.tsx`)
- **Route:** `/`
- **Purpose:** Main Research Portal dashboard
- **Features:**
  - Three-panel layout with resizable panels (Sidebar | Main Content | Right Panel)
  - Displays list of research projects in sidebar
  - Shows document content in main panel
  - Right panel for research insights
  - Command palette for quick navigation
  - Progress panel for active research tasks
  - Fetches projects via polling every 5 seconds
  - Supports keyboard shortcuts and quick actions

#### 2. **Research Wizard Page** (`app/wizard/page.tsx`)
- **Route:** `/wizard`
- **Purpose:** Interface for starting new research projects
- **Features:**
  - Requires authentication check before access
  - Form-based research initiation
  - Captures research topic, depth, focus, and style preferences
  - Supports multiple AI providers (Anthropic, OpenAI, Google)
  - Redirects to home after successful research creation
  - Shows loading state during auth check

#### 3. **Authentication Page** (`app/auth/page.tsx`)
- **Route:** `/auth`
- **Purpose:** API key management and provider configuration
- **Features:**
  - Multi-provider support (Anthropic, OpenAI, Google AI)
  - Interactive provider selection with icons and color coding
  - API key input with validation
  - Securely stores keys in `.env.local`
  - Shows connected providers status
  - Add/update multiple AI provider keys
  - Links to official documentation and API key pages
  - Server restart notice for key activation

#### 4. **Research Detail Page** (`app/research/[id]/page.tsx`)
- **Route:** `/research/[id]`
- **Purpose:** Real-time chat interface for research sessions
- **Features:**
  - Live activity streaming from research agents
  - Chat-style message display with timestamps
  - Shows agent thoughts, tool calls, and results
  - Progress bar with current task tracking
  - Real-time status updates (pending, in_progress, completed)
  - Send messages to continue research conversation
  - Stop research functionality with confirmation
  - Auto-resume research on message send
  - Collapsible tool result details
  - Color-coded activity types (thoughts, tool calls, errors)
  - Activity polling every 2 seconds

#### 5. **Project Page** (`app/projects/[projectId]/page.tsx`)
- **Route:** `/projects/[projectId]`
- **Purpose:** Redirect to first file or README.md
- **Features:**
  - Loads project data and finds README.md file
  - Falls back to first available file if no README
  - Automatic redirect to file view
  - Loading state while fetching projects

#### 6. **Project File Page** (`app/projects/[projectId]/files/[filename]/page.tsx`)
- **Route:** `/projects/[projectId]/files/[filename]`
- **Purpose:** Display specific research document files
- **Features:**
  - Three-panel layout (Sidebar | Document | Right Panel)
  - File tabs for switching between documents
  - Supports markdown and HTML files
  - Syntax-highlighted code blocks
  - Document metadata display
  - File navigation with breadcrumbs
  - Polling for project updates every 5 seconds
  - Favorite marking functionality
  - Progress panel for ongoing research

#### 7. **Root Layout** (`app/layout.tsx`)
- **Route:** All pages
- **Purpose:** Global layout and metadata
- **Features:**
  - Sets page title: "Research Portal"
  - Metadata for description and viewport
  - Notion-style dark theme
  - HTML document structure

---

## API Endpoints

### Research Management

#### **POST /api/research**
- **Purpose:** Start a new research project
- **Request Body:**
  ```json
  {
    "topic": "string (required)",
    "depth": "quick|standard|deep (default: standard)",
    "focus": "string (optional)",
    "style": "comprehensive|comparing|practical (default: comprehensive)",
    "provider": "anthropic|openai|google (default: openai)",
    "model": "string (optional)"
  }
  ```
- **Response:** `{ researchId, status: "started" }`
- **Error Handling:**
  - Validates required topic field
  - Checks for configured API keys by provider
  - Returns helpful setup URLs for missing keys
  - Status 503 if API key not configured

#### **GET /api/research**
- **Purpose:** Get all research projects with statistics
- **Query Parameters:**
  - `action=activities` - Get recent activities only
  - `limit=50` - Limit of activities to return
- **Response:**
  ```json
  {
    "researches": [{ id, topic, status, projectDir, ... }],
    "stats": { researches: { total, completed }, agents: { total, completed }, activities },
    "recentActivities": [...]
  }
  ```

#### **GET /api/research/[id]**
- **Purpose:** Get specific research project details
- **Response:**
  ```json
  {
    "research": { id, topic, status, createdAt, completedAt, projectDir },
    "agents": [{ id, status, activities, ... }],
    "progress": { percentage, currentTask, currentTaskDescription, completedTasks }
  }
  ```
- **Features:**
  - Loads activity data from database
  - Merges .messages.json file data
  - Merges .activities.json for tool calls/thoughts
  - Handles both database and file-based projects

#### **DELETE /api/research/[id]**
- **Purpose:** Delete a research project
- **Response:** `{ success: true }`
- **Features:**
  - Tries database deletion first
  - Falls back to file-based deletion
  - Returns 404 if project not found

#### **POST /api/research/[id]/message**
- **Purpose:** Send message to research agent
- **Request Body:** `{ "message": "string (required)" }`
- **Response:** `{ success, message, logged, filePath, resumed }`
- **Features:**
  - Logs message to database activity
  - Saves message to .messages.json
  - Auto-resumes completed/failed research
  - Checks if agent process needs restart
  - Returns resumption status

#### **POST /api/research/[id]/stop**
- **Purpose:** Stop running research
- **Response:** `{ success: true, message: "Research stopped" }`
- **Features:**
  - Updates research status to "failed"
  - Creates .kill file to signal agent
  - Logs stop activity
  - Returns 404 if research not in database

#### **POST /api/research/[id]/resume** (Implied)
- **Purpose:** Resume stopped research
- **Features:**
  - Restarts research process
  - Maintains conversation history
  - Updates agent status

### Projects Management

#### **GET /api/projects**
- **Purpose:** List all research projects
- **Response:**
  ```json
  {
    "projects": {
      "projectId": {
        "id": "string",
        "name": "string",
        "path": "string",
        "files": ["string"],
        "metadata": {},
        "progress": null|{},
        "createdAt": "Date",
        "modifiedAt": "Date"
      }
    },
    "count": "number",
    "timestamp": "ISO string"
  }
  ```

#### **GET /api/projects/[id]**
- **Purpose:** Get specific project details
- **Response:** Returns project with full file list and metadata

#### **GET /api/projects/[id]/files/[filename]**
- **Purpose:** Get specific file content
- **Response:**
  ```json
  {
    "fileName": "string",
    "projectId": "string",
    "content": "string (markdown)",
    "html": "string (rendered HTML)",
    "timestamp": "ISO string"
  }
  ```

#### **GET /api/projects/[id]/progress**
- **Purpose:** Get project progress status
- **Response:**
  ```json
  {
    "projectId": "string",
    "progress": {
      "percentage": "number",
      "currentTask": "string",
      "currentTaskDescription": "string",
      "completedTasks": ["string"],
      "startedAt": "ISO string",
      "estimatedCompletion": "ISO string"
    },
    "timestamp": "ISO string"
  }
  ```

### Authentication

#### **GET /api/auth/status**
- **Purpose:** Check API provider configuration status
- **Response:**
  ```json
  {
    "providers": {
      "anthropic": { "hasKey": "boolean", "keyValid": "boolean" },
      "openai": { "hasKey": "boolean", "keyValid": "boolean" },
      "google": { "hasKey": "boolean", "keyValid": "boolean" }
    },
    "hasAnyProvider": "boolean"
  }
  ```

#### **GET /api/auth/claude**
- **Purpose:** Check Claude authentication status
- **Response:**
  ```json
  {
    "authenticated": "boolean",
    "hasToken": "boolean",
    "tokenValid": "boolean",
    "cliInstalled": "boolean",
    "tokenType": "oauth|api_key|unknown"
  }
  ```

#### **POST /api/auth/claude**
- **Purpose:** Authenticate with Claude or set token
- **Request Body:**
  ```json
  {
    "action": "login|set_token",
    "token": "string (for set_token action)"
  }
  ```
- **Response:**
  ```json
  {
    "success": "boolean",
    "message": "string",
    "tokenType": "oauth|api_key",
    "requiresRestart": "boolean"
  }
  ```
- **Features:**
  - Validates OAuth or API key tokens
  - Checks if Claude CLI is installed
  - Saves token to .env.local
  - Prompts for server restart

#### **POST /api/auth/set-key**
- **Purpose:** Set API key for specific provider
- **Request Body:**
  ```json
  {
    "provider": "anthropic|openai|google",
    "apiKey": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": "boolean",
    "error": "string (if failed)",
    "hasAnyProvider": "boolean"
  }
  ```
- **Features:**
  - Validates key format by provider
  - Stores in .env.local
  - Checks for valid key prefixes

### Health & Info

#### **GET /api/health**
- **Purpose:** Health check endpoint
- **Response:**
  ```json
  {
    "status": "ok|error",
    "projectCount": "number",
    "researchDir": "string",
    "connectedClients": "number",
    "timestamp": "ISO string"
  }
  ```

#### **GET /api/mcp**
- **Purpose:** MCP server information and tool definitions
- **Response:** MCP server capabilities and available tools

---

## React Components

### UI Components

#### **CommandPalette** (`components/CommandPalette.tsx`)
- **Purpose:** Quick command/search interface
- **Props:** `{ projects, onProjectSelect, onFileSelect }`
- **Features:**
  - Search-as-you-type for projects and files
  - Keyboard shortcuts (Cmd+K)
  - Quick navigation to any file
  - Recent items in dropdown
  - Smart filtering and ranking

#### **DocumentHeader** (`components/DocumentHeader.tsx`)
- **Purpose:** Display document title and metadata
- **Props:** `{ project, fileName, onProjectSelect }`
- **Features:**
  - Shows document title
  - Displays last modified time
  - Breadcrumb navigation
  - Link to project

#### **DocumentTabs** (`components/DocumentTabs.tsx`)
- **Purpose:** File tab navigation
- **Props:** `{ project, currentFileName, onFileSelect }`
- **Features:**
  - Shows all files in project as tabs
  - Active tab highlighting
  - Quick switching between documents
  - Shows file count

#### **DocumentView** (`components/DocumentView.tsx`)
- **Purpose:** Render file content with styling
- **Props:** `{ project, fileName, onFileSelect, onToggleFavorite, isFavorite }`
- **Features:**
  - Renders markdown and HTML
  - Syntax highlighting for code blocks
  - Auto-sanitizes HTML with DOMPurify
  - Favorite toggle button
  - Document header and tabs
  - Auto-scrolls on content changes
  - Responsive layout

#### **ProgressPanel** (`components/ProgressPanel.tsx`)
- **Purpose:** Show research progress in floating panel
- **Props:** `{ projectId, visible, onClose }`
- **Features:**
  - Shows current task and progress percentage
  - Completed tasks list
  - Estimated completion time
  - Auto-hides when progress reaches 100%
  - Closeable by user
  - Fetches progress every 3 seconds

#### **ProjectMetadata** (`components/ProjectMetadata.tsx`)
- **Purpose:** Display project metadata card
- **Props:** `{ metadata, className }`
- **Features:**
  - Shows title, category, tags
  - Summary/description
  - Conditional rendering of fields

#### **ProjectTree** (`components/ProjectTree.tsx`)
- **Purpose:** Hierarchical project file listing
- **Props:** `{ projects, selectedProjectId, selectedFileName, onProjectSelect, onFileSelect }`
- **Features:**
  - Drag-and-drop file reordering (dnd-kit)
  - Expand/collapse project folders
  - File icons by type
  - Hover states
  - Selected state highlighting
  - Favorites marking

#### **ResearchSidePanel** (`components/ResearchSidePanel.tsx`)
- **Purpose:** Right sidebar with research sessions
- **Features:**
  - Lists active research sessions
  - Shows session status and progress
  - Quick navigation to research detail pages
  - Activity indicator
  - Agent status display
  - Real-time updates

#### **ResearchWizardForm** (`components/ResearchWizardForm.tsx`)
- **Purpose:** Form for creating new research
- **Props:** `{ onSuccess }`
- **Features:**
  - Topic input field
  - Research depth selector (quick/standard/deep)
  - Focus input for research direction
  - Style selector (comprehensive/comparing/practical)
  - AI provider selector
  - Form validation
  - Loading state during submission
  - Success callback

#### **SearchBox** (`components/SearchBox.tsx`)
- **Purpose:** Reusable search/filter input
- **Props:** `{ value, onChange, placeholder }`
- **Features:**
  - Debounced filtering
  - Clear button
  - Keyboard shortcuts
  - Accessibility support

#### **Sidebar** (`components/Sidebar.tsx`)
- **Purpose:** Main left sidebar with project list
- **Props:** `{ onProjectSelect, onFileSelect }`
- **Features:**
  - Project search and filtering
  - Project tree with drag-drop reordering
  - Favorites section
  - Recent items section
  - Custom project ordering
  - Persistent state

#### **WelcomeScreen** (`components/WelcomeScreen.tsx`)
- **Purpose:** Empty state view
- **Features:**
  - Welcome message
  - Quick start links
  - Instructions for getting started
  - Call-to-action buttons

---

## Utilities & Helpers

### State Management

#### **Store** (`lib/store.ts`)
- **Library:** Zustand with selectors
- **Purpose:** Global application state management
- **State Properties:**
  - `projects` - All research projects
  - `currentProjectId` - Active project
  - `currentFileName` - Active file
  - `expandedProjects` - Set of expanded folders
  - `projectOrder` - Custom project ordering
  - `favorites` - Favorite files (projectId:fileName)
  - `recent` - Recently viewed files with timestamps
  - `commandPaletteOpen` - Command palette visibility
  - `wsConnected` - WebSocket connection status
  - `sidebarOpen` - Sidebar visibility
- **Actions:**
  - `setProjects(projects)` - Update project list
  - `setCurrentProject(id)` - Set active project
  - `setCurrentFile(name)` - Set active file
  - `toggleProjectExpanded(id)` - Toggle folder expand
  - `toggleFavorite(projectId, fileName)` - Mark/unmark favorite
  - `addToRecent(projectId, fileName)` - Add to recent list
  - `clearRecent()` - Clear recent list
  - `toggleCommandPalette()` - Toggle command palette
  - `setSidebarOpen(open)` - Set sidebar visibility
- **Persistence:**
  - Favorites saved to localStorage (`portal-favorites`)
  - Recent items saved to localStorage (`portal-recent`)
  - Project order saved to localStorage (`portal-project-order`)
  - Expanded folders saved to localStorage (`portal-expanded`)

#### **useProjects** Hook
- **Purpose:** Subscribe to projects state
- **Usage:** `const projects = useProjects()`

### Authentication

#### **claudeAuth** (`lib/claude-auth.ts`)
- **Purpose:** Claude API key management
- **Functions:**
  - `loginWithClaude()` - OAuth login flow
  - `checkClaudeCLI()` - Check if Claude CLI installed
  - `isValidClaudeToken(token)` - Validate token format
  - `setTokenInEnvironment(token)` - Save to .env.local
  - `getClaudeApiKey()` - Get current API key
- **Features:**
  - Supports OAuth and API key tokens
  - Validates token formats (sk-ant-oat01-, sk-ant-api03-)
  - Manages .env.local file
  - Checks CLI installation

### Research Management

#### **ResearchManager** (`lib/research-wizard/research-manager.ts`)
- **Purpose:** Core research lifecycle management
- **Methods:**
  - `startResearch(options)` - Initiate new research
  - `resumeResearch(id)` - Continue stopped research
  - `stopResearch(id)` - Halt active research
  - `deleteResearch(id)` - Remove research project
  - `getResearchStatus(id)` - Check status
- **Features:**
  - Spawns Python agent process
  - Manages research database
  - Handles project directory creation
  - Tracks agent lifecycle
  - Auto-detects completed research

#### **ResearchDatabase** (`lib/research-wizard/research-wizard-db.ts`)
- **Purpose:** SQLite database for research tracking
- **Tables:**
  - `researches` - Research projects
  - `agents` - Agent instances
  - `activities` - Agent activities/logs
- **Methods:**
  - `createResearch()` - Create new record
  - `getResearch(id)` - Fetch research
  - `updateResearchStatus()` - Update status
  - `logActivity()` - Log agent activity
  - `getAgentActivities(agentId)` - Fetch activities
  - `getAllResearches()` - List all projects

#### **ClaudeCliExecutor** (`lib/research-wizard/claude-cli-executor.ts`)
- **Purpose:** Execute Claude CLI commands
- **Methods:**
  - `executeCommand(cmd)` - Run CLI command
  - `checkInstallation()` - Verify CLI present
  - `getVersion()` - Get CLI version
- **Features:**
  - Process spawning and management
  - Output capture
  - Error handling
  - Timeout support

### File Processing

#### **File Scanner** (`lib/server/file-scanner.ts`)
- **Purpose:** Scan research directory for projects
- **Functions:**
  - `scanResearchProjects()` - Get all projects
  - `getProjectFiles(projectId)` - List files
  - `getFileContent(projectId, fileName)` - Read file
  - `getProjectProgress(projectId)` - Get progress
  - `deleteProject(projectId)` - Remove project
- **Features:**
  - Reads metadata.json files
  - Parses .research-progress.json
  - Scans for markdown and HTML files
  - Caches results
  - Ignores node_modules, .git, etc.

#### **Markdown Parser** (`lib/server/markdown-parser.ts`)
- **Purpose:** Parse markdown and extract metadata
- **Functions:**
  - `parseMarkdown(content)` - Parse markdown
  - `parseMetadata(content)` - Extract YAML frontmatter
  - `markdownToHtml(content)` - Convert to HTML
- **Features:**
  - YAML frontmatter extraction
  - Syntax highlighting
  - Code block processing
  - Link transformation

#### **File Watcher** (`lib/server/file-watcher.ts`)
- **Purpose:** Monitor research directory changes
- **Features:**
  - Detects new projects
  - Monitors file changes
  - Emits update events
  - Debounces rapid changes

### Utilities

#### **Logger** (`lib/logger.ts`)
- **Purpose:** Structured logging
- **Features:**
  - Log levels (info, warn, error, debug)
  - Timestamps
  - Context tagging
  - Performance metrics

#### **Types** (`lib/types.ts`)
- **Purpose:** TypeScript definitions
- **Interfaces:**
  - `ResearchProject` - Project structure
  - `ResearchMetadata` - Project metadata
  - `ResearchProgress` - Progress tracking
  - `ResearchFile` - File info
  - `ProjectsResponse` - API response
  - `FileContentResponse` - File API response
  - `HealthResponse` - Health check response
  - `WebSocketMessage` - WS message format
  - `UIState` - UI state shape

---

## User-Facing Features

### 1. **Research Portal Dashboard**
- Multi-panel layout with resizable sections
- Project list with search and filtering
- File tree navigation with drag-drop reordering
- Document viewer with syntax highlighting
- Favorites system for quick access
- Recent items tracking
- Command palette (Cmd+K) for quick navigation
- Dark theme (Notion-style)
- Real-time project polling

### 2. **Research Wizard**
- Simple form-based research creation
- Multiple depth options (quick, standard, deep)
- Research focus and style selection
- AI provider selection (Anthropic, OpenAI, Google)
- Form validation with helpful error messages
- Auto-redirect on success
- Authentication requirement

### 3. **Live Research Chat**
- Real-time agent activity streaming
- Chat-style message display
- Agent thoughts and reasoning visibility
- Tool call and result tracking
- Progress bar with current task
- Stop research functionality
- Continue conversation after completion
- Activity filtering and search
- Timestamps for all activities

### 4. **Authentication Management**
- Multi-provider API key setup
- Visual provider selection
- API key validation by provider
- Provider status indicators
- Update existing keys
- Links to official documentation
- Secure .env.local storage
- Server restart notifications

### 5. **Document Features**
- Markdown and HTML rendering
- Syntax-highlighted code blocks
- Auto-generated table of contents
- Responsive typography
- Link handling (internal and external)
- Metadata display (title, tags, category)
- Favorites marking with persistence
- Print-friendly styling
- Auto-scroll on navigation

### 6. **Project Organization**
- Custom project ordering (drag-drop)
- Favorites for quick access
- Recent items list
- Search and filtering
- Project metadata (title, category, tags)
- Progress indicators
- File size and type display
- Last modified timestamps

### 7. **Real-Time Updates**
- Project list polling (5s interval)
- Progress updates (3s interval)
- Activity streaming (2s interval)
- WebSocket support (when available)
- Auto-refresh on data changes
- Persistent state across navigation

### 8. **Keyboard Shortcuts**
- `Cmd+K` / `Ctrl+K` - Open Command Palette
- `Escape` - Close Command Palette
- `Enter` - Select in palette
- `Shift+Enter` - Send message in chat
- Custom shortcuts in forms

### 9. **Accessibility Features**
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Screen reader support

### 10. **Developer Features**
- Environment variable configuration
- Multiple AI provider support
- OpenCode integration for research agents
- Extensible component architecture
- TypeScript throughout
- Modular code organization

---

## Data Models

### Research Project
```typescript
interface ResearchProject {
  id: string;                    // Unique identifier
  researchId?: string;           // Database UUID for chat
  name: string;                  // Project name
  path: string;                  // File path
  files: string[];               // List of file names
  metadata: ResearchMetadata;    // Project metadata
  progress: ResearchProgress | null; // Current progress
  createdAt: Date;               // Creation timestamp
  modifiedAt: Date;              // Last modification
}
```

### Research Metadata
```typescript
interface ResearchMetadata {
  title?: string;                // Project title
  category?: string;             // Category classification
  tags?: string[];               // Tag list
  [key: string]: any;            // Additional fields
}
```

### Research Progress
```typescript
interface ResearchProgress {
  percentage: number;            // 0-100
  currentTask?: string;          // Active task name
  currentTaskDescription?: string; // Task details
  completedTasks?: string[];     // Completed task list
  startedAt?: string;            // Start time
  estimatedCompletion?: string;  // ETA
  updatedAt?: string;            // Last update
}
```

### Agent Activity
```typescript
interface Activity {
  id: string;                    // Unique ID
  agentId: string;               // Agent ID
  timestamp: number;             // Unix timestamp
  action: string;                // Action type
  description: string;           // Action details
  metadata?: any;                // Additional data
}
```

### Research Record (Database)
```typescript
interface Research {
  id: string;                    // UUID
  topic: string;                 // Research topic
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;             // Unix timestamp
  completedAt?: number;          // Completion time
  projectDir: string;            // Project directory path
  totalAgents?: number;          // Agent count
}
```

---

## Configuration

### Environment Variables

**Required for Research:**
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_API_KEY` - Google AI key

**Optional:**
- `RESEARCH_DIR` - Research projects directory (default: ~/research)
- `OPENCODE_URL` - OpenCode CLI endpoint (default: http://localhost:4096)
- `NODE_ENV` - Development or production mode

### File Structure
```
research-projects/
├── [project-id]/
│   ├── metadata.json           # Project metadata
│   ├── README.md               # Main documentation
│   ├── .research-progress.json # Progress tracking
│   ├── .messages.json          # User messages
│   ├── .activities.json        # Agent activities
│   ├── .kill                   # Stop signal file
│   └── [other-files]           # Research outputs
```

---

## Performance Considerations

### Polling Intervals
- **Projects:** 5 seconds
- **Progress:** 3 seconds
- **Activities:** 2 seconds
- **Health Check:** 30 seconds

### Caching
- Projects cached in local state
- Metadata cached in memory
- File content cached in browser

### Optimizations
- Debounced search queries
- Lazy component loading
- Resizable panels maintain state
- Recent items limited to 50
- Activity results paginated

---

## Integration Points

### External Services
1. **Anthropic Claude** - Primary AI provider
2. **OpenAI GPT** - Alternative provider
3. **Google AI (Gemini)** - Alternative provider
4. **OpenCode CLI** - Research agent execution

### MCP Servers
- **Filesystem Server** (`mcp-servers/filesystem-server.py`)
  - Write research metadata
  - Update progress
  - Read/write files
  - Directory operations

### Python Integration
- **Research Agent** (`scripts/research-agent.py`)
  - Runs async research tasks
  - Communicates via file system
  - Logs activities
  - Manages tool calls

---

## Future Enhancement Opportunities

1. **WebSocket Support** - Real-time updates without polling
2. **Offline Mode** - Work with cached projects
3. **Collaborative Features** - Share research sessions
4. **Advanced Search** - Full-text file search
5. **Export Features** - PDF, DOCX export
6. **Custom Themes** - Theme customization
7. **Research Analytics** - Usage statistics
8. **API Rate Limiting** - Prevent abuse
9. **Batch Operations** - Bulk actions on projects
10. **Mobile Responsive** - Mobile layout optimization

---

**End of Documentation**

For questions or to report issues, visit: https://github.com/sst/opencode
