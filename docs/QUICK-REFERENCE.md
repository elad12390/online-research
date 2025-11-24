# Research Portal - Quick Reference Guide

## Key Files to Know

### Frontend Entry Points
- `app/page.tsx` - Main research portal UI
- `app/auth/page.tsx` - Authentication page
- `app/wizard/page.tsx` - Research wizard form

### Backend Services
- `lib/store.ts` - Global state (Zustand)
- `lib/server/file-scanner.ts` - Project discovery
- `lib/research-wizard/research-manager.ts` - Research orchestration
- `lib/research-wizard/research-wizard-db.ts` - Database layer

### API Routes
- `app/api/projects/route.ts` - List projects
- `app/api/research/route.ts` - Create research
- `app/api/research/[id]/route.ts` - Research details
- `app/api/auth/claude/route.ts` - Authentication

### Configuration
- `mcp_agent.config.yaml` - MCP server setup
- `mcp-servers/filesystem-server.py` - Filesystem MCP tools
- `scripts/research-prompt.txt` - Research agent prompt

---

## Architecture Quick Reference

### Two Systems

| Aspect | Research Portal | Research Wizard |
|--------|-----------------|-----------------|
| **Purpose** | Browse completed projects | Run AI research agents |
| **Storage** | Filesystem (markdown/HTML) | SQLite database |
| **Update** | File watching | Database polling |
| **Tech** | Next.js, Zustand | ResearchManager, mcp-agent |
| **Endpoint** | `/api/projects` | `/api/research` |

### Data Storage Locations

```
RESEARCH_DIR/
├── [project-id]/               # Project directory
│   ├── README.md              # Required
│   ├── *.md or *.html files   # Content files
│   ├── metadata.json          # Project metadata
│   └── .research-progress.json # Progress tracking
└── research-wizard.db         # SQLite database
```

### State Hierarchy

```
Zustand Store
├── projects: Record<id, ResearchProject>
├── currentProjectId: string
├── currentFileName: string
├── expandedProjects: Set<string>
├── projectOrder: string[]          # Custom ordering
├── favorites: string[]             # Starred files
├── recent: { projectId, fileName }[]
├── wsConnected: boolean
├── sidebarOpen: boolean
└── commandPaletteOpen: boolean

(Persisted to localStorage under portal-* keys)
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create file: `app/api/[feature]/route.ts`
2. Implement: `GET`, `POST`, `PUT`, or `DELETE` function
3. Import dependencies: `NextRequest`, `NextResponse`
4. Add typing from `lib/types.ts`
5. Use force-dynamic: `export const dynamic = 'force-dynamic'`

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchSomething();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
```

### Adding a New React Component

1. Create file: `components/MyComponent.tsx`
2. Add `'use client'` if interactive
3. Import Zustand hooks if needed: `import { useStore } from '@/lib/store'`
4. Export component

Example:
```typescript
'use client';

import { useStore } from '@/lib/store';

export function MyComponent() {
  const projects = useStore((state) => state.projects);
  
  return <div>{/* UI here */}</div>;
}
```

### Accessing Global State

```typescript
// Read single value
const projects = useStore((state) => state.projects);

// Read multiple values
const { projects, currentProjectId } = useStore((state) => ({
  projects: state.projects,
  currentProjectId: state.currentProjectId,
}));

// Dispatch action
useStore.getState().setCurrentProject(projectId);
```

### Adding Research Progress Tracking

1. In research agent, write `.research-progress.json`:
```python
{
  "percentage": 50,
  "currentTask": "Researching...",
  "currentTaskDescription": "Detailed description",
  "completedTasks": ["task1", "task2"],
  "startedAt": "2024-01-01T00:00:00Z",
  "estimatedCompletion": "2024-01-01T02:00:00Z"
}
```

2. Backend reads and displays in `ProgressPanel.tsx`
3. UI updates automatically via polling

---

## Important Concepts

### Project ID vs Research ID

- **Project ID**: Folder name in RESEARCH_DIR (e.g., "my-research-project")
- **Research ID**: UUID for database research sessions (e.g., "ba4ff168-e890-4223-9d2a-e2a457ecde18")
- A project can have a researchId if it's tracked in the database

### Metadata Priority

When displaying project title, checked in order:
1. `metadata.json` → `title` field
2. `README.md` → YAML frontmatter `title:`
3. `README.md` → First `# Heading`
4. Folder name (fallback)

### File Safety

All file operations validate paths to prevent directory traversal:
```typescript
// Safe way to get file path
const filePath = getProjectFilePath(projectId, fileName);
// Throws error if trying to access parent directories
```

---

## Environment Variables

### Required for Development

```bash
# At least one API key:
ANTHROPIC_API_KEY=sk-ant-api03-...
# OR OPENAI_API_KEY=sk-...
# OR GOOGLE_API_KEY=AIza...

# Where to store research projects
RESEARCH_DIR=/Users/username/research
```

### Optional

```bash
# Database location (defaults to RESEARCH_DIR)
DB_PATH=/path/to/research-wizard.db

# Server port (default: 3000)
PORT=3000

# OpenCode integration
OPENCODE_URL=http://localhost:4096
```

---

## Common Patterns

### Polling Projects on Page Mount

```typescript
useEffect(() => {
  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      useStore.getState().setProjects(data.projects);
    }
  };

  fetchProjects();
  const interval = setInterval(fetchProjects, 5000);
  return () => clearInterval(interval);
}, []);
```

### Handling File Selection

```typescript
const handleFileSelect = (projectId: string, fileName: string) => {
  useStore.getState().setCurrentProject(projectId);
  useStore.getState().setCurrentFile(fileName);
  useStore.getState().addToRecent(projectId, fileName);
  router.push(`/projects/${projectId}/files/${fileName}`);
};
```

### Database Query Pattern

```typescript
const db = new ResearchDatabase(dbPath);
try {
  const research = db.getResearch(researchId);
  const agents = db.getResearchAgents(researchId);
  // Use data
} finally {
  db.close();
}
```

---

## TypeScript Interfaces Reference

### ResearchProject
```typescript
{
  id: string;                      // Folder name
  researchId?: string;             // Database UUID
  name: string;                    // Display name
  path: string;                    // Absolute path
  files: string[];                 // File names
  metadata: ResearchMetadata;      // Project metadata
  progress: ResearchProgress | null;
  createdAt: Date;
  modifiedAt: Date;
}
```

### ResearchProgress
```typescript
{
  percentage: number;              // 0-100
  currentTask?: string;
  currentTaskDescription?: string;
  completedTasks?: string[];
  startedAt?: string;              // ISO datetime
  estimatedCompletion?: string;    // ISO datetime
  updatedAt?: string;              // ISO datetime
}
```

### WebSocketMessage
```typescript
{
  type: 'initial_data' | 'projects_updated' | 'progress_updated';
  projects?: Record<string, ResearchProject>;
  projectId?: string;
  progress?: ResearchProgress;
  timestamp: string;
}
```

---

## Testing Checklist

- [ ] Fresh install with `npm install` works
- [ ] Environment variables load from `.env.local`
- [ ] Projects discovered on startup
- [ ] File changes detected within 5 seconds
- [ ] Navigation between projects works
- [ ] Favorites persist across page refresh
- [ ] Project reordering is saved
- [ ] Research creation form validates input
- [ ] Authentication flow completes
- [ ] API endpoints return correct status codes
- [ ] Error messages are user-friendly
- [ ] Database operations handle errors gracefully

---

## Debugging Tips

### Enable Detailed Logging

```typescript
// In any file
console.log('[DebugTag] message:', data);
// Prefix with bracket tags for easy filtering
```

### Check File Scanning

```bash
# From Node REPL
const { scanResearchProjects } = await import('./lib/server/file-scanner');
const projects = await scanResearchProjects();
console.log(Object.keys(projects));
```

### Verify Database

```bash
# SQLite CLI
sqlite3 /path/to/research-wizard.db

# List tables
.tables

# Query research sessions
SELECT id, topic, status FROM researches;

# Exit
.quit
```

### Monitor Project Changes

```bash
# Watch filesystem events
chokidar '/path/to/research' --initial
```

### Check Process Spawning

```bash
# List node processes
ps aux | grep node

# Check Python processes
ps aux | grep python
```

---

## Performance Tips

1. **Project Scanning**: Runs every 5 seconds, check for filesystem issues
2. **Markdown Rendering**: Large files (>10MB) may be slow, consider splitting
3. **Database Queries**: SQLite is synchronous, keep queries small
4. **State Updates**: Zustand efficiently batches updates
5. **Component Re-renders**: Use selector pattern to minimize re-renders

---

## Security Reminders

1. Never commit `.env.local` with real API keys
2. Always validate file paths to prevent traversal attacks
3. Sanitize HTML output with DOMPurify
4. Validate token format before using in requests
5. Use `force-dynamic` on dynamic routes to prevent caching

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

## Getting Help

1. Check `docs/ARCHITECTURE.md` for detailed documentation
2. Review `AGENTS.md` for research agent integration
3. Read `SETUP.md` for configuration help
4. Check `troubleshooting` section in ARCHITECTURE.md
