# Research Portal

AI-powered research assistant with web search, multi-provider LLM support, and a beautiful web interface.

## Features

- **AI Research Wizard** - Automated research using Claude, GPT, or Gemini
- **Private Search** - Self-hosted SearXNG with configurable search engines
- **Live Updates** - Changes appear automatically
- **MCP Integration** - Works with Claude Desktop, OpenCode, and other MCP clients

## Quick Start

**Requirements:** Docker

```bash
git clone https://github.com/elad12390/online-research.git
cd online-research
./setup.sh
```

Or manually:

```bash
cp .env.example .env
# Edit .env with your API key(s)
docker compose --profile search up -d
```

Open http://localhost:3000

## Configuration

Edit `.env` to configure:

```bash
# Ports
PORTAL_PORT=3000
SEARXNG_PORT=8080

# Research output directory
RESEARCH_DIR=./research

# API Keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# Search Engines (true/false)
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true
```

## Deployment Profiles

```bash
# Portal only
docker compose up -d

# Portal + SearXNG (recommended)
docker compose --profile search up -d

# Portal + SearXNG + Redis cache
docker compose --profile full up -d
```

## Commands

```bash
docker compose logs -f      # View logs
docker compose stop         # Stop
docker compose start        # Start  
docker compose down         # Remove containers
docker compose down -v      # Remove with data
```

## MCP Integration

For Claude Desktop, add to your config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

## Advanced: Local Development

For local development without Docker, see the source code and install dependencies manually:

- Node.js 20+
- Python 3.11+
- `npm install`
- `pip install "mcp-agent[anthropic,openai,google]"`

## License

MIT
