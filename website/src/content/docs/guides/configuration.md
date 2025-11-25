---
title: Configuration
description: Complete guide to configuring Research Portal.
---

This guide covers all configuration options for Research Portal.

## Environment Variables

Environment variables are loaded from `.env.local` (development) or system variables (production).

### Required Variables

#### `RESEARCH_DIR`

**Type**: String (absolute path)  
**Default**: `./research`

Directory where research projects are stored. Should be outside the application code.

```bash
RESEARCH_DIR=/Users/username/research
```

:::tip[Directory Structure]
```
/Users/username/
├── dev/online-research/     # Application code
└── research/                 # Research projects (RESEARCH_DIR)
    ├── project-1/
    └── project-2/
```
:::

### AI Provider Keys

At least one provider key is required:

#### `ANTHROPIC_API_KEY`

**Format**: `sk-ant-oat01-...` (OAuth) or `sk-ant-api03-...` (API key)  
**Get it at**: https://console.anthropic.com/settings/keys

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

#### `OPENAI_API_KEY`

**Format**: `sk-...`  
**Get it at**: https://platform.openai.com/api-keys

```bash
OPENAI_API_KEY=sk-proj-...
```

#### `GOOGLE_API_KEY`

**Format**: `AIza...`  
**Get it at**: https://makersuite.google.com/app/apikey

```bash
GOOGLE_API_KEY=AIzaSy...
```

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `PORTAL_PORT` | `3000` | Docker portal port |
| `SEARXNG_PORT` | `8080` | SearXNG port |
| `DATABASE_URL` | `file:./research-wizard.db` | SQLite database location |
| `NODE_ENV` | `development` | Environment mode |

## MCP Agent Configuration

The `mcp_agent.config.yaml` file configures the research agent:

```yaml
# Execution engine
execution_engine: asyncio

# MCP Server definitions
mcp:
  servers:
    # Web research tools
    web-research-assistant:
      command: "uvx"
      args: ["web-research-assistant"]
    
    # Filesystem tools
    filesystem:
      command: "uv"
      args: ["run", "python", "mcp-servers/filesystem-server.py"]

# LLM configurations
anthropic:
  default_model: "claude-sonnet-4-5"

openai:
  default_model: "gpt-4o"
  reasoning_effort: medium

# Logging
logger:
  transports: [console]
  level: debug
```

### Available Models

#### Anthropic Claude

| Model | Best For |
|-------|----------|
| `claude-opus-4-1` | Most capable, highest cost |
| `claude-sonnet-4-5` | Best balance (recommended) |
| `claude-haiku-3-5` | Fastest, lowest cost |

#### OpenAI GPT

| Model | Best For |
|-------|----------|
| `gpt-4o` | Latest, most capable |
| `gpt-4-turbo` | Fast, capable |
| `o1` | Complex reasoning |

### MCP Servers

#### web-research-assistant

Web search and research tools:

- `web_search()` - Search the web
- `search_examples()` - Find code/article examples
- `api_docs()` - Get API documentation
- `package_info()` - Look up package info
- `compare_tech()` - Compare technologies

#### filesystem

File operations for research projects:

- `read_file()` - Read file contents
- `write_file()` - Write files
- `create_directory()` - Create directories
- `write_research_metadata()` - Write project metadata
- `update_research_progress()` - Track progress

## Search Engine Configuration

Configure which search engines SearXNG uses in `.env`:

```bash
# Enable/disable search engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true
SEARCH_ARXIV=false
SEARCH_REDDIT=false
```

Or edit `searxng/settings.yml` directly for advanced configuration.

## TypeScript Configuration

`tsconfig.json` key settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

The `@/*` path alias enables clean imports:

```typescript
import { useStore } from '@/lib/store';
import { ResearchProject } from '@/lib/types';
```

## Tailwind CSS Configuration

`tailwind.config.js` extends with custom Notion-style colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'notion-bg-primary': 'var(--notion-bg-primary)',
        'notion-text-primary': 'var(--notion-text-primary)',
        // ...
      },
    },
  },
}
```

Colors are defined as CSS variables in `app/globals.css`.

## Next.js Configuration

`next.config.js` key settings:

```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}
```

`better-sqlite3` is marked as external because it's a native Node.js module.

## Best Practices

### Environment Variables

- Use `.env.local` for development
- Set system variables for production
- Never commit API keys to git
- Use different keys for different environments

### Research Directory

- Use absolute paths
- Keep separate from application code
- Back up regularly
- Set appropriate file permissions

### MCP Agent

- Only enable needed servers
- Use `debug` logging during development
- Switch to `info` in production
- Match model names to your API tier
