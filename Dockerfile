# Research Portal - Production Docker Build
# 
# Build: docker build -t research-portal .
# Run:   docker run -p 3000:3000 -v ~/research:/research research-portal
#
# Note: Web research (Playwright/crawl4ai) runs in separate container (web-research)

# ----------------------------------------------------------------------------
# Stage 1: Node Dependencies (native architecture)
# ----------------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# ----------------------------------------------------------------------------
# Stage 2: Next.js Builder (native architecture)
# ----------------------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----------------------------------------------------------------------------
# Stage 3: Python Dependencies Builder (native architecture)
# No Playwright needed - web-research runs in separate container
# ----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS python-builder

WORKDIR /app

# Create minimal requirements without crawl4ai/playwright
RUN echo "mcp-agent>=0.1.0\nanthropic>=0.18.0\nopenai>=1.12.0\nhttpx>=0.27.0\npydantic>=2.0.0" > /tmp/requirements-minimal.txt

RUN python -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r /tmp/requirements-minimal.txt && \
    /app/.venv/bin/pip install --no-cache-dir uv

# ----------------------------------------------------------------------------
# Stage 4: Production Runner (native architecture)
# ----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner

# Install Node.js 20 and build tools for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    make \
    g++ \
    python3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs && \
    mkdir -p /home/nextjs/.cache/uv /home/nextjs/.cache/pip && \
    chown -R nextjs:nodejs /home/nextjs

# Copy built Next.js application from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package files and node_modules
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Rebuild better-sqlite3 for native architecture
RUN npm rebuild better-sqlite3 && \
    chown -R nextjs:nodejs /app/node_modules

# Copy MCP servers and scripts (for research agent functionality)
COPY --chown=nextjs:nodejs mcp-servers ./mcp-servers
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs mcp_agent.config.yaml ./mcp_agent.config.yaml

# Copy pre-built Python virtual environment from python-builder
COPY --from=python-builder --chown=nextjs:nodejs /app/.venv /app/.venv

# Add venv to PATH so mcp-agent can find uv and other tools
ENV PATH="/app/.venv/bin:$PATH"

# Create research directory with proper permissions
# Note: When using volume mounts, ensure host directory has compatible permissions
RUN mkdir -p /research && \
    chown -R nextjs:nodejs /research && \
    chmod 755 /research

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
