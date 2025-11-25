---
title: MCP Server
description: MCP (Model Context Protocol) server reference for Research Portal.
---

Research Portal exposes an MCP server that allows AI assistants to access your research library.

## Endpoint

```
http://localhost:3000/api/mcp
```

## Protocol

The MCP server implements:

- **JSON-RPC 2.0** message format
- **Server-Sent Events (SSE)** for server-to-client streaming (GET)
- **HTTP POST** for client-to-server requests

## Connection

### SSE Stream (Server to Client)

Connect to receive server notifications:

```bash
GET http://localhost:3000/api/mcp
Accept: text/event-stream
```

**Response**: Continuous stream of events

```
data: {"jsonrpc":"2.0","method":"server/connected","params":{"serverInfo":{...}}}

: keepalive

: keepalive
```

### HTTP POST (Client to Server)

Send JSON-RPC requests:

```bash
POST http://localhost:3000/api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {}
}
```

## Available Methods

### resources/list

List all available research resources.

**Request**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {}
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [
      {
        "uri": "research://project-id/file-name.md",
        "name": "Project Title - file-name.md",
        "description": "Research file from project: project-id",
        "mimeType": "text/markdown",
        "metadata": {
          "projectId": "project-id",
          "projectName": "project-id",
          "fileName": "file-name.md",
          "category": "Consumer Product Research",
          "tags": ["Product Comparison", "Buying Guide"],
          "createdAt": "2025-11-23T10:00:00.000Z",
          "modifiedAt": "2025-11-23T12:00:00.000Z"
        }
      }
    ],
    "nextCursor": null
  }
}
```

### resources/read

Read the content of a specific research resource.

**Request**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "research://project-id/README.md"
  }
}
```

**Response**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "contents": [
      {
        "uri": "research://project-id/README.md",
        "mimeType": "text/markdown",
        "text": "# Project Title\n\n## Overview\n\n..."
      }
    ]
  }
}
```

### resources/search

Search research resources by query, category, or tags.

**Request**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/search",
  "params": {
    "query": "grills",
    "category": "Consumer Product Research",
    "tags": ["Kitchen Appliances"]
  }
}
```

**Response**

Same structure as `resources/list`, filtered by search criteria.

## URI Format

Research resources use the `research://` URI scheme:

```
research://<project-id>/<file-name>
```

Examples:
- `research://indoor-grill-research/README.md`
- `research://laptop-comparison-2025/01-comprehensive-guide.md`

## Error Handling

Errors follow JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: invalid/method"
  }
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid Request (not JSON-RPC 2.0) |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

## Usage Examples

### curl

**List all resources**:

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

**Read a specific file**:

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
        headers={'Content-Type': 'application/json'},
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
        headers={'Content-Type': 'application/json'},
        json={
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'resources/read',
            'params': {'uri': uri}
        }
    )
    return response.json()['result']['contents'][0]['text']
```

## Server Info

When connecting via SSE, the server sends a welcome message:

```json
{
  "jsonrpc": "2.0",
  "method": "server/connected",
  "params": {
    "serverInfo": {
      "name": "Research Portal MCP Server",
      "version": "1.0.0",
      "capabilities": {
        "resources": true,
        "tools": false,
        "prompts": false
      }
    }
  }
}
```

**Capabilities**:
- `resources: true` - Server exposes research resources
- `tools: false` - No tools exposed (yet)
- `prompts: false` - No prompts exposed (yet)
