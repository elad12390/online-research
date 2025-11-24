# MCP Server Documentation

## Overview

The Research Portal exposes an **MCP (Model Context Protocol) Server** that allows AI agents to access the research database programmatically.

**Endpoint**: `http://localhost:3000/api/mcp`

## Protocol

The MCP server implements:
- **JSON-RPC 2.0** for message format
- **Server-Sent Events (SSE)** for server-to-client streaming (GET)
- **HTTP POST** for client-to-server requests

## Connection

### SSE Stream (Server to Client)

Connect to the SSE stream to receive server notifications:

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

Send JSON-RPC requests via POST:

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

### 1. `resources/list`

List all available research resources.

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {}
}
```

**Response**:
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

### 2. `resources/read`

Read the content of a specific research resource.

**Request**:
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

**Response**:
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

### 3. `resources/search`

Search research resources by query, category, or tags.

**Request**:
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

**Response**: Same structure as `resources/list`, but filtered results.

## URI Format

Research resources use the `research://` URI scheme:

```
research://<project-id>/<file-name.md>
```

Examples:
- `research://indoor-grill-research/README.md`
- `research://laptop-comparison-2025/01-comprehensive-guide.md`

## Error Handling

The server returns JSON-RPC error responses for failures:

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

### Node.js / TypeScript

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
import json

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

## Use Cases

### AI Agent Integration

AI agents can use the MCP server to:

1. **Discover research projects**: List all available research using `resources/list`
2. **Search for topics**: Find relevant research with `resources/search`
3. **Read research content**: Access full markdown content with `resources/read`
4. **Answer questions**: Use research data to answer user queries
5. **Generate summaries**: Create summaries from multiple research documents

### Example: Research Assistant Agent

```typescript
class ResearchAssistant {
  async searchForTopic(topic: string) {
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/search',
        params: { query: topic }
      })
    });

    const data = await response.json();
    return data.result.resources;
  }

  async getResearchDetails(uri: string) {
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

  async answerQuestion(question: string) {
    // 1. Search for relevant research
    const resources = await this.searchForTopic(question);

    // 2. Read content from top results
    const contents = await Promise.all(
      resources.slice(0, 3).map(r => this.getResearchDetails(r.uri))
    );

    // 3. Use LLM to generate answer from research content
    // (implementation depends on your LLM integration)
  }
}
```

## Testing

Run the test client to verify the MCP server is working:

```bash
npx tsx scripts/test-mcp.ts
```

Expected output:
```
🧪 Testing MCP Endpoint...

1️⃣ Testing resources/list...
✅ resources/list: 50 resources found

2️⃣ Testing resources/read...
✅ resources/read: research://project-id/README.md
   Content length: 3378 characters

3️⃣ Testing resources/search...
✅ resources/search: 50 resources found

4️⃣ Testing SSE stream (GET)...
✅ SSE stream connected
```

## Server Info

When you connect to the SSE stream, the server sends a welcome message:

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

## Future Enhancements

Potential additions to the MCP server:

1. **Tools**: Expose tools for creating/updating research projects
2. **Prompts**: Provide pre-built prompts for common research tasks
3. **Webhooks**: Notify clients when new research is added
4. **Filtering**: Advanced filtering by date, author, status
5. **Pagination**: Support for large result sets
6. **Authentication**: API key or OAuth for secure access
