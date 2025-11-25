---
title: Installation
description: Detailed installation guide for Research Portal.
---

import { Tabs, TabItem, Steps } from '@astrojs/starlight/components';

This guide covers all installation methods for Research Portal.

## System Requirements

### Docker Installation (Recommended)

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Memory**: 4GB RAM minimum
- **Storage**: 10GB free space

### Local Development

- **Node.js**: 20+
- **Python**: 3.11+
- **npm**: 10+
- **uv**: Python package manager

## Docker Installation

<Tabs>
  <TabItem label="Linux/macOS">
    ```bash
    # Clone repository
    git clone https://github.com/elad12390/online-research.git
    cd online-research
    
    # Copy environment file
    cp .env.example .env
    
    # Edit .env with your API keys
    nano .env
    
    # Start services
    docker compose --profile search up -d
    ```
  </TabItem>
  <TabItem label="Windows">
    ```powershell
    # Clone repository
    git clone https://github.com/elad12390/online-research.git
    cd online-research
    
    # Copy environment file
    copy .env.example .env
    
    # Edit .env with your API keys (use notepad or VS Code)
    notepad .env
    
    # Start services
    docker compose --profile search up -d
    ```
  </TabItem>
</Tabs>

## Local Development Setup

For development or advanced customization:

<Steps>

1. **Clone and install Node.js dependencies**

   ```bash
   git clone https://github.com/elad12390/online-research.git
   cd online-research
   npm install
   ```

2. **Install Python dependencies**

   ```bash
   # Using uv (recommended)
   pip install uv
   uv pip install "mcp-agent[anthropic,openai,google]"
   
   # Or using pip
   pip install mcp-agent anthropic openai google-generativeai
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```bash
   # Research directory (outside project folder)
   RESEARCH_DIR=/path/to/your/research
   
   # AI Provider Keys (at least one required)
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   GOOGLE_API_KEY=AIza...
   ```

4. **Create research directory**

   ```bash
   mkdir -p ~/research
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

</Steps>

## Directory Structure

After installation, your project structure should look like:

```
your-machine/
├── dev/
│   └── online-research/          # Application code
│       ├── app/                  # Next.js routes
│       ├── components/           # React components
│       ├── lib/                  # Core libraries
│       ├── mcp-servers/          # MCP server implementations
│       ├── scripts/              # Research agent scripts
│       └── .env.local            # Local configuration
│
└── research/                      # Research projects (RESEARCH_DIR)
    ├── project-1/
    │   ├── metadata.json
    │   ├── README.md
    │   └── index.html
    └── project-2/
        └── ...
```

:::caution[Keep directories separate]
The research directory should be **outside** the application code directory. This allows:
- Independent backups
- Git separation
- Multiple instances sharing research
:::

## Verifying Installation

After installation, verify everything is working:

### Check the Portal

1. Open [http://localhost:3000](http://localhost:3000)
2. You should see the Research Portal interface
3. The sidebar should show "No projects yet"

### Check API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "projectCount": 0,
  "researchDir": "/path/to/research",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Check SearXNG (if using search profile)

Open [http://localhost:8080](http://localhost:8080) - you should see the SearXNG search interface.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORTAL_PORT=3001
```

### Docker Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache
```

### Missing API Key Error

1. Check `.env` or `.env.local` exists
2. Verify API key format:
   - Anthropic: `sk-ant-api03-...` or `sk-ant-oat01-...`
   - OpenAI: `sk-...`
   - Google: `AIza...`
3. Restart the server after adding keys

### Research Directory Not Found

```bash
# Check RESEARCH_DIR in .env
echo $RESEARCH_DIR

# Create if missing
mkdir -p ~/research

# Verify in .env.local
RESEARCH_DIR=/Users/yourname/research
```

## Next Steps

- [Configuration Guide](/online-research/guides/configuration/) - Customize your setup
- [Docker Deployment](/online-research/guides/docker/) - Production Docker setup
- [Research Agents](/online-research/guides/research-agents/) - How AI agents work
