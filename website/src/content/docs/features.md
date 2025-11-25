---
title: Features
description: Complete feature list for Research Portal.
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Core Features

<CardGrid>
  <Card title="AI Research Wizard" icon="rocket">
    Start automated research by describing your topic. AI agents search the web, analyze findings, and generate comprehensive reports.
  </Card>
  <Card title="Multi-Provider LLM" icon="seti:config">
    Choose from Anthropic Claude, OpenAI GPT, or Google Gemini based on your needs and preferences.
  </Card>
  <Card title="Private Search" icon="magnifier">
    Self-hosted SearXNG provides private web search with no tracking or data collection.
  </Card>
  <Card title="Real-Time Progress" icon="approve-check">
    Watch research progress in real-time with live updates on tasks and completion status.
  </Card>
</CardGrid>

## User Interface

### Research Portal Dashboard

- **Three-panel layout** with resizable sections
- **Project sidebar** with search and filtering
- **Document viewer** with markdown and HTML support
- **Progress panel** for active research tracking
- **Command palette** (Cmd/Ctrl+K) for quick navigation

### Project Organization

- **Drag-and-drop** project reordering
- **Favorites** for quick access to important files
- **Recent items** tracking
- **Search and filter** across all projects
- **Custom metadata** display (title, category, tags)

### Document Features

- **Markdown rendering** with syntax highlighting
- **HTML support** for rich content
- **Code block** syntax highlighting
- **Table formatting**
- **Auto-generated navigation**

## Research Wizard

### Research Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| **Topic** | Free text | What you want to research |
| **Depth** | Quick / Standard / Deep | How thorough the research should be |
| **Focus** | Free text | Specific aspect to emphasize |
| **Style** | Comprehensive / Comparing / Practical | Output format style |

### AI Providers

| Provider | Models | Strengths |
|----------|--------|-----------|
| **Anthropic** | Claude Sonnet 4.5, Opus 4.1, Haiku 3.5 | Nuanced analysis, complex reasoning |
| **OpenAI** | GPT-4o, GPT-4 Turbo, o1 | General research, coding tasks |
| **Google** | Gemini Pro | Fast iterations, multimodal |

### Live Research Chat

- **Real-time activity** streaming
- **Agent thoughts** and reasoning display
- **Tool call** tracking with results
- **Progress bar** with current task
- **Continue conversation** after completion

## MCP Integration

### Exposed Resources

The MCP server exposes your research library:

```
resources/list   - List all research projects
resources/read   - Read document content
resources/search - Search across research
```

### Compatible Clients

- Claude Desktop
- OpenCode CLI
- Custom MCP clients
- Any JSON-RPC 2.0 client

### Web Research Tools

- `web_search()` - Search the web
- `search_examples()` - Find code/tutorials
- `api_docs()` - API documentation lookup
- `package_info()` - Package registry info
- `compare_tech()` - Technology comparisons
- `translate_error()` - Error message solutions

## Search Features

### SearXNG Integration

- **Self-hosted** - Full control, no tracking
- **Configurable engines** - Google, Bing, DuckDuckGo, etc.
- **Multiple categories** - General, news, images, videos
- **Result aggregation** - Combines multiple sources

### Supported Engines

| Engine | Type | Default |
|--------|------|---------|
| Google | General | Enabled |
| Bing | General | Enabled |
| DuckDuckGo | General | Enabled |
| Wikipedia | Reference | Enabled |
| GitHub | Code | Enabled |
| Stack Overflow | Code | Enabled |
| arXiv | Academic | Disabled |
| Reddit | Social | Disabled |

## Data Management

### Project Structure

```
project-directory/
├── metadata.json              # Project metadata
├── README.md                  # Overview document
├── *.html                     # Research findings
├── .research-progress.json    # Progress tracking
└── .activities.json           # Agent activities
```

### Metadata System

Projects support rich metadata:

```json
{
  "title": "Project Title",
  "description": "Brief description",
  "category": "Product Research",
  "tags": ["tag1", "tag2"],
  "summary": "Executive summary"
}
```

### Progress Tracking

Real-time progress with:

- Percentage complete
- Current task name
- Task description
- Completed tasks list
- Time estimates

## API Features

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects/[id]` | GET | Get project details |
| `/api/projects/[id]/files/[name]` | GET | Get file content |
| `/api/research` | POST | Start new research |
| `/api/research/[id]` | GET | Get research status |
| `/api/research/[id]/message` | POST | Send message to agent |
| `/api/health` | GET | Health check |

### MCP Protocol

- JSON-RPC 2.0 over HTTP
- Server-Sent Events for streaming
- Research library access
- Full protocol compliance

## Developer Features

### Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Full type safety
- **Zustand** - State management
- **SQLite** - Research session database
- **Tailwind CSS** - Styling

### Extensibility

- Custom MCP servers
- Custom research prompts
- Custom output formats
- Plugin architecture (planned)

### Security

- Path traversal prevention
- HTML sanitization (DOMPurify)
- Token validation
- No external tracking

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Escape` | Close command palette |
| `Enter` | Select item in palette |
| `Shift + Enter` | Send message in chat |

## Planned Features

Future enhancements include:

- [ ] WebSocket real-time updates
- [ ] Full-text search across projects
- [ ] Multi-user support
- [ ] Research collaboration
- [ ] PDF/DOCX export
- [ ] Custom themes
- [ ] Mobile responsive design
- [ ] API rate limiting
- [ ] Batch operations
