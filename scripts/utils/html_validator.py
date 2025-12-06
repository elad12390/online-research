"""
HTML Link Validator Utilities

Shared functions for validating local links in HTML files.
Follows DRY principle - these were previously duplicated in
filesystem-server.py and research-agent.py.
"""

import re
from pathlib import Path


def extract_local_links_from_html(html_content: str) -> set[str]:
    """
    Extract local file links from HTML content (href and src attributes).

    Args:
        html_content: The HTML content to parse

    Returns:
        Set of local file links found in the HTML
    """
    links: set[str] = set()

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


def check_missing_files_in_project(project_dir: Path) -> dict[str, list[str]]:
    """
    Scan all HTML files in project directory and check for broken local links.

    Args:
        project_dir: Path to the project directory

    Returns:
        Dictionary mapping HTML filenames to lists of missing linked files
    """
    missing_files: dict[str, list[str]] = {}

    # Find all HTML files in the project
    html_files = list(project_dir.glob("*.html")) + list(project_dir.glob("**/*.html"))

    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
            local_links = extract_local_links_from_html(content)

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


def format_missing_files_error(
    missing_files: dict[str, list[str]], percentage: int
) -> str:
    """
    Format a user-friendly error message for missing files.

    Args:
        missing_files: Dictionary from check_missing_files_in_project
        percentage: The progress percentage that was attempted

    Returns:
        Formatted error message string
    """
    total_missing = sum(len(links) for links in missing_files.values())

    result = f"\n{'=' * 60}\n"
    result += "CANNOT MARK AS COMPLETE - MISSING FILES!\n"
    result += f"{'=' * 60}\n\n"
    result += f"You tried to mark progress as {percentage}%, but your HTML files\n"
    result += f"reference {total_missing} file(s) that DO NOT EXIST.\n\n"
    result += "Progress has been CAPPED at 85% until you create these files:\n\n"

    for html_file, missing_links in missing_files.items():
        result += f"  In {html_file}:\n"
        for link in missing_links:
            result += f"     {link} - FILE DOES NOT EXIST\n"

    result += f"\n{'=' * 60}\n"
    result += "ACTION REQUIRED:\n"
    result += "1. Create each missing file listed above using write_file()\n"
    result += "2. Then call update_research_progress(100, ...) again\n"
    result += f"{'=' * 60}\n"

    return result


def format_missing_files_warning(missing_files: dict[str, list[str]]) -> str:
    """
    Format a warning message for missing files (non-blocking).

    Args:
        missing_files: Dictionary from check_missing_files_in_project

    Returns:
        Formatted warning message string
    """
    result = "\n\nWARNING: Some HTML files reference files that don't exist yet:\n"

    for html_file, missing_links in missing_files.items():
        result += f"    {html_file}: {', '.join(missing_links)}\n"

    result += "Remember to create these files before marking complete!"

    return result
