# Research Wizard Implementation Guide

## Overview

The Research Wizard is a sophisticated system for triggering and managing AI-powered research projects. It combines:

- **Interactive CLI** - User-friendly wizard for starting research
- **OpenCode SDK Integration** - Leverages `task` tool to spawn background research agents
- **SQLite Database** - Small, file-based tracking of all research and agent activities
- **Real-Time Sync** - Progress updates sync to Research Portal via `.research-progress.json`
- **Side Panel UI** - React component showing active agents and research history

## Architecture Overview

```
User starts research via CLI
         ↓
Research Wizard (interactive prompts)
         ↓
Research Manager (creates directory, initializes DB)
         ↓
SQLite Database (stores research metadata)
         ↓
OpenCode SDK Task Spawning
         ↓
Background Agent Execution
         ↓
Progress File Updates (.research-progress.json)
         ↓
Research Portal + Side Panel (Real-time display)
```

## File Structure

```
research-wizard/
├── research-wizard-db.ts           # SQLite database layer
├── research-manager.ts             # Orchestration logic
├── research-wizard-cli.ts           # Interactive CLI
├── ResearchSidePanel.tsx            # React component
├── ResearchSidePanel.css            # Styling (Notion design)
├── RESEARCH-WIZARD-SETUP.md         # This file
└── package.json                     # Dependencies

research-projects/                   # Output directory
├── research-wizard.db               # SQLite database file
├── topic-name-abc123/               # Individual research projects
│   ├── README.md                    # Project overview with metadata
│   ├── 01-section-one.md            # Numbered research documents
│   ├── 02-section-two.md
│   ├── .research-progress.json      # Progress file for portal
│   └── code/                        # Code examples (optional)
└── another-topic-def456/
    └── ...
```

## Installation

### 1. Install Dependencies

```bash
npm install better-sqlite3 @opencode-ai/sdk chalk uuid
npm install --save-dev @types/node @types/react typescript
```

### 2. Create Database Directory

```bash
mkdir -p research-projects
```

### 3. Compile TypeScript

```bash
npx tsc research-wizard-db.ts research-manager.ts research-wizard-cli.ts
```

## Usage

### Start the Interactive Wizard

```bash
node research-wizard-cli.js
```

### What Happens When You Start a Research

1. **CLI Wizard prompts you for:**
   - Research topic (e.g., "Low-Odor Indoor Grills")
   - Depth (quick/standard/deep)
   - Focus area (optional)
   - Style (comprehensive/comparing/practical)

2. **Research Manager:**
   - Creates a project directory
   - Initializes `.research-progress.json`
   - Creates initial `README.md` with metadata
   - Creates database records

3. **OpenCode Task Spawning:**
   - Uses `createOpencodeClient()` to connect to running OpenCode server
   - Creates a new session
   - Sends research prompt to AI agent
   - Streams back responses

4. **Agent Processing:**
   - AI researches the topic
   - Parses response into markdown sections
   - Creates numbered markdown files
   - Logs activities to database
   - Updates progress file in real-time

5. **Database Updates:**
   - Every action logged to `activities` table
   - Agent status tracked in `agents` table
   - Research completion tracked in `researches` table

6. **Portal/UI Updates:**
   - `.research-progress.json` updated continuously
   - Research Portal auto-detects and displays changes
   - Side panel shows active agents in real-time

## Database Schema

### researches table
```sql
id TEXT PRIMARY KEY
topic TEXT NOT NULL
status TEXT (pending/in_progress/completed/failed)
createdAt INTEGER (timestamp)
completedAt INTEGER (optional)
projectDir TEXT UNIQUE
totalAgents INTEGER
```

### agents table
```sql
id TEXT PRIMARY KEY
researchId TEXT FOREIGN KEY
name TEXT
status TEXT (pending/running/completed/failed)
startedAt INTEGER (optional)
completedAt INTEGER (optional)
taskOutput TEXT (optional)
errorMessage TEXT (optional)
```

### activities table
```sql
id TEXT PRIMARY KEY
agentId TEXT FOREIGN KEY
timestamp INTEGER
action TEXT (research_started, session_created, file_created, etc.)
description TEXT
metadata TEXT (JSON, optional)
```

## API Examples

### Using the Research Manager Programmatically

```typescript
import { ResearchManager } from "./research-manager"

const manager = new ResearchManager(
  "http://localhost:4096",  // OpenCode server URL
  "./research-projects"      // Output directory
)

// Start a research
const researchId = await manager.startResearch({
  topic: "Best Coffee Machines",
  depth: "standard",
  focus: "for small apartments",
  style: "comparing",
})

// Get status
const status = await manager.getResearchStatus(researchId)
console.log(status.research.status) // "in_progress" or "completed"

// Get all researches
const { researches, stats } = manager.getAllResearches()
```

### Using the Database Directly

```typescript
import { ResearchDatabase } from "./research-wizard-db"

const db = new ResearchDatabase("./research-projects/research-wizard.db")

// Create research
const research = db.createResearch(
  "uuid123",
  "Coffee Machines",
  "/path/to/project"
)

// Log activity
db.logActivity(
  "agent_123",
  "file_created",
  "Created 01-guide.md",
  { size: 5000 }
)

// Get stats
const stats = db.getStats()
console.log(stats.researches.completed)

db.close()
```

## Integration with Research Portal

The wizard automatically creates `.research-progress.json` files that the Research Portal monitors:

```json
{
  "percentage": 45,
  "currentTask": "Analyzing competitor features",
  "currentTaskDescription": "Searching for competitive advantages",
  "completedTasks": [
    "Researched product specifications",
    "Gathered customer feedback"
  ],
  "startedAt": "2025-11-22T10:30:00Z",
  "estimatedCompletion": "2025-11-22T11:00:00Z"
}
```

The Portal:
- Polls every 5 seconds for changes
- Displays progress bar
- Shows current task
- Lists completed tasks
- Updates in real-time

## Integration with Side Panel

The React component `ResearchSidePanel` displays:

### Active Agents Tab
- List of running research projects
- Agent status (running/completed/failed)
- Start/completion times
- Direct links to project files

### History Tab
- Statistics overview
- Complete list of past researches
- Recent activities log
- Filterable and searchable

### Real-Time Updates
- Auto-refreshes every 3 seconds
- Syncs with database
- Shows latest agent activities
- Displays completion status

## Configuration

### OpenCode Server URL
Default: `http://localhost:4096`

Set custom URL:
```typescript
const manager = new ResearchManager("http://custom-server:4096")
```

Or via environment variable:
```bash
OPENCODE_URL=http://custom-server:4096 node research-wizard-cli.js
```

### Research Output Directory
Default: `./research-projects`

Set custom directory:
```typescript
const manager = new ResearchManager(
  "http://localhost:4096",
  "/custom/path/to/research"
)
```

### Database Path
Default: `{baseResearchDir}/research-wizard.db`

Automatically created if missing.

## Deployment Scenarios

### Scenario 1: Single Developer Local
```bash
# Terminal 1: Start OpenCode server
opencode

# Terminal 2: Run research wizard
node research-wizard-cli.js

# Browser: View Research Portal
http://localhost:3000
```

### Scenario 2: CI/CD Integration
```typescript
// In GitHub Actions, GitLab CI, etc.
import { ResearchManager } from "./research-manager"

const manager = new ResearchManager(
  process.env.OPENCODE_SERVER_URL
)

await manager.startResearch({
  topic: "Competitor Analysis",
  depth: "deep"
})

// Let agent run in background
// Webhook can trigger downstream processes
```

### Scenario 3: Multi-Tenant SaaS
```typescript
// Create isolated manager per tenant
const managers = new Map()

for (const tenant of tenants) {
  managers.set(
    tenant.id,
    new ResearchManager(
      tenant.opencodeUrl,
      `/data/research/${tenant.id}`
    )
  )
}

// Each tenant has isolated DB and files
```

## Advanced Features

### Custom Progress Updates
The research agent can update progress at any time:

```typescript
updateProgressFile(projectDir, 50, "Processing responses", [
  "Gathered data",
])
```

### Activity Logging
Every operation is logged for audit trails:

```typescript
db.logActivity(
  agentId,
  "api_call",
  "Called OpenAI API",
  { model: "gpt-4", tokens: 2500 }
)
```

### Batch Research
Start multiple researches in parallel:

```typescript
const topics = [
  "Coffee Machines",
  "Espresso Machines",
  "Coffee Grinders",
]

const researchIds = await Promise.all(
  topics.map(topic =>
    manager.startResearch({ topic, depth: "standard" })
  )
)
```

## Troubleshooting

### Research not starting?
- Ensure OpenCode server is running: `opencode`
- Check server URL is correct
- Verify network connectivity

### Database locked?
- Close other processes accessing the database
- Delete `research-wizard.db` and retry (loses history)

### Progress file not updating?
- Check project directory permissions
- Verify disk space available
- Check `.research-progress.json` is writable

### No activities showing in side panel?
- Refresh the page
- Check database file exists
- Verify activities table has records: `sqlite3 research-wizard.db "SELECT COUNT(*) FROM activities"`

## Performance Considerations

### Database
- WAL mode enabled for concurrent access
- Indexes on foreign keys for fast queries
- In-memory cache optional for high-volume reads

### Progress Updates
- Batched writes to minimize I/O
- Debounced updates to 1-second intervals
- Async writes don't block research

### UI Updates
- 3-second refresh interval balances responsiveness and performance
- Lazy loading for long activity lists
- Virtual scrolling for large lists (future enhancement)

## Security Considerations

1. **Database File**
   - Located in project directory
   - Readable/writable by process owner
   - Consider encryption for sensitive data

2. **Research Files**
   - Plain markdown files
   - No authentication required
   - Consider access controls in multi-user environments

3. **OpenCode Connection**
   - Uses local network by default
   - No authentication built-in
   - Use firewall/network policies in production

4. **Activity Logging**
   - All activities logged to database
   - Useful for audit trails
   - Consider PII in logged data

## Future Enhancements

- [ ] Web UI for research management (vs CLI only)
- [ ] Research templates (for consistent structure)
- [ ] Team collaboration (shared research projects)
- [ ] Scheduled research (run on a schedule)
- [ ] Research versioning (track changes over time)
- [ ] Export to PDF/docx
- [ ] Integration with other tools (Slack, Discord, email)
- [ ] Custom agent instructions
- [ ] Research quality scoring
- [ ] Cost tracking per research

## Support

For issues or feature requests:
- Check troubleshooting section above
- Review OpenCode SDK documentation
- Open issue on GitHub
- Join Discord community

## License

MIT - Use freely in your projects!
