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


def _extract_local_links_from_html(html_content: str) -> set[str]:
    """Extract local file links from HTML content (href and src attributes)."""
    import re

    links = set()
    # Match href="..." and src="..." attributes
    pattern = r'(?:href|src)=["\']([^"\']+)["\']'
    matches = re.findall(pattern, html_content, re.IGNORECASE)

    for link in matches:
        # Skip external URLs, anchors, and data URIs
        if link.startswith(
            ("http://", "https://", "mailto:", "#", "data:", "javascript:")
        ):
            continue
        # Skip empty links
        if not link.strip():
            continue
        # Remove query strings and anchors from local links
        link = link.split("?")[0].split("#")[0]
        if link:
            links.add(link)

    return links


def _check_missing_files_in_project(project_dir: Path) -> dict[str, list[str]]:
    """
    Scan all HTML files in project directory and check for broken local links.

    Returns:
        Dictionary mapping HTML filenames to lists of missing linked files
    """
    missing_files = {}

    # Find all HTML files in the project
    html_files = list(project_dir.glob("*.html")) + list(project_dir.glob("**/*.html"))

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
            local_links = _extract_local_links_from_html(content)

            missing_for_file = []
            for link in local_links:
                # Resolve the link relative to the HTML file's directory
                if link.startswith("/"):
                    # Absolute path from project root
                    linked_path = project_dir / link.lstrip("/")
                else:
                    # Relative path from HTML file location
                    linked_path = html_file.parent / link

                # Check if the file exists
                if not linked_path.exists():
                    missing_for_file.append(link)

            if missing_for_file:
                # Use relative path from project dir for cleaner output
                rel_html_path = html_file.relative_to(project_dir)
                missing_files[str(rel_html_path)] = missing_for_file

        except Exception:
            # Skip files that can't be read
            pass

    return missing_files


@mcp.tool()
def update_research_progress(
    percentage: int,
    current_task: str,
    task_description: str,
    estimated_minutes_remaining: int,
) -> str:
    """
    Update research progress. ALL 4 PARAMETERS ARE REQUIRED.

    REQUIRED PARAMETERS (you must provide ALL of these):
    1. percentage (int): Progress 0-100 (0=started, 100=complete)
    2. current_task (str): Short task name like "Web research" or "Writing files"
    3. task_description (str): What you're doing now in detail
    4. estimated_minutes_remaining (int): Minutes until done (use 0 when complete)

    CORRECT USAGE:
    update_research_progress(
        percentage=25,
        current_task="Web research",
        task_description="Searching for product reviews and comparisons",
        estimated_minutes_remaining=15
    )

    WRONG (missing parameters):
    update_research_progress(percentage=25, current_task="Research")  # FAILS!

    Call this tool:
    - When starting a new major task
    - After completing significant steps
    - When finishing (percentage=100, estimated_minutes_remaining=0)

    NOTE: This tool also validates your HTML files and will warn you if any
    local links point to files that don't exist yet. Make sure to create all
    files you reference before marking progress as 100% complete!
    """
    import json
    from datetime import datetime, timedelta

    if not ALLOWED_BASE_DIRS:
        return "Warning: No research directory configured, progress not saved"

    project_dir = ALLOWED_BASE_DIRS[0]

    # Progress file is always in the first allowed directory
    progress_file = project_dir / ".research-progress.json"

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
    if estimated_minutes_remaining > 0:
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

    # Check for missing files referenced in HTML BEFORE saving progress
    missing_files = _check_missing_files_in_project(project_dir)

    # If trying to mark as complete (>=90%) but there are missing files,
    # cap progress at 85% and refuse to mark complete
    if percentage >= 90 and missing_files:
        total_missing = sum(len(links) for links in missing_files.values())
        progress["percentage"] = 85  # Cap at 85%
        progress["currentTask"] = "BLOCKED: Missing files"
        progress["currentTaskDescription"] = (
            f"Cannot complete - {total_missing} referenced files not created yet"
        )

    progress_file.write_text(json.dumps(progress, indent=2))

    time_str = (
        f" (~{estimated_minutes_remaining} min remaining)"
        if estimated_minutes_remaining
        else ""
    )

    # Build result message
    if percentage >= 90 and missing_files:
        # BLOCKING ERROR - cannot complete
        total_missing = sum(len(links) for links in missing_files.values())
        result = f"\n{'=' * 60}\n"
        result += "🚫 CANNOT MARK AS COMPLETE - MISSING FILES!\n"
        result += f"{'=' * 60}\n\n"
        result += f"You tried to mark progress as {percentage}%, but your HTML files\n"
        result += f"reference {total_missing} file(s) that DO NOT EXIST.\n\n"
        result += "Progress has been CAPPED at 85% until you create these files:\n\n"

        for html_file, missing_links in missing_files.items():
            result += f"📄 In {html_file}:\n"
            for link in missing_links:
                result += f"   ❌ {link} - FILE DOES NOT EXIST\n"

        result += f"\n{'=' * 60}\n"
        result += "ACTION REQUIRED:\n"
        result += "1. Create each missing file listed above using write_file()\n"
        result += "2. Then call update_research_progress(100, ...) again\n"
        result += f"{'=' * 60}\n"
    else:
        result = (
            f"Progress updated: {progress['percentage']}% - {current_task}{time_str}"
        )

        # Show warnings for missing files even at lower percentages
        if missing_files:
            result += (
                "\n\n⚠️ WARNING: Some HTML files reference files that don't exist yet:\n"
            )
            for html_file, missing_links in missing_files.items():
                result += f"  📄 {html_file}: {', '.join(missing_links)}\n"
            result += "Remember to create these files before marking complete!"

    # Also list existing files for context
    existing_files = [
        f.name
        for f in project_dir.iterdir()
        if f.is_file() and f.suffix in (".html", ".md")
    ]
    if existing_files:
        result += (
            f"\n\n📁 Current files in project: {', '.join(sorted(existing_files))}"
        )

    return result


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
