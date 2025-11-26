#!/usr/bin/env python3
"""
Web Research Assistant SSE Server Wrapper

Runs the web-research-assistant MCP server with SSE transport
for use in Docker container accessible over network.

Configure via environment variables:
  FASTMCP_HOST - Host to bind to (default: 0.0.0.0)
  FASTMCP_PORT - Port to listen on (default: 8000)
  SEARXNG_BASE_URL - SearXNG search endpoint
"""

import logging
import os

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def main():
    # Get configuration from environment
    host = os.environ.get("FASTMCP_HOST", "0.0.0.0")
    port = int(os.environ.get("FASTMCP_PORT", "8000"))

    # Import the FastMCP instance from web-research-assistant
    from searxng_mcp.server import mcp

    # Override settings for network access
    mcp.settings.host = host
    mcp.settings.port = port

    logger.info("Starting web-research-assistant MCP server with SSE transport")
    logger.info(f"SSE endpoint: http://{host}:{port}/sse")

    # Run with SSE transport
    mcp.run(transport="sse")


if __name__ == "__main__":
    main()
