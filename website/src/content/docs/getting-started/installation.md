---
title: Installation
description: Detailed setup for Docker and local development.
---

Two ways to run Research Portal: **Docker** (recommended) or **local development**.

---

## Docker Installation

### Requirements

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- One API key (Anthropic, OpenAI, or Google)

### Steps

```bash
# Clone
git clone https://github.com/elad12390/online-research.git
cd online-research

# Configure
cp .env.example .env
```

Edit `.env` and add your API key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
# or OPENAI_API_KEY=sk-...
# or GOOGLE_API_KEY=AIza...
```

Start:

```bash
docker compose --profile search up -d
```

Open [localhost:3000](http://localhost:3000).

### Verify It Works

```bash
# Health check
curl http://localhost:3000/api/health

# Should return: {"status":"ok",...}
```

---

## Local Development

For hacking on Research Portal itself.

### Requirements

- Node.js 20+
- Python 3.11+
- npm 10+

### Steps

```bash
# Clone and install
git clone https://github.com/elad12390/online-research.git
cd online-research
npm install

# Python dependencies
pip install uv
uv pip install "mcp-agent[anthropic,openai,google]"

# Configure
cp .env.example .env.local
```

Edit `.env.local`:

```bash
RESEARCH_DIR=/path/to/your/research
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Create the research directory:

```bash
mkdir -p ~/research
```

Start:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

---

## Directory Structure

After setup:

```
your-machine/
├── online-research/     # App code
│   ├── app/
│   ├── lib/
│   └── .env.local
│
└── research/            # Your research (RESEARCH_DIR)
    ├── project-1/
    │   ├── metadata.json
    │   └── README.md
    └── project-2/
```

Keep `research/` separate from app code. Your research survives app updates.

---

## Troubleshooting

### Port 3000 in use

```bash
# Find what's using it
lsof -i :3000

# Kill it, or change port
PORTAL_PORT=3001 docker compose --profile search up -d
```

### API key not working

Check the format:
- Anthropic: `sk-ant-api03-...` or `sk-ant-oat01-...`
- OpenAI: `sk-...` or `sk-proj-...`
- Google: `AIza...`

Make sure there are no extra spaces or quotes.

### Docker build fails

```bash
# Clean slate
docker system prune -a
docker compose build --no-cache
docker compose --profile search up -d
```

### Research directory not found

```bash
# Check your .env
cat .env | grep RESEARCH_DIR

# Make sure it exists
mkdir -p ./research  # or wherever you set it
```

### SearXNG won't start

```bash
# Check logs
docker compose logs searxng

# Common fix: permissions
chmod -R 755 ./searxng
```

---

## Next Steps

- [Configuration](/online-research/guides/configuration/) — All the options
- [MCP Integration](/online-research/guides/mcp-integration/) — Connect Claude Desktop
- [Docker Deployment](/online-research/guides/docker/) — Production setup
