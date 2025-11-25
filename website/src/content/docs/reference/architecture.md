---
title: Architecture
description: Technical architecture overview of Research Portal.
---

This document provides a technical overview of Research Portal's architecture.

## System Overview

Research Portal uses a **two-system architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Research Portal (Next.js)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Frontend (React Components)                  │ │
│  │  Sidebar | DocumentView | ResearchPanel | CommandPalette    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                  │
│   ┌──────────────────┐        ┌──────────────────────┐         │
│   │ Research Portal  │        │  Research Wizard     │         │
│   │ (File-based)     │        │  (Database-driven)   │         │
│   │                  │        │                      │         │
│   │ /api/projects    │        │ /api/research        │         │
│   │ Filesystem       │        │ SQLite Database      │         │
│   │ Scanning         │        │ ResearchManager      │         │
│   │ File Watching    │        │ Agent Orchestration  │         │
│   └──────────────────┘        └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Research Portal (File-based)

Handles browsing and displaying completed research:

- Scans `RESEARCH_DIR` for project directories
- Reads `metadata.json` for project information
- Renders markdown and HTML files
- Supports real-time file watching
- No database dependency

### Research Wizard (Database-driven)

Manages active research sessions:

- Tracks sessions in SQLite database
- Spawns Python mcp-agent processes
- Streams agent activities
- Supports conversation continuation
- Manages agent lifecycle

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | Full-stack React framework |
| React | 18.x | UI components |
| TypeScript | 5.x | Type safety |
| Node.js | 20.x | Runtime |

### Data Layer

| Technology | Purpose |
|------------|---------|
| SQLite (better-sqlite3) | Research session tracking |
| Filesystem | Project storage |
| Zustand | Client state management |
| localStorage | UI preferences |

### AI & MCP

| Technology | Purpose |
|------------|---------|
| mcp-agent | Python agent framework |
| @anthropic-ai/sdk | Claude API client |
| @modelcontextprotocol/sdk | MCP implementation |
| web-research-assistant | Web search tools |

### Styling

| Technology | Purpose |
|------------|---------|
| Tailwind CSS | Utility-first CSS |
| CSS Variables | Theme system |
| react-resizable-panels | Layout panels |
| @dnd-kit | Drag-and-drop |

## Directory Structure

```
online-research/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   ├── health/               # Health check
│   │   ├── mcp/                  # MCP server
│   │   ├── projects/             # Project management
│   │   └── research/             # Research management
│   ├── auth/                     # Auth page
│   ├── projects/                 # Project pages
│   ├── wizard/                   # Research wizard
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── Sidebar.tsx
│   ├── DocumentView.tsx
│   ├── CommandPalette.tsx
│   └── ...
│
├── lib/                          # Core libraries
│   ├── server/                   # Server utilities
│   │   ├── file-scanner.ts
│   │   ├── file-watcher.ts
│   │   └── markdown-parser.ts
│   ├── research-wizard/          # Research management
│   │   ├── research-manager.ts
│   │   ├── research-wizard-db.ts
│   │   └── claude-cli-executor.ts
│   ├── store.ts                  # Zustand state
│   └── types.ts                  # TypeScript types
│
├── mcp-servers/                  # MCP server implementations
│   └── filesystem-server.py
│
├── scripts/                      # Agent scripts
│   ├── research-agent.py
│   └── prompts/
│       └── research-instruction.txt
│
└── website/                      # Documentation (Starlight)
```

## Data Flow

### Project Browsing

```
User clicks project
       ↓
Sidebar → Zustand Store Update
       ↓
Router navigation to /projects/[id]/files/[name]
       ↓
DocumentView component
       ↓
Fetch GET /api/projects/[id]/files/[name]
       ↓
file-scanner.ts → Read file from disk
       ↓
markdown-parser.ts → Parse and render
       ↓
Return HTML to client
       ↓
Display in DocumentView
```

### Research Creation

```
User submits research form
       ↓
POST /api/research
       ↓
ResearchManager.startResearch()
       ↓
Create project directory
       ↓
Insert SQLite record
       ↓
Spawn Python mcp-agent process
       ↓
Return researchId
       ↓
Navigate to /research/[id]
       ↓
Poll for updates (2s interval)
       ↓
Display agent activities
```

## Database Schema

### researches Table

```sql
CREATE TABLE researches (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL,  -- pending|in_progress|completed|failed
  createdAt INTEGER NOT NULL,
  completedAt INTEGER,
  projectDir TEXT NOT NULL UNIQUE,
  totalAgents INTEGER NOT NULL
);
```

### agents Table

```sql
CREATE TABLE agents (
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
```

### activities Table

```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (agentId) REFERENCES agents(id)
);
```

## State Management

### Zustand Store

```typescript
interface Store {
  // Project data
  projects: Record<string, ResearchProject>;
  currentProjectId: string | null;
  currentFileName: string | null;
  
  // UI state
  expandedProjects: Set<string>;
  projectOrder: string[];
  favorites: string[];
  recent: RecentItem[];
  commandPaletteOpen: boolean;
  sidebarOpen: boolean;
  
  // Actions
  setProjects: (projects) => void;
  setCurrentProject: (id) => void;
  toggleFavorite: (projectId, fileName) => void;
  // ...
}
```

### Persistence

| Key | Data |
|-----|------|
| `portal-favorites` | Favorite files |
| `portal-recent` | Recent items |
| `portal-project-order` | Custom ordering |
| `portal-expanded` | Expanded folders |

## Security Considerations

### Path Traversal Prevention

```typescript
// Validate file paths
if (fileName.includes('..') || fileName.includes('/')) {
  throw new Error('Invalid filename');
}

const normalized = path.normalize(filePath);
if (!normalized.startsWith(projectPath)) {
  throw new Error('Path outside project');
}
```

### HTML Sanitization

```typescript
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(html);
```

### Token Validation

```typescript
// Valid token patterns
const oauthPattern = /^sk-ant-oat01-[A-Za-z0-9_-]{95,}$/;
const apiKeyPattern = /^sk-ant-api03-[A-Za-z0-9_-]{95,}$/;
```

## Performance

### Polling Intervals

| Resource | Interval | Purpose |
|----------|----------|---------|
| Projects | 5s | Detect new/changed projects |
| Progress | 3s | Update progress display |
| Activities | 2s | Stream agent activities |

### Caching

- Projects cached in Zustand store
- Markdown rendered on-demand
- File metadata cached in memory
- Browser caches API responses

### Optimizations

- Zustand selector pattern for minimal re-renders
- Lazy loading of components
- Debounced search queries
- Limited recent items (50 max)
