#!/bin/sh
# Docker entrypoint script for Research Portal
# Ensures research directory is writable before starting the app

RESEARCH_DIR="${RESEARCH_DIR:-/research}"

echo "[Entrypoint] Checking research directory: $RESEARCH_DIR"

# Check if directory exists
if [ ! -d "$RESEARCH_DIR" ]; then
    echo "[Entrypoint] Creating research directory..."
    mkdir -p "$RESEARCH_DIR" 2>/dev/null || {
        echo "[Entrypoint] ERROR: Cannot create $RESEARCH_DIR"
        echo "[Entrypoint] This usually means the volume mount parent doesn't exist on the host."
        echo "[Entrypoint] Please create the directory on your host machine first:"
        echo "[Entrypoint]   mkdir -p $RESEARCH_DIR"
        exit 1
    }
fi

# Check if directory is writable
if ! touch "$RESEARCH_DIR/.write-test" 2>/dev/null; then
    echo "[Entrypoint] ERROR: Research directory is not writable: $RESEARCH_DIR"
    echo "[Entrypoint] This usually happens when:"
    echo "[Entrypoint]   1. Docker created the directory as root (Linux)"
    echo "[Entrypoint]   2. The volume mount has incorrect permissions"
    echo "[Entrypoint]"
    echo "[Entrypoint] To fix, run on your host machine:"
    echo "[Entrypoint]   sudo chown -R \$(id -u):\$(id -g) $RESEARCH_DIR"
    echo "[Entrypoint]   # or simply:"
    echo "[Entrypoint]   sudo chmod 777 $RESEARCH_DIR"
    exit 1
fi
rm -f "$RESEARCH_DIR/.write-test"

echo "[Entrypoint] Research directory OK: $RESEARCH_DIR"

# Execute the main command
exec "$@"
