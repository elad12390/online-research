#!/usr/bin/env python3
"""
Simple Filesystem MCP Server
Built with Python MCP SDK for guaranteed compatibility with OpenAI and Anthropic.
Provides safe read/write operations for research project directories.
"""

from pathlib import Path
from typing import Any
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("filesystem")

# Safety: Only allow operations in specific directories
ALLOWED_BASE_DIRS: list[Path] = []


def set_allowed_directories(directories: list[str]) -> None:
    """Configure which directories this server can access."""
    global ALLOWED_BASE_DIRS
    ALLOWED_BASE_DIRS = [Path(d).resolve() for d in directories]


def is_path_allowed(path: Path) -> tuple[bool, Path]:
    """Check if a path is within allowed directories.

    Returns:
        Tuple of (is_allowed, resolved_path)
    """
    try:
        # If path is relative, resolve it against the first allowed directory
        if not path.is_absolute() and ALLOWED_BASE_DIRS:
            path = ALLOWED_BASE_DIRS[0] / path

        resolved_path = path.resolve()
        is_allowed = any(
            resolved_path == base or base in resolved_path.parents
            for base in ALLOWED_BASE_DIRS
        )
        return (is_allowed, resolved_path)
    except (OSError, ValueError):
        return (False, path)


@mcp.tool()
def read_file(path: str) -> str:
    """
    Read the complete contents of a file.

    Args:
        path: Absolute or relative path to the file to read

    Returns:
        The complete text contents of the file

    Raises:
        ValueError: If path is outside allowed directories
        FileNotFoundError: If file doesn't exist
        PermissionError: If file can't be read
    """
    is_allowed, file_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    if not file_path.is_file():
        raise ValueError(f"Path is not a file: {path}")

    return file_path.read_text(encoding="utf-8")


@mcp.tool()
def write_file(path: str, content: str) -> str:
    """
    Write content to a file, creating it if it doesn't exist.

    Args:
        path: Absolute or relative path to the file to write
        content: Text content to write to the file

    Returns:
        Success message with file path

    Raises:
        ValueError: If path is outside allowed directories
        PermissionError: If file can't be written
    """
    is_allowed, file_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    # Create parent directories if they don't exist
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Write the file
    file_path.write_text(content, encoding="utf-8")

    return f"Successfully wrote {len(content)} characters to {file_path}"


@mcp.tool()
def list_directory(path: str) -> str:
    """
    List contents of a directory.

    Args:
        path: Absolute or relative path to the directory to list

    Returns:
        Formatted list of files and directories

    Raises:
        ValueError: If path is outside allowed directories
        FileNotFoundError: If directory doesn't exist
        NotADirectoryError: If path is not a directory
    """
    is_allowed, dir_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    if not dir_path.exists():
        raise FileNotFoundError(f"Directory not found: {path}")

    if not dir_path.is_dir():
        raise NotADirectoryError(f"Path is not a directory: {path}")

    items = []
    for item in sorted(dir_path.iterdir()):
        item_type = "DIR " if item.is_dir() else "FILE"
        items.append(f"{item_type} {item.name}")

    if not items:
        return f"Directory is empty: {path}"

    return "\n".join(items)


@mcp.tool()
def create_directory(path: str) -> str:
    """
    Create a new directory and any necessary parent directories.

    Args:
        path: Absolute or relative path to the directory to create

    Returns:
        Success message with directory path

    Raises:
        ValueError: If path is outside allowed directories
        FileExistsError: If a file already exists at this path
    """
    is_allowed, dir_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    if dir_path.exists() and dir_path.is_file():
        raise FileExistsError(f"A file already exists at: {path}")

    dir_path.mkdir(parents=True, exist_ok=True)

    return f"Successfully created directory: {dir_path}"


@mcp.tool()
def file_exists(path: str) -> bool:
    """
    Check if a file or directory exists.

    Args:
        path: Absolute or relative path to check

    Returns:
        True if the path exists, False otherwise

    Raises:
        ValueError: If path is outside allowed directories
    """
    is_allowed, file_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    return file_path.exists()


@mcp.tool()
def get_file_info(path: str) -> dict[str, Any]:
    """
    Get information about a file or directory.

    Args:
        path: Absolute or relative path to inspect

    Returns:
        Dictionary with file information (type, size, etc.)

    Raises:
        ValueError: If path is outside allowed directories
        FileNotFoundError: If path doesn't exist
    """
    is_allowed, file_path = is_path_allowed(Path(path))

    if not is_allowed:
        raise ValueError(f"Path '{path}' is outside allowed directories")

    if not file_path.exists():
        raise FileNotFoundError(f"Path not found: {path}")

    stat = file_path.stat()

    return {
        "path": str(file_path),
        "name": file_path.name,
        "type": "directory" if file_path.is_dir() else "file",
        "size": stat.st_size,
        "created": stat.st_ctime,
        "modified": stat.st_mtime,
        "absolute_path": str(file_path.resolve()),
    }


@mcp.tool()
def write_research_metadata(
    title: str,
    description: str = "",
    category: str = "",
    tags: list[str] | None = None,
    summary: str = "",
) -> str:
    """
    Write metadata.json file for the current research project.

    IMPORTANT: Call this tool IMMEDIATELY when starting a new research project to set the project title and metadata.
    This metadata will be displayed in the research portal sidebar and project listings.

    Args:
        title: Project title (REQUIRED) - Will be displayed in the portal sidebar
        description: Brief description of what the research covers
        category: Category/topic of research (e.g., "Product Research", "Market Analysis")
        tags: List of relevant tags for categorization
        summary: Executive summary or key findings

    Returns:
        Confirmation message with the written metadata

    Example:
        write_research_metadata(
            title="Best Indoor Grills for Apartments 2024",
            description="Comprehensive research on low-odor indoor grills suitable for apartment living",
            category="Product Research",
            tags=["kitchen appliances", "apartment living", "product comparison"],
            summary="Reviewed 15+ indoor grill models focusing on smoke reduction and ease of use"
        )
    """
    import json
    from datetime import datetime

    if not ALLOWED_BASE_DIRS:
        return "Warning: No research directory configured, metadata not saved"

    # Metadata file is always in the first allowed directory
    metadata_file = ALLOWED_BASE_DIRS[0] / "metadata.json"

    metadata = {
        "title": title,
        "description": description,
        "category": category,
        "tags": tags or [],
        "summary": summary,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "updatedAt": datetime.utcnow().isoformat() + "Z",
    }

    metadata_file.write_text(json.dumps(metadata, indent=2))

    return f"✅ Metadata saved successfully!\n\nTitle: {title}\nCategory: {category}\nTags: {', '.join(tags or [])}\n\nThis project will now display as '{title}' in the research portal."


@mcp.tool()
def update_research_progress(
    percentage: int,
    current_task: str,
    task_description: str,
    estimated_minutes_remaining: int | None = None,
) -> str:
    """
    Update the research progress file to track completion status.

    USE THIS TOOL to report your progress as you work through the research.
    Call this when you:
    - Start a new major task (searching, analyzing, writing)
    - Complete a significant step
    - Finish the entire research

    Args:
        percentage: Progress percentage from 0-100 (0=just started, 100=complete)
        current_task: Short name of current task (e.g., "Searching web", "Writing README")
        task_description: Detailed description of what you're doing now
        estimated_minutes_remaining: Your estimate of how many minutes until completion (optional but encouraged)

    Returns:
        Confirmation message

    Example:
        update_research_progress(25, "Web research", "Gathering information about indoor grills", 15)
        update_research_progress(75, "Writing files", "Creating comparison chart markdown file", 5)
        update_research_progress(100, "Complete", "All research files created successfully", 0)
    """
    import json
    from datetime import datetime, timedelta

    if not ALLOWED_BASE_DIRS:
        return "Warning: No research directory configured, progress not saved"

    # Progress file is always in the first allowed directory
    progress_file = ALLOWED_BASE_DIRS[0] / ".research-progress.json"

    # Read existing progress to preserve completed tasks list and startedAt
    completed_tasks = []
    started_at = None
    if progress_file.exists():
        try:
            existing = json.loads(progress_file.read_text())
            completed_tasks = existing.get("completedTasks", [])
            started_at = existing.get("startedAt")
        except:
            pass

    # Add current task to completed list if we're progressing
    if percentage > 0 and current_task not in completed_tasks and percentage < 100:
        completed_tasks.append(current_task)

    now = datetime.utcnow()

    # Calculate estimated completion time
    estimated_completion = None
    if estimated_minutes_remaining is not None and estimated_minutes_remaining > 0:
        estimated_completion = (
            now + timedelta(minutes=estimated_minutes_remaining)
        ).isoformat() + "Z"

    progress = {
        "percentage": min(100, max(0, percentage)),
        "currentTask": current_task,
        "currentTaskDescription": task_description,
        "completedTasks": completed_tasks,
        "startedAt": started_at or now.isoformat() + "Z",
        "updatedAt": now.isoformat() + "Z",
        "estimatedMinutesRemaining": estimated_minutes_remaining,
        "estimatedCompletion": estimated_completion,
    }

    progress_file.write_text(json.dumps(progress, indent=2))

    time_str = (
        f" (~{estimated_minutes_remaining} min remaining)"
        if estimated_minutes_remaining
        else ""
    )
    return f"Progress updated: {percentage}% - {current_task}{time_str}"


def main():
    """Run the MCP server."""
    import sys
    import json

    # Read allowed directories from environment or command line
    if len(sys.argv) > 1:
        # Directories passed as command-line arguments
        set_allowed_directories(sys.argv[1:])
    else:
        # Try to read from stdin configuration (first line should be JSON)
        try:
            config_line = sys.stdin.readline()
            if config_line.strip():
                config = json.loads(config_line)
                if "allowed_directories" in config:
                    set_allowed_directories(config["allowed_directories"])
        except (json.JSONDecodeError, KeyError):
            pass

    if not ALLOWED_BASE_DIRS:
        import logging

        logging.error(
            "No allowed directories configured. Server will reject all operations."
        )

    # Run the FastMCP server
    mcp.run()


if __name__ == "__main__":
    main()
