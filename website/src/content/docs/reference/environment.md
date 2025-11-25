---
title: Environment Variables
description: Complete reference for Research Portal environment variables.
---

This document provides a complete reference for all environment variables.

## Required Variables

### RESEARCH_DIR

**Type**: String (absolute path)  
**Default**: `./research`

Directory where research projects are stored.

```bash
RESEARCH_DIR=/Users/username/research
```

:::tip
Use an absolute path and keep the research directory separate from the application code.
:::

## AI Provider Keys

At least one provider key is required for research functionality.

### ANTHROPIC_API_KEY

**Type**: String  
**Format**: `sk-ant-oat01-...` (OAuth) or `sk-ant-api03-...` (API key)

Anthropic Claude API key.

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...
```

**Get it at**: https://console.anthropic.com/settings/keys

**Token Types**:
| Prefix | Type | Validity |
|--------|------|----------|
| `sk-ant-oat01-` | OAuth Token | 1 year |
| `sk-ant-api03-` | API Key | Until revoked |

### OPENAI_API_KEY

**Type**: String  
**Format**: `sk-...` or `sk-proj-...`

OpenAI API key.

```bash
OPENAI_API_KEY=sk-proj-xxxxx...
```

**Get it at**: https://platform.openai.com/api-keys

### GOOGLE_API_KEY

**Type**: String  
**Format**: `AIza...`

Google AI (Gemini) API key.

```bash
GOOGLE_API_KEY=AIzaSyxxxxx...
```

**Get it at**: https://makersuite.google.com/app/apikey

## Server Configuration

### PORT

**Type**: Number  
**Default**: `3000`

Server port for the Next.js application.

```bash
PORT=3000
```

### PORTAL_PORT

**Type**: Number  
**Default**: `3000`

Docker-specific portal port mapping.

```bash
PORTAL_PORT=3000
```

### SEARXNG_PORT

**Type**: Number  
**Default**: `8080`

SearXNG search engine port.

```bash
SEARXNG_PORT=8080
```

### NODE_ENV

**Type**: String  
**Default**: `development`  
**Options**: `development`, `production`

Node.js environment mode. Automatically set by Next.js.

```bash
NODE_ENV=production
```

## Database Configuration

### DATABASE_URL

**Type**: String  
**Default**: `file:./research-wizard.db`

SQLite database location.

```bash
DATABASE_URL=file:/path/to/research-wizard.db
```

### DB_PATH

**Type**: String  
**Default**: `$RESEARCH_DIR/research-wizard.db`

Alternative database path configuration.

```bash
DB_PATH=/path/to/research-wizard.db
```

## Search Engine Configuration

Configure which search engines SearXNG uses.

### SEARCH_GOOGLE

**Type**: Boolean  
**Default**: `true`

Enable Google search.

```bash
SEARCH_GOOGLE=true
```

### SEARCH_BING

**Type**: Boolean  
**Default**: `true`

Enable Bing search.

```bash
SEARCH_BING=true
```

### SEARCH_DUCKDUCKGO

**Type**: Boolean  
**Default**: `true`

Enable DuckDuckGo search.

```bash
SEARCH_DUCKDUCKGO=true
```

### SEARCH_WIKIPEDIA

**Type**: Boolean  
**Default**: `true`

Enable Wikipedia search.

```bash
SEARCH_WIKIPEDIA=true
```

### SEARCH_GITHUB

**Type**: Boolean  
**Default**: `true`

Enable GitHub code search.

```bash
SEARCH_GITHUB=true
```

### SEARCH_STACKOVERFLOW

**Type**: Boolean  
**Default**: `true`

Enable Stack Overflow search.

```bash
SEARCH_STACKOVERFLOW=true
```

### SEARCH_ARXIV

**Type**: Boolean  
**Default**: `false`

Enable arXiv academic search.

```bash
SEARCH_ARXIV=false
```

### SEARCH_REDDIT

**Type**: Boolean  
**Default**: `false`

Enable Reddit search.

```bash
SEARCH_REDDIT=false
```

## Integration Variables

### OPENCODE_URL

**Type**: String  
**Default**: `http://localhost:4096`

OpenCode CLI endpoint URL.

```bash
OPENCODE_URL=http://localhost:4096
```

### SEARXNG_URL

**Type**: String  
**Default**: `http://localhost:8080`

SearXNG instance URL for web-research-assistant.

```bash
SEARXNG_URL=http://localhost:8080
```

## Example Configuration

### Development (.env.local)

```bash
# Research Directory
RESEARCH_DIR=/Users/username/research

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Server
PORT=3000

# Search Engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
```

### Production (.env)

```bash
# Research Directory
RESEARCH_DIR=/var/research

# API Keys (set via environment or secrets)
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=file:/var/research/research-wizard.db

# Search
SEARXNG_URL=http://searxng:8080
```

### Docker (.env)

```bash
# Ports
PORTAL_PORT=3000
SEARXNG_PORT=8080

# Volumes
RESEARCH_DIR=./research

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Search Engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
```

## Loading Priority

Environment variables are loaded in this order (highest priority first):

1. System environment variables
2. `.env.local` file
3. `.env` file
4. Default values in code

## Best Practices

1. **Never commit API keys** to version control
2. **Use .env.local** for development secrets
3. **Use absolute paths** for RESEARCH_DIR
4. **Validate key formats** before using
5. **Rotate keys regularly** for security
6. **Use different keys** for development and production
