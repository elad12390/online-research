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

    # Allow connections from Docker network hostnames
    # MCP 1.23+ has stricter host header validation
    if hasattr(mcp.settings, "transport_security") and mcp.settings.transport_security:
        # Add Docker service names and any hostname to allowed hosts
        mcp.settings.transport_security.allowed_hosts.extend(
            [
                "web-research:*",
                "research-web-assistant:*",
                "0.0.0.0:*",
                "*:8000",  # Allow any host on port 8000
            ]
        )
        mcp.settings.transport_security.allowed_origins.extend(
            [
                "http://web-research:*",
                "http://research-web-assistant:*",
                "http://0.0.0.0:*",
            ]
        )
        logger.info(f"Allowed hosts: {mcp.settings.transport_security.allowed_hosts}")

    # Try to use uvicorn directly to avoid FastMCP's run constraints if needed
    # and to ensure we can control execution
    import uvicorn

    logger.info("Starting web-research-assistant MCP server with SSE transport")
    logger.info(f"SSE endpoint: http://{host}:{port}/sse")

    # FastMCP.sse_app() returns the Starlette app for SSE transport
    try:
        app = mcp.sse_app()
        # Run uvicorn directly
        # forwarded_allow_ips='*' is important behind Docker/Proxies
        # proxy_headers=True is also important
        uvicorn.run(
            app, host=host, port=port, forwarded_allow_ips="*", proxy_headers=True
        )

    except Exception as e:
        logger.error(f"Failed to run uvicorn directly: {e}")
        logger.info("Falling back to mcp.run()")
        mcp.run(transport="sse")


if __name__ == "__main__":
    main()
