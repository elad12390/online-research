---
title: MCP Integration
description: Let Claude Desktop (and other AI tools) access your research library.
---

Research Portal supports [MCP (Model Context Protocol)](https://modelcontextprotocol.io/), which means AI assistants like Claude Desktop can search and read your research library directly.

## Why This Matters

Imagine you've researched "best database for time-series data" last month. Now you're in Claude Desktop discussing a new project. Instead of alt-tabbing to find that research, Claude can just... read it.

"Based on your previous research on time-series databases, you found that TimescaleDB was best for your use case because..."

Your research becomes context for future AI conversations.

---

## Claude Desktop Setup

### 1. Install uv (if you haven't)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Add to Claude Desktop Config

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "web-research-assistant": {
      "command": "uvx",
      "args": ["web-research-assistant"],
      "env": {
        "SEARXNG_URL": "http://localhost:8080"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Close and reopen. That's it.

### 4. Test It

Ask Claude:

> "Can you search the web for the latest Next.js 15 features?"

Claude should use the web search tools. If it works, you're connected.

---

## What Claude Can Do

With MCP connected, Claude Desktop gains:

**Web Search**
- Search via your SearXNG instance
- Find code examples and tutorials
- Look up API documentation
- Get package info from npm/PyPI

**Research Access** (via Research Portal's MCP endpoint)
- List your research projects
- Read research documents
- Search across your research library

---

## Using Your Research Library

Research Portal also exposes an MCP server at `localhost:3000/api/mcp`.

To give Claude access to your research (not just web search), you can query it directly:

```bash
# List all research
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}'
```

For full MCP client integration, see the [MCP Server Reference](/online-research/reference/mcp-server/).

---

## OpenCode Integration

If you use OpenCode, add to your config:

```yaml
mcpServers:
  web-research:
    command: "uvx"
    args: ["web-research-assistant"]
    env:
      SEARXNG_URL: "http://localhost:8080"
```

Same deal — your coding assistant can now search the web and reference your research.

---

## Troubleshooting

**"uvx: command not found"**

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then restart your terminal.

**Claude doesn't see the tools**

1. Make sure you saved the config file
2. Completely quit and restart Claude Desktop (not just close the window)
3. Check the config file is valid JSON

**Web search returns nothing**

SearXNG might not be running:
```bash
docker compose --profile search up -d
curl http://localhost:8080  # Should return HTML
```

**"Connection refused" errors**

Make sure Research Portal is running:
```bash
curl http://localhost:3000/api/health
```
