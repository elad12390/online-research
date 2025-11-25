---
title: Docker Deployment
description: Running Research Portal in production.
---

Docker is the recommended way to run Research Portal. One command, everything works.

## Deployment Options

### Standard (Recommended)

Portal + SearXNG for private web search:

```bash
docker compose --profile search up -d
```

**Includes:**
- Research Portal on port 3000
- SearXNG on port 8080
- Shared research volume

### Minimal

Just the portal, no search (use if you have external search):

```bash
docker compose up -d
```

### Full Stack

Everything plus Redis for search caching:

```bash
docker compose --profile full up -d
```

Useful for heavy search usage.

---

## Daily Operations

```bash
# View logs
docker compose logs -f

# Stop
docker compose stop

# Start
docker compose start

# Restart
docker compose restart

# Update to latest
git pull
docker compose down
docker compose --profile search up -d --build
```

---

## Configuration

All config lives in `.env`:

```bash
# Ports
PORTAL_PORT=3000
SEARXNG_PORT=8080

# Data directory
RESEARCH_DIR=./research

# API keys
ANTHROPIC_API_KEY=sk-ant-...
```

See [Configuration](/online-research/guides/configuration/) for all options.

---

## Data Persistence

Research is stored in `RESEARCH_DIR` (default: `./research`).

**To backup:**
```bash
tar -czvf research-backup.tar.gz ./research
```

**To restore:**
```bash
tar -xzvf research-backup.tar.gz
```

The SQLite database is at `./research/research-wizard.db`. Include it in backups.

---

## Reverse Proxy

For production with a domain, put a reverse proxy in front.

### Nginx

```nginx
server {
    listen 80;
    server_name research.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Caddy

```caddyfile
research.yourdomain.com {
    reverse_proxy localhost:3000
}
```

Caddy handles HTTPS automatically.

---

## Resource Limits

For production, add limits:

```yaml
# In docker-compose.yml
services:
  portal:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## Health Checks

The portal exposes `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "ok",
  "projectCount": 12,
  "timestamp": "..."
}
```

Use this for monitoring and load balancer health checks.

---

## Troubleshooting

**Port conflict:**
```bash
# Find what's using the port
lsof -i :3000

# Change port in .env
PORTAL_PORT=3001
```

**Container won't start:**
```bash
# Check logs
docker compose logs portal

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose --profile search up -d
```

**Out of disk space:**
```bash
# Clean Docker
docker system prune -a
```

**SearXNG not working:**
```bash
# Check if running
curl http://localhost:8080

# Check logs
docker compose logs searxng

# Restart just SearXNG
docker compose restart searxng
```
