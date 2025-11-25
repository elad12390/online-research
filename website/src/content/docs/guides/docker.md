---
title: Docker Deployment
description: Deploy Research Portal with Docker and Docker Compose.
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

This guide covers Docker deployment options for Research Portal.

## Quick Start

```bash
# Clone and start
git clone https://github.com/elad12390/online-research.git
cd online-research
cp .env.example .env
# Edit .env with your API keys
docker compose --profile search up -d
```

## Deployment Profiles

Research Portal offers three deployment profiles:

### Default (Portal Only)

```bash
docker compose up -d
```

**Services**: Research Portal  
**Use when**: You have an external search solution or don't need web search

### Search Profile (Recommended)

```bash
docker compose --profile search up -d
```

**Services**: Research Portal + SearXNG  
**Use when**: Standard deployment with private web search

### Full Profile

```bash
docker compose --profile full up -d
```

**Services**: Research Portal + SearXNG + Redis  
**Use when**: High-traffic deployments needing search caching

## Docker Compose File

The `docker-compose.yml` structure:

```yaml
services:
  portal:
    build: .
    ports:
      - "${PORTAL_PORT:-3000}:3000"
    volumes:
      - "${RESEARCH_DIR:-./research}:/research"
      - "./.env:/app/.env"
    environment:
      - RESEARCH_DIR=/research
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}

  searxng:
    image: searxng/searxng:latest
    profiles: ["search", "full"]
    ports:
      - "${SEARXNG_PORT:-8080}:8080"
    volumes:
      - ./searxng:/etc/searxng

  redis:
    image: redis:alpine
    profiles: ["full"]
```

## Environment Configuration

### Basic `.env` Setup

```bash
# Ports
PORTAL_PORT=3000
SEARXNG_PORT=8080

# Research directory (mounted as volume)
RESEARCH_DIR=./research

# API Keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...
```

### Search Engine Configuration

```bash
# Enable/disable search engines
SEARCH_GOOGLE=true
SEARCH_BING=true
SEARCH_DUCKDUCKGO=true
SEARCH_WIKIPEDIA=true
SEARCH_GITHUB=true
SEARCH_STACKOVERFLOW=true
```

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f portal
docker compose logs -f searxng
```

### Service Management

```bash
# Stop services
docker compose stop

# Start services
docker compose start

# Restart services
docker compose restart

# Rebuild and restart
docker compose up -d --build
```

### Cleanup

```bash
# Remove containers (keep data)
docker compose down

# Remove containers and volumes
docker compose down -v

# Remove everything including images
docker compose down -v --rmi all
```

## Production Deployment

### Using a Reverse Proxy

<Tabs>
  <TabItem label="Nginx">
    ```nginx
    upstream portal {
      server localhost:3000;
    }

    server {
      listen 80;
      server_name research.example.com;
      
      location / {
        proxy_pass http://portal;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
      }
    }
    ```
  </TabItem>
  <TabItem label="Caddy">
    ```caddyfile
    research.example.com {
      reverse_proxy localhost:3000
    }
    ```
  </TabItem>
  <TabItem label="Traefik">
    Add labels to your `docker-compose.yml`:
    ```yaml
    services:
      portal:
        labels:
          - "traefik.enable=true"
          - "traefik.http.routers.portal.rule=Host(`research.example.com`)"
          - "traefik.http.services.portal.loadbalancer.server.port=3000"
    ```
  </TabItem>
</Tabs>

### SSL/TLS Configuration

For production, always use HTTPS. Options:

1. **Reverse proxy with Let's Encrypt** (recommended)
2. **Cloudflare Tunnel**
3. **Self-signed certificates** (development only)

### Resource Limits

Add resource limits for production:

```yaml
services:
  portal:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### Health Checks

The portal exposes a health endpoint:

```bash
curl http://localhost:3000/api/health
```

Add health checks to Docker Compose:

```yaml
services:
  portal:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Data Persistence

### Research Directory

Research projects are stored in `RESEARCH_DIR`, mounted as a volume:

```yaml
volumes:
  - "${RESEARCH_DIR:-./research}:/research"
```

**Backup strategy**:
```bash
# Backup research directory
tar -czvf research-backup-$(date +%Y%m%d).tar.gz ./research
```

### Database

The SQLite database is stored in the research directory:

```
/research/research-wizard.db
```

Include it in your backup strategy.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs portal

# Common issues:
# - Missing API keys
# - Port conflicts
# - Permission issues on volumes
```

### Port Conflicts

```bash
# Find what's using a port
lsof -i :3000

# Change port in .env
PORTAL_PORT=3001
```

### Permission Issues

```bash
# Fix research directory permissions
chmod -R 755 ./research
chown -R $(id -u):$(id -g) ./research
```

### SearXNG Not Working

```bash
# Check SearXNG logs
docker compose logs searxng

# Verify settings
cat searxng/settings.yml

# Restart SearXNG
docker compose restart searxng
```

## Updating

To update to a new version:

```bash
# Pull latest changes
git pull

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose --profile search up -d
```
