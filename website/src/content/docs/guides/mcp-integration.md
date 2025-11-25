---
title: MCP Integration
description: Integrate Research Portal with Claude Desktop and other MCP clients.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

Research Portal works with any MCP (Model Context Protocol) client, including Claude Desktop, OpenCode, and custom implementations.

## What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI assistants to external data sources and tools. Research Portal implements MCP to:

- Expose your research library to AI assistants
- Enable AI to search and read your research
- Provide web search capabilities via SearXNG

## Claude Desktop Integration

### Configuration

Add the following to your Claude Desktop config:

<Tabs>
  <TabItem label="macOS">
    Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
    
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
  </TabItem>
  <TabItem label="Windows">
    Edit `%APPDATA%\Claude\claude_desktop_config.json`:
    
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
  </TabItem>
  <TabItem label="Linux">
    Edit `~/.config/Claude/claude_desktop_config.json`:
    
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
  </TabItem>
</Tabs>

### Prerequisites

1. **Install uv** (Python package manager):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Start SearXNG** (if using web search):
   ```bash
   docker compose --profile search up -d
   ```

3. **Restart Claude Desktop** to load the new configuration

### Verify Integration

In Claude Desktop, ask:

> "Can you search the web for the latest React 19 features?"

Claude should use the web-research-assistant tools to search and return results.

## Available MCP Tools

When integrated, Claude has access to these tools:

### Web Search Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web via SearXNG |
| `search_examples` | Find code examples and tutorials |
| `api_docs` | Fetch API documentation |
| `package_info` | Look up npm/PyPI package info |
| `compare_tech` | Compare technologies side-by-side |
| `translate_error` | Find solutions for error messages |

### Research Portal Tools

| Tool | Description |
|------|-------------|
| `resources/list` | List all research projects |
| `resources/read` | Read research document content |
| `resources/search` | Search across research |

## Research Portal MCP Server

Research Portal also exposes an MCP server for accessing your research library.

### Endpoint

```
http://localhost:3000/api/mcp
```

### Protocol

- **SSE (GET)**: Server-to-client streaming
- **JSON-RPC (POST)**: Client-to-server requests

### Example: List Resources

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/list",
    "params": {}
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [
      {
        "uri": "research://project-id/README.md",
        "name": "Project Title - README.md",
        "mimeType": "text/markdown"
      }
    ]
  }
}
```

### Example: Read Resource

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "research://my-project/README.md"
    }
  }'
```

## OpenCode Integration

For OpenCode CLI, add to your `opencode.yaml`:

```yaml
mcpServers:
  research-portal:
    command: "curl"
    args: ["-X", "POST", "http://localhost:3000/api/mcp"]
```

Or use the web-research-assistant directly:

```yaml
mcpServers:
  web-research:
    command: "uvx"
    args: ["web-research-assistant"]
    env:
      SEARXNG_URL: "http://localhost:8080"
```

## Custom MCP Client

Build your own client using the MCP SDK:

### TypeScript

```typescript
async function listResources() {
  const response = await fetch('http://localhost:3000/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
      params: {}
    })
  });
  
  const data = await response.json();
  return data.result.resources;
}

async function readResource(uri: string) {
  const response = await fetch('http://localhost:3000/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri }
    })
  });
  
  const data = await response.json();
  return data.result.contents[0].text;
}
```

### Python

```python
import requests

def list_resources():
    response = requests.post(
        'http://localhost:3000/api/mcp',
        json={
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'resources/list',
            'params': {}
        }
    )
    return response.json()['result']['resources']

def read_resource(uri):
    response = requests.post(
        'http://localhost:3000/api/mcp',
        json={
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'resources/read',
            'params': {'uri': uri}
        }
    )
    return response.json()['result']['contents'][0]['text']
```

## URI Format

Research resources use the `research://` URI scheme:

```
research://<project-id>/<file-name>
```

Examples:
- `research://indoor-grill-research/README.md`
- `research://market-analysis-2024/findings.html`

## Troubleshooting

### "uvx: command not found"

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### SearXNG Not Responding

Check if SearXNG is running:
```bash
curl http://localhost:8080
```

Start if needed:
```bash
docker compose --profile search up -d
```

### Claude Desktop Not Finding Tools

1. Restart Claude Desktop after config changes
2. Check config file syntax (valid JSON)
3. Verify the config file path is correct

### MCP Server Connection Refused

Ensure Research Portal is running:
```bash
curl http://localhost:3000/api/health
```
