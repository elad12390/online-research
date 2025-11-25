---
title: Configuration
description: All the knobs you can turn.
---

Research Portal uses environment variables for configuration. Edit `.env` (Docker) or `.env.local` (local development).

## The Essentials

### Where Research Goes

```bash
RESEARCH_DIR=/path/to/your/research
```

This is where all research projects are saved. Keep it outside the app directory so your research survives updates/reinstalls.

**Docker default:** `./research` (relative to project root)  
**Recommendation:** Use an absolute path like `~/research` or `/home/user/research`

### AI Provider Keys

You need at least one. Add more if you want to switch between providers.

```bash
# Anthropic Claude (recommended for research)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Google Gemini
GOOGLE_API_KEY=AIza...
```

**Where to get keys:**
- Anthropic: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Google: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

## Search Engines

Control which search engines SearXNG uses. All boolean (`true`/`false`).

```bash
# General search
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true

# Reference
SEARCH_WIKIPEDIA=true

# Code
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true

# Optional (disabled by default)
SEARCH_ARXIV=false    # Academic papers
SEARCH_REDDIT=false   # Community discussions
```

More engines = more comprehensive results, but slower searches.

---

## Model Selection

Configure which AI models to use in `mcp_agent.config.yaml`:

```yaml
anthropic:
  default_model: "claude-sonnet-4-5"

openai:
  default_model: "gpt-4o"
```

### Available Models

**Anthropic:**
| Model | Notes |
|-------|-------|
| `claude-opus-4-1` | Most capable, expensive |
| `claude-sonnet-4-5` | Good balance (default) |
| `claude-haiku-3-5` | Fast, cheaper |

**OpenAI:**
| Model | Notes |
|-------|-------|
| `gpt-4o` | Latest, recommended |
| `gpt-4-turbo` | Previous gen |
| `o1` | Reasoning model |

---

## Ports

```bash
PORTAL_PORT=3000      # Web interface
SEARXNG_PORT=8080     # SearXNG search
```

Change these if you have conflicts with other services.

---

## Full Example

Here's a complete `.env` for Docker:

```bash
# Where to save research
RESEARCH_DIR=./research

# Ports
PORTAL_PORT=3000
SEARXNG_PORT=8080

# AI Keys (add at least one)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx

# Search engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true
```

---

## Advanced: Local Development

For running without Docker:

```bash
# .env.local (not .env)

RESEARCH_DIR=/Users/you/research
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Database location (optional)
DATABASE_URL=file:./research-wizard.db
```

Then `npm run dev` instead of Docker.

---

## Environment Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEARCH_DIR` | `./research` | Where projects are saved |
| `PORTAL_PORT` | `3000` | Web UI port |
| `SEARXNG_PORT` | `8080` | Search engine port |
| `ANTHROPIC_API_KEY` | - | Claude API key |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `GOOGLE_API_KEY` | - | Google AI key |
| `SEARCH_*` | varies | Search engine toggles |
| `DATABASE_URL` | `file:./research-wizard.db` | SQLite path |

See [Environment Variables Reference](/online-research/reference/environment/) for the complete list.
