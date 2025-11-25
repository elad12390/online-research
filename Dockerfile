# Research Portal - Production Docker Build
# 
# Build: docker build -t research-portal .
# Run:   docker run -p 3000:3000 -v ~/research:/research research-portal

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
# Stage 3: Python Dependencies Builder (x86 for crawl4ai/playwright)
# Uses pre-built Python image to avoid apt-get segfaults under QEMU
# ----------------------------------------------------------------------------
FROM --platform=linux/amd64 python:3.11-slim-bookworm AS python-builder

WORKDIR /app

# Install Python dependencies into a virtual environment
COPY requirements.txt ./
RUN python -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r requirements.txt && \
    /app/.venv/bin/pip install --no-cache-dir uv

# ----------------------------------------------------------------------------
# Stage 4: Production Runner (x86 for crawl4ai/playwright compatibility)
# ----------------------------------------------------------------------------
FROM --platform=linux/amd64 python:3.11-slim-bookworm AS runner

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

# Rebuild better-sqlite3 for x86 architecture
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

# Create research directory
RUN mkdir -p /research && chown nextjs:nodejs /research

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
