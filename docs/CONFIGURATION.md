# Configuration Guide

Complete setup and configuration documentation for the Research Portal project.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Environment Variables](#environment-variables)
3. [Configuration Files](#configuration-files)
4. [MCP Agent Configuration](#mcp-agent-configuration)
5. [Database Setup](#database-setup)
6. [Authentication Setup](#authentication-setup)
7. [Available Scripts](#available-scripts)
8. [Dependencies](#dependencies)

---

## Project Setup

### Prerequisites

- **Node.js**: v18+ (for Next.js 14)
- **Python**: v3.8+ (for MCP agents and research scripts)
- **UV** (Python package manager): Required for running MCP servers and research agents
- **Claude CLI**: Optional but recommended for authentication flow

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd online-research

# 2. Install Node.js dependencies
npm install

# 3. Create .env.local file (copy from .env.example)
cp .env.example .env.local

# 4. Edit .env.local with your configuration
# See "Environment Variables" section below

# 5. Set up research directory (outside project code)
mkdir -p ~/research
export RESEARCH_DIR=~/research

# 6. Start development server
npm run dev

# 7. Open http://localhost:3000 in your browser
```

---

## Environment Variables

Environment variables are loaded from `.env.local` (development) or system variables (production).

### Required Variables

#### `RESEARCH_DIR`

**Type**: String (path)  
**Default**: `[parent-directory]/research`  
**Description**: Absolute path to your research projects directory. Must be outside the project code directory for separation of concerns.

**Examples**:
```bash
RESEARCH_DIR=/Users/username/research
RESEARCH_DIR=/home/user/research
RESEARCH_DIR=/mnt/storage/research
```

**Directory Structure Example**:
```
/Users/username/
├── dev/
│   └── online-research/          # This project (application code)
│       ├── app/
│       ├── lib/
│       ├── .env.local
│       └── package.json
└── research/                       # Your research projects directory
    ├── indoor-grill-research/
    │   ├── metadata.json
    │   ├── README.md
    │   └── index.html
    ├── market-analysis-2024/
    └── competitor-research/
```

**Why Separate?**
- Keeps application code clean
- Allows research projects to be backed up independently
- Enables version control flexibility
- Supports multiple instances sharing the same research directory

---

### AI Provider Keys (Choose at least one)

#### `ANTHROPIC_API_KEY`

**Type**: String  
**Format**: `sk-ant-oat01-...` (OAuth tokens) or `sk-ant-api03-...` (API keys)  
**Get it at**: https://console.anthropic.com/settings/keys

```bash
ANTHROPIC_API_KEY=sk-ant-oat01-y2nUGWfYCALC...
```

**Token Types**:
- **OAuth Token** (`sk-ant-oat01-`): 1-year validity, obtained via `claude setup-token`
- **API Key** (`sk-ant-api03-`): Standard API keys from console

**Length**: Minimum 95 characters after prefix

---

#### `OPENAI_API_KEY`

**Type**: String  
**Format**: `sk-...`  
**Get it at**: https://platform.openai.com/api-keys

```bash
OPENAI_API_KEY=sk-proj-...
```

**Note**: Used by mcp-agent for OpenAI LLM calls. Optional if using Anthropic.

---

#### `GOOGLE_API_KEY`

**Type**: String  
**Format**: `AIza...`  
**Get it at**: https://makersuite.google.com/app/apikey

```bash
GOOGLE_API_KEY=AIzaSy...
```

**Note**: Used for Google Gemini via mcp-agent. Optional if using Anthropic or OpenAI.

---

### Optional Variables

#### `PORT`

**Type**: Number  
**Default**: `3000`  
**Description**: Server port for the Next.js application

```bash
PORT=3000
```

#### `NODE_ENV`

**Type**: String  
**Default**: `development` (dev) or `production` (build)  
**Options**: `development`, `production`  
**Note**: Automatically set by Next.js. Don't manually override.

```bash
NODE_ENV=development
```

#### `DATABASE_URL`

**Type**: String  
**Default**: `file:./research-wizard.db`  
**Description**: SQLite database location for research wizard (live sessions)

```bash
DATABASE_URL=file:./research-wizard.db
```

---

### Environment File Example

**File**: `.env.local` (development)

```bash
# Research Directory
RESEARCH_DIR=/Users/eladbenhaim/research

# AI Provider Keys (use at least one)
ANTHROPIC_API_KEY=sk-ant-oat01-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...

# Server Configuration
PORT=3000

# Database (auto-created if not exists)
DATABASE_URL=file:./research-wizard.db
```

---

### Loading Environment Variables

**Priority Order**:
1. System environment variables (highest priority)
2. `.env.local` file (development)
3. `.env` file (fallback)
4. Default values in code

**Location to check**:
- Development: `.env.local` (in project root)
- Production: System environment variables or `.env`

---

## Configuration Files

### TypeScript Configuration

**File**: `tsconfig.json`

Configures TypeScript compiler for the project. Key settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",              // Target JavaScript version
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",               // Keep JSX for Next.js
    "module": "ESNext",              // Use ES modules
    "moduleResolution": "bundler",   // Use bundler resolution (Next.js)
    "skipLibCheck": true,            // Skip type checking of dependencies
    "strict": true,                  // Enable all strict type checks
    "incremental": true,             // Incremental type checking
    
    // Path mapping for imports
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]                 // Allows @/lib/... imports
    }
  },
  "include": [
    "app/**/*",                      // Next.js app directory
    "components/**/*",
    "lib/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

**Important Settings**:
- `strict: true` - Enforces strict null checks and type safety
- `paths: "@/*"` - Enables absolute imports with `@/` prefix
- `jsx: preserve` - Lets Next.js handle JSX compilation

---

### Next.js Configuration

**File**: `next.config.js`

Configures Next.js build and runtime behavior:

```javascript
const nextConfig = {
  // Enable React strict mode (checks for problems)
  reactStrictMode: true,
  
  // Use SWC for minification (faster than Terser)
  swcMinify: true,
  
  // Allow better-sqlite3 to run on server
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}

module.exports = nextConfig
```

**Why `better-sqlite3` as external package?**
- It's a native Node.js module (not compatible with browser)
- Server Components External Packages tells Next.js not to bundle it with client code
- Allows synchronous database access on server

---

### Tailwind CSS Configuration

**File**: `tailwind.config.js`

Configures Tailwind CSS with custom Notion-like theme:

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'notion-bg-primary': 'var(--notion-bg-primary)',
        'notion-bg-secondary': 'var(--notion-bg-secondary)',
        'notion-text-primary': 'var(--notion-text-primary)',
        // ... other custom colors defined in globals.css
      },
    },
  },
}
```

**Custom Colors**:
- Defined in `lib/globals.css` as CSS variables
- Theme uses `var(--color-name)` CSS custom properties
- Dark theme optimized for readability

---

### MCP Agent Configuration

See [MCP Agent Configuration](#mcp-agent-configuration) section below.

---

## MCP Agent Configuration

The project uses **mcp-agent** for executing research tasks with Model Context Protocol (MCP) tools.

### Configuration File

**File**: `mcp_agent.config.yaml`

Located in project root. Defines MCP servers, LLM models, and logging.

```yaml
# Execution engine
execution_engine: asyncio

# MCP Server Definitions
mcp:
  servers:
    # Web research tools (web search, content scraping, etc.)
    web-research-assistant:
      command: "uvx"
      args: ["web-research-assistant"]
    
    # Filesystem tools (read/write files, create directories)
    filesystem:
      command: "uv"
      args: ["run", "python", "mcp-servers/filesystem-server.py"]

# LLM Provider Configurations
anthropic:
  default_model: "claude-sonnet-4-5"    # Claude model to use

openai:
  default_model: "gpt-5-mini"           # OpenAI model to use
  reasoning_effort: medium              # Reasoning level (fast/medium/max)

# Logging Configuration
logger:
  transports: [console]
  level: debug                          # debug, info, warn, error
```

### MCP Servers Explained

#### 1. **web-research-assistant**

**Purpose**: Web research tools for searching and gathering information

**Tools Provided** (via web-research-assistant package):
- `web_search()` - Search the web
- `web_research_assistant_search_examples()` - Find code/article examples
- `web_research_assistant_api_docs()` - Get API documentation
- `web_research_assistant_package_info()` - Look up package info
- `web_research_assistant_compare_tech()` - Compare technologies

**Installation**: Installed via `uvx` (uv package manager)

**Usage**: Called automatically when agent needs to search web

---

#### 2. **filesystem** (Custom MCP Server)

**File**: `mcp-servers/filesystem-server.py`

**Purpose**: Safe read/write operations in research projects

**Tools Provided**:
- `read_file(path)` - Read file contents
- `write_file(path, content)` - Write file to disk
- `create_directory(path)` - Create directories
- `list_directory(path)` - List directory contents
- `write_research_metadata(title, description, ...)` - Create project metadata
- `update_research_progress(percentage, current_task, ...)` - Track progress

**Safety Features**:
- Only allows operations in configured `ALLOWED_BASE_DIRS`
- Path traversal prevention (e.g., can't use `../../` to escape)
- Validates all paths before operations

**Configuration in Python**:
```python
# Called when starting research agent:
from mcp_agents.app import MCPApp

set_allowed_directories(["/Users/username/research"])
```

---

### LLM Model Selection

#### Anthropic (Claude)

**Configuration**:
```yaml
anthropic:
  default_model: "claude-sonnet-4-5"
```

**Available Models**:
- `claude-opus-4-1` - Most capable, highest cost
- `claude-sonnet-4-5` - Best balance (recommended)
- `claude-haiku-3-5` - Fastest, lowest cost

**API Key**: Set `ANTHROPIC_API_KEY` environment variable

---

#### OpenAI (GPT)

**Configuration**:
```yaml
openai:
  default_model: "gpt-5-mini"
  reasoning_effort: medium
```

**Available Models**:
- `gpt-4o` - Latest, most capable
- `gpt-4-turbo` - Previous generation
- `gpt-4` - Standard GPT-4

**Reasoning Effort Options**:
- `fast` - Quick responses, less analysis
- `medium` - Balanced (default)
- `max` - Thorough analysis, slower

**API Key**: Set `OPENAI_API_KEY` environment variable

---

### Agent Execution Flow

```
Research Request
    ↓
[research-agent.py] loads mcp_agent.config.yaml
    ↓
Initialize MCP servers:
  - web-research-assistant
  - filesystem
    ↓
Create Agent with selected LLM
    ↓
Agent receives research prompt:
  1. Call write_research_metadata()
  2. Create README.md
  3. Search web, gather info
  4. Update progress
  5. Create HTML output
    ↓
Write results to RESEARCH_DIR
    ↓
Notify portal via WebSocket
```

---

## Database Setup

The project uses **two separate database systems**:

### 1. Research Wizard Database (Live Sessions)

**Type**: SQLite  
**Location**: `~/research/research-wizard.db` (configurable)  
**Purpose**: Track active research sessions, agent activities, progress

**Database Class**: `ResearchDatabase` (lib/research-wizard/research-wizard-db.ts)

**Tables**:

#### `researches` Table
```sql
CREATE TABLE researches (
  id TEXT PRIMARY KEY,              -- UUID
  topic TEXT NOT NULL,              -- Research topic
  status TEXT NOT NULL,             -- pending|in_progress|completed|failed
  createdAt INTEGER NOT NULL,       -- Unix timestamp
  completedAt INTEGER,              -- Unix timestamp (null if not done)
  projectDir TEXT NOT NULL UNIQUE,  -- Path to project directory
  totalAgents INTEGER NOT NULL      -- Number of agents assigned
);
```

#### `agents` Table
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,              -- UUID
  researchId TEXT NOT NULL,         -- FK to researches
  name TEXT NOT NULL,               -- Agent name
  status TEXT NOT NULL,             -- pending|running|completed|failed
  startedAt INTEGER,                -- Unix timestamp
  completedAt INTEGER,              -- Unix timestamp
  taskOutput TEXT,                  -- Agent output/result
  errorMessage TEXT,                -- Error message if failed
  FOREIGN KEY (researchId) REFERENCES researches(id)
);
```

#### `activities` Table
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,              -- UUID
  agentId TEXT NOT NULL,            -- FK to agents
  timestamp INTEGER NOT NULL,       -- Unix timestamp
  action TEXT NOT NULL,             -- e.g., "tool_call", "error", "complete"
  description TEXT NOT NULL,        -- Human-readable description
  metadata TEXT,                    -- JSON metadata
  FOREIGN KEY (agentId) REFERENCES agents(id)
);
```

**Indexes** (for performance):
```sql
CREATE INDEX idx_agents_research ON agents(researchId);
CREATE INDEX idx_activities_agent ON activities(agentId);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
```

**Initialization**:
```typescript
import { ResearchDatabase } from '@/lib/research-wizard/research-wizard-db'

const db = new ResearchDatabase('./research-wizard.db')

// Create research
const research = db.createResearch(
  id,
  'My Research Topic',
  '/path/to/project'
)

// Create agent
const agent = db.createAgent(research.id, 'Research Agent')

// Log activity
db.logActivity(agent.id, 'tool_call', 'Called web_search', {
  query: 'example search'
})
```

### 2. Research Portal Projects (File-Based)

**Type**: File system (JSON + Markdown + HTML)  
**Location**: `~/research/[project-name]/`  
**Purpose**: Store completed research projects for browsing

**Structure** (per project):
```
~/research/indoor-grill-research/
├── metadata.json              # Project metadata (REQUIRED)
├── README.md                  # Overview (REQUIRED)
├── index.html                 # Main findings
├── comparison.html            # Comparisons
├── .research-progress.json    # Progress during research
└── .activities.json           # Activity log
```

**metadata.json Example**:
```json
{
  "title": "Best Indoor Grills for Apartments 2024",
  "description": "Comprehensive research on low-odor indoor grills",
  "category": "Product Research",
  "tags": ["kitchen appliances", "apartment living", "product comparison"],
  "summary": "Reviewed 15+ models focusing on smoke reduction"
}
```

**Metadata Priority**:
Portal reads project titles in this order:
1. `metadata.json` → `title` (highest priority)
2. `README.md` → YAML frontmatter `title:`
3. `README.md` → First `# Heading`
4. Folder name (fallback)

---

## Authentication Setup

### Two Authentication Flows

#### 1. Claude OAuth (Recommended)

Uses the Claude CLI to generate OAuth tokens with a browser-based flow.

**Setup**:

```bash
# 1. Install Claude CLI if not already installed
# See: https://github.com/anthropics/anthropic-sdk-python

# 2. In the Research Portal, go to /auth page
# 3. Click "Login with Claude"
# 4. Browser opens, you approve the request
# 5. Token is automatically captured and saved

# 6. Token is saved to .env.local as ANTHROPIC_API_KEY
```

**Technical Details** (lib/claude-auth.ts):
- Uses `node-pty` to create a pseudo-terminal
- Launches `claude setup-token` command
- Captures token from output
- Saves to `.env.local` for persistence
- Token format: `sk-ant-oat01-...`
- Valid for: 1 year

**Implementation**:
```typescript
import { loginWithClaude, saveTokenToEnvFile } from '@/lib/claude-auth'

const result = await loginWithClaude()
if (result.success && result.token) {
  saveTokenToEnvFile(result.token)
}
```

#### 2. Manual API Key Entry

For users who prefer manual setup or don't have Claude CLI.

**Steps**:
1. Get API key from https://console.anthropic.com/settings/keys
2. In /auth page, enter the key manually
3. Click "Save Key"
4. Key is saved to `.env.local`

**Token Validation** (lib/claude-auth.ts):
```typescript
// Valid token patterns:
// OAuth: sk-ant-oat01-[95+ alphanumeric chars]
// API: sk-ant-api03-[95+ alphanumeric chars]
```

---

### Authentication API Routes

#### `GET /api/auth/status`

Check if Claude token is configured.

**Response**:
```json
{
  "authenticated": true,
  "hasToken": true,
  "tokenType": "oauth"  // or "api"
}
```

#### `POST /api/auth/set-key`

Save API key to environment.

**Request**:
```json
{
  "token": "sk-ant-oat01-..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token saved to .env.local"
}
```

#### `POST /api/auth/claude`

Trigger OAuth flow via Claude CLI.

**Response**:
```json
{
  "success": true,
  "token": "sk-ant-oat01-..."
}
```

---

## Available Scripts

### Development Scripts

#### `npm run dev`

Start Next.js development server with hot reload.

```bash
npm run dev
# Server runs on http://localhost:3000
# Reloads on file changes
```

**Features**:
- Hot Module Replacement (HMR)
- Source maps for debugging
- File watching

---

#### `npm run build`

Create production build.

```bash
npm run build
# Creates .next/ directory with optimized bundle
```

**Outputs**:
- `.next/` - Production-ready bundle
- JavaScript minified and optimized
- CSS critical path analyzed

---

#### `npm run start`

Run production build (requires `npm run build` first).

```bash
npm run build
npm start
# Server runs on http://localhost:3000 (production mode)
```

---

#### `npm run lint`

Run ESLint to check code quality.

```bash
npm run lint
# Reports style and potential issues
```

---

#### `npm run type-check`

Run TypeScript compiler in check-only mode (no emit).

```bash
npm run type-check
# Reports all TypeScript errors
# Useful for CI/CD pipelines
```

---

### Research Agent Scripts

#### `scripts/research-agent.py`

Execute research tasks using mcp-agent framework.

**Usage**:
```bash
# From Node.js API
POST /api/research

{
  "topic": "Best indoor grills",
  "depth": "standard",
  "focus": "Apartment living",
  "style": "practical"
}

# Or directly with Python
python scripts/research-agent.py \
  --topic "Best indoor grills" \
  --output ~/research/indoor-grills-2024
```

**Parameters**:
- `--topic TEXT` - Research topic
- `--output PATH` - Output directory
- `--depth {quick|standard|deep}` - Research depth
- `--focus TEXT` - Research focus area
- `--style {comprehensive|comparing|practical}` - Output style
- `--model TEXT` - LLM model to use
- `--provider {anthropic|openai|google}` - AI provider

**Output**:
- Creates project directory
- Writes `metadata.json`
- Writes `README.md`
- Writes `.html` files with findings
- Updates `.research-progress.json`

---

#### `scripts/simulate-agent.py`

Test/demo script that simulates agent behavior without making real API calls.

```bash
python scripts/simulate-agent.py \
  --topic "Example research" \
  --output ~/research/demo-project
```

---

#### `scripts/convert-md-to-html.ts`

Convert Markdown files to HTML (utility script).

```bash
npx ts-node scripts/convert-md-to-html.ts \
  --input research-projects/project/README.md \
  --output research-projects/project/readme.html
```

---

### Available npm Scripts Summary

| Script | Purpose | Command |
|--------|---------|---------|
| `dev` | Start dev server | `npm run dev` |
| `build` | Create production build | `npm run build` |
| `start` | Run production server | `npm run start` |
| `lint` | Check code quality | `npm run lint` |
| `type-check` | Check TypeScript types | `npm run type-check` |

---

## Dependencies

### Core Dependencies

#### Framework & Server

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.0.0 | React framework with SSR/SSG |
| `react` | ^18.2.0 | UI library |
| `react-dom` | ^18.2.0 | React DOM bindings |
| `typescript` | ^5.3.0 | Type safety |

#### Database & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `better-sqlite3` | ^12.4.6 | Synchronous SQLite for Node.js |
| `dotenv` | ^17.2.3 | Load environment variables |
| `js-yaml` | ^4.1.1 | Parse YAML configuration files |

#### AI & LLM

| Package | Version | Purpose |
|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.70.1 | Anthropic Claude API client |
| `@anthropic-ai/claude-agent-sdk` | ^0.1.50 | Claude Agent framework |
| `@modelcontextprotocol/sdk` | ^1.22.0 | MCP SDK for tool integration |

#### Web & Content

| Package | Version | Purpose |
|---------|---------|---------|
| `marked` | ^17.0.1 | Markdown parser |
| `dompurify` | ^3.3.0 | Sanitize HTML/prevent XSS |
| `isomorphic-dompurify` | ^2.33.0 | DOMPurify for Node.js & browser |

#### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^3.3.0 | Utility-first CSS framework |
| `autoprefixer` | ^10.4.0 | Add vendor prefixes to CSS |
| `postcss` | ^8.4.0 | CSS transformation pipeline |
| `clsx` | ^2.0.0 | Conditional CSS class names |
| `react-resizable-panels` | ^3.0.6 | Draggable panel components |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop utilities |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable lists/grids |
| `@dnd-kit/utilities` | ^3.2.2 | DnD kit utilities |

#### State Management & Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | ^4.4.0 | Lightweight state management |
| `uuid` | ^13.0.0 | Generate unique IDs |
| `chalk` | ^5.6.2 | Colored terminal output |
| `chokidar` | ^4.0.3 | File system watching |

#### Terminal & Process Management

| Package | Version | Purpose |
|---------|---------|---------|
| `node-pty` | ^1.0.0 | Create pseudo-terminals |
| `ws` | ^8.14.0 | WebSocket implementation |

---

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/node` | ^20.19.25 | TypeScript types for Node.js |
| `@types/react` | ^18.2.0 | TypeScript types for React |
| `@types/react-dom` | ^18.2.0 | TypeScript types for React DOM |
| `@types/better-sqlite3` | ^7.6.13 | TypeScript types for SQLite |
| `@types/chokidar` | ^1.7.5 | TypeScript types for file watcher |
| `@types/ws` | ^8.5.0 | TypeScript types for WebSocket |
| `@types/js-yaml` | ^4.0.9 | TypeScript types for YAML |
| `puppeteer` | ^24.31.0 | Browser automation (testing) |

---

### Python Dependencies

Used by research agent scripts and MCP servers. Install with:

```bash
pip install mcp-agent
pip install anthropic
pip install openai
pip install python-dotenv
```

**Key Python packages**:
- `mcp-agent` - MCP agent framework
- `anthropic` - Claude API client
- `openai` - OpenAI API client
- `python-dotenv` - Load .env files
- `mcp` - Model Context Protocol SDK

---

## Configuration Best Practices

### 1. Environment Variables

**DO**:
- ✅ Use `.env.local` for development
- ✅ Set system variables for production
- ✅ Keep sensitive keys out of git (see `.gitignore`)
- ✅ Use different keys for different environments

**DON'T**:
- ❌ Commit `.env.local` to git
- ❌ Share API keys in repositories
- ❌ Use production keys in development

---

### 2. TypeScript Configuration

**DO**:
- ✅ Use `strict: true` for type safety
- ✅ Enable path aliases (`@/lib`) for cleaner imports
- ✅ Add types for external packages

**DON'T**:
- ❌ Use `any` type (defeats purpose of TypeScript)
- ❌ Ignore type errors in development

---

### 3. MCP Agent Configuration

**DO**:
- ✅ Only enable servers you need
- ✅ Set appropriate logging level (debug during development, info in production)
- ✅ Use matching model names available in your API tier

**DON'T**:
- ❌ Share `mcp_agent.config.yaml` with API keys
- ❌ Leave debug logging on in production

---

### 4. Research Directory

**DO**:
- ✅ Use absolute paths for `RESEARCH_DIR`
- ✅ Keep research directory separate from code
- ✅ Back up research directory regularly
- ✅ Set appropriate file permissions (600 for sensitive files)

**DON'T**:
- ❌ Store research inside project directory
- ❌ Use relative paths for `RESEARCH_DIR`

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Missing ANTHROPIC_API_KEY

```bash
# Check if .env.local exists
ls -la .env.local

# Check if key is set
echo $ANTHROPIC_API_KEY

# Load .env.local manually
source .env.local
echo $ANTHROPIC_API_KEY
```

### Research Directory Not Found

```bash
# Check RESEARCH_DIR
echo $RESEARCH_DIR

# Create if missing
mkdir -p ~/research

# Set in .env.local
echo "RESEARCH_DIR=/Users/username/research" >> .env.local
```

### Database Lock (SQLite)

```bash
# Close any open connections and restart server
npm run dev

# Or reset database
rm ./research-wizard.db
npm run dev  # Recreates database
```

---

## Related Documentation

- [AGENTS.md](/AGENTS.md) - Research Agent Architecture
- [API Reference](/docs/API.md) - HTTP API endpoints
- [MCP Integration](/docs/MCP.md) - Model Context Protocol setup
