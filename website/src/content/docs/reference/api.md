---
title: API Reference
description: Complete REST API reference for Research Portal.
---

This document provides a complete reference for Research Portal's REST API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints don't require authentication. Research creation requires a configured API key for the selected provider.

---

## Projects

### List Projects

```http
GET /api/projects
```

Returns all research projects.

**Response**

```json
{
  "projects": {
    "project-id": {
      "id": "project-id",
      "name": "Project Name",
      "path": "/path/to/project",
      "files": ["README.md", "index.html"],
      "metadata": {
        "title": "Project Title",
        "category": "Research",
        "tags": ["tag1", "tag2"]
      },
      "progress": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "modifiedAt": "2024-01-01T12:00:00.000Z"
    }
  },
  "count": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Project

```http
GET /api/projects/{id}
```

Returns a specific project.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Project ID (folder name) |

**Response**

```json
{
  "id": "project-id",
  "name": "Project Name",
  "path": "/path/to/project",
  "files": ["README.md", "index.html"],
  "metadata": {...},
  "progress": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "modifiedAt": "2024-01-01T12:00:00.000Z"
}
```

### Get File Content

```http
GET /api/projects/{id}/files/{filename}
```

Returns file content with rendered HTML.

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `id` | string | Project ID |
| `filename` | string | File name |

**Response**

```json
{
  "fileName": "README.md",
  "projectId": "project-id",
  "content": "# Raw Markdown Content...",
  "html": "<h1>Rendered HTML...</h1>",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Project Progress

```http
GET /api/projects/{id}/progress
```

Returns research progress for a project.

**Response**

```json
{
  "projectId": "project-id",
  "progress": {
    "percentage": 75,
    "currentTask": "Analyzing data",
    "currentTaskDescription": "Comparing product features",
    "completedTasks": ["Research", "Data collection"],
    "startedAt": "2024-01-01T10:00:00.000Z",
    "estimatedCompletion": "2024-01-01T11:00:00.000Z"
  },
  "timestamp": "2024-01-01T10:45:00.000Z"
}
```

---

## Research

### Create Research

```http
POST /api/research
```

Start a new research project.

**Request Body**

```json
{
  "topic": "Best indoor grills for apartments",
  "depth": "standard",
  "focus": "smoke reduction",
  "style": "practical",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | string | Yes | - | Research topic |
| `depth` | string | No | `standard` | `quick`, `standard`, `deep` |
| `focus` | string | No | - | Research focus area |
| `style` | string | No | `comprehensive` | `comprehensive`, `comparing`, `practical` |
| `provider` | string | No | `anthropic` | `anthropic`, `openai`, `google` |
| `model` | string | No | Provider default | LLM model to use |

**Response**

```json
{
  "researchId": "uuid-string",
  "status": "started"
}
```

**Errors**

| Status | Description |
|--------|-------------|
| 400 | Missing topic |
| 503 | API key not configured |

### List Research

```http
GET /api/research
```

Returns all research projects with statistics.

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | `activities` to get recent activities only |
| `limit` | number | Max activities to return (default 50) |

**Response**

```json
{
  "researches": [
    {
      "id": "uuid",
      "topic": "Research Topic",
      "status": "completed",
      "createdAt": 1704067200,
      "completedAt": 1704070800,
      "projectDir": "/path/to/project"
    }
  ],
  "stats": {
    "researches": { "total": 10, "completed": 8 },
    "agents": { "total": 10, "completed": 8 },
    "activities": 150
  },
  "recentActivities": [...]
}
```

### Get Research

```http
GET /api/research/{id}
```

Returns research details with agent activities.

**Response**

```json
{
  "research": {
    "id": "uuid",
    "topic": "Research Topic",
    "status": "in_progress",
    "createdAt": 1704067200,
    "projectDir": "/path/to/project"
  },
  "agents": [
    {
      "id": "agent-uuid",
      "name": "Research Agent",
      "status": "running",
      "activities": [
        {
          "id": "activity-uuid",
          "timestamp": 1704067500,
          "action": "tool_call",
          "description": "Called web_search",
          "metadata": {}
        }
      ]
    }
  ],
  "progress": {
    "percentage": 50,
    "currentTask": "Searching"
  }
}
```

### Delete Research

```http
DELETE /api/research/{id}
```

Delete a research project and its files.

**Response**

```json
{
  "success": true
}
```

### Send Message

```http
POST /api/research/{id}/message
```

Send a message to the research agent.

**Request Body**

```json
{
  "message": "Can you focus more on price comparisons?"
}
```

**Response**

```json
{
  "success": true,
  "message": "Message logged",
  "logged": true,
  "filePath": "/path/to/.messages.json",
  "resumed": false
}
```

### Stop Research

```http
POST /api/research/{id}/stop
```

Stop a running research.

**Response**

```json
{
  "success": true,
  "message": "Research stopped"
}
```

---

## Authentication

### Get Auth Status

```http
GET /api/auth/status
```

Check API provider configuration status.

**Response**

```json
{
  "providers": {
    "anthropic": { "hasKey": true, "keyValid": true },
    "openai": { "hasKey": false, "keyValid": false },
    "google": { "hasKey": false, "keyValid": false }
  },
  "hasAnyProvider": true
}
```

### Set API Key

```http
POST /api/auth/set-key
```

Set an API key for a provider.

**Request Body**

```json
{
  "provider": "anthropic",
  "apiKey": "sk-ant-api03-..."
}
```

**Response**

```json
{
  "success": true,
  "hasAnyProvider": true
}
```

### Get Claude Status

```http
GET /api/auth/claude
```

Check Claude-specific authentication.

**Response**

```json
{
  "authenticated": true,
  "hasToken": true,
  "tokenValid": true,
  "cliInstalled": true,
  "tokenType": "oauth"
}
```

### Claude Login

```http
POST /api/auth/claude
```

Trigger Claude OAuth flow or set token.

**Request Body**

```json
{
  "action": "login"
}
```

Or:

```json
{
  "action": "set_token",
  "token": "sk-ant-oat01-..."
}
```

**Response**

```json
{
  "success": true,
  "message": "Token saved",
  "tokenType": "oauth",
  "requiresRestart": true
}
```

---

## Health

### Health Check

```http
GET /api/health
```

Server health check.

**Response**

```json
{
  "status": "ok",
  "projectCount": 15,
  "researchDir": "/path/to/research",
  "connectedClients": 2,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## MCP Server

### MCP Endpoint

```http
POST /api/mcp
```

MCP JSON-RPC endpoint for AI tool access.

**Request Body**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {}
}
```

**Available Methods**

| Method | Description |
|--------|-------------|
| `resources/list` | List all research resources |
| `resources/read` | Read resource content |
| `resources/search` | Search resources |

See [MCP Server Reference](/online-research/reference/mcp-server/) for details.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding a reverse proxy with rate limiting.
