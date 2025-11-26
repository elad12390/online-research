---
title: Quick Start
description: From zero to running research in under 2 minutes.
---

## Prerequisites

- **Docker** installed and running
- **One API key** from: [Anthropic](https://console.anthropic.com/settings/keys), [OpenAI](https://platform.openai.com/api-keys), or [Google AI](https://makersuite.google.com/app/apikey)

## Setup (60 seconds)

```bash
# Clone
git clone https://github.com/elad12390/online-research.git
cd online-research

# Configure
cp .env.example .env
```

Open `.env` and add your API key:

```bash
# Pick one (or more)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

Start it:

```bash
docker compose --profile search up -d
```

Open [localhost:3000](http://localhost:3000). Done.

## Your First Research

1. Click **New Research** (or go to `/wizard`)
2. Enter a topic: `"Best mechanical keyboards for programming under $150"`
3. Click **Start Research**
4. Watch the agent work, or go make coffee

![Research Wizard](../../../assets/screenshot-wizard.png)

When it's done, you'll have a structured report in the sidebar. Click to read.

## What Just Happened?

The agent:
- Searched the web using your local SearXNG instance
- Read and analyzed multiple sources
- Wrote organized findings as markdown/HTML
- Saved everything to `./research/[project-name]/`

Your research is now:
- Browsable in the web UI
- Stored as plain files you can version control, backup, or edit
- Accessible via MCP if you use Claude Desktop

## Next Steps

**Want private search?** It's already running. SearXNG is included in the `search` profile. Access it directly at [localhost:8080](http://localhost:8080).

**Want to customize?** See [Configuration](/online-research/guides/configuration/) for environment variables, model selection, and search engine options.

**Running into issues?** Check [Installation](/online-research/getting-started/installation/) for detailed troubleshooting.

**Using Claude Desktop?** See [MCP Integration](/online-research/guides/mcp-integration/) to let Claude access your research library.
