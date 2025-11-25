---
title: Quick Start
description: Get Research Portal running in minutes with Docker.
---

import { Steps, Tabs, TabItem } from '@astrojs/starlight/components';

Get Research Portal running in just a few minutes using Docker.

## Prerequisites

- **Docker** and **Docker Compose** installed
- An API key from at least one AI provider:
  - [Anthropic](https://console.anthropic.com/settings/keys)
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Google AI](https://makersuite.google.com/app/apikey)

## Installation

<Steps>

1. **Clone the repository**

   ```bash
   git clone https://github.com/elad12390/online-research.git
   cd online-research
   ```

2. **Run the setup script**

   ```bash
   ./setup.sh
   ```

   Or manually:

   ```bash
   cp .env.example .env
   # Edit .env with your API key(s)
   ```

3. **Start with Docker Compose**

   <Tabs>
     <TabItem label="Portal + Search (Recommended)">
       ```bash
       docker compose --profile search up -d
       ```
     </TabItem>
     <TabItem label="Portal Only">
       ```bash
       docker compose up -d
       ```
     </TabItem>
     <TabItem label="Full Stack">
       ```bash
       docker compose --profile full up -d
       ```
     </TabItem>
   </Tabs>

4. **Open the portal**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

</Steps>

## Your First Research Project

<Steps>

1. **Configure an AI provider**

   Click on "Auth" in the navigation to set up your API key.

2. **Start a new research**

   Click "New Research" and enter a topic like:
   
   > "Best practices for React performance optimization in 2024"

3. **Watch the magic happen**

   The AI agent will:
   - Search the web for relevant sources
   - Analyze and synthesize information
   - Generate a comprehensive report
   - Update progress in real-time

4. **Browse your findings**

   Once complete, your research appears in the sidebar. Click to view the generated documents.

</Steps>

## Deployment Profiles

Research Portal offers different deployment profiles:

| Profile | Command | Includes |
|---------|---------|----------|
| **Default** | `docker compose up -d` | Portal only |
| **Search** | `docker compose --profile search up -d` | Portal + SearXNG |
| **Full** | `docker compose --profile full up -d` | Portal + SearXNG + Redis cache |

## Common Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose stop

# Start services
docker compose start

# Remove containers
docker compose down

# Remove containers and data
docker compose down -v
```

## Configuration

Edit `.env` to customize your setup:

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
```

## Next Steps

- [Full Installation Guide](/online-research/getting-started/installation/) - Detailed setup options
- [Configuration Guide](/online-research/guides/configuration/) - All configuration options
- [Docker Deployment](/online-research/guides/docker/) - Advanced Docker setup
- [MCP Integration](/online-research/guides/mcp-integration/) - Use with Claude Desktop
