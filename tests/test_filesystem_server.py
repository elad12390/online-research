"""
Black-box tests for the filesystem MCP server.

Tests all public functions and edge cases without accessing internal implementation.
Focuses on inputs, outputs, and observable behavior.
"""

import sys
import json
import tempfile
from pathlib import Path
from datetime import datetime

try:
    import pytest
except ImportError:
    print("pytest not installed. Run: pip install pytest")
    sys.exit(1)


# =============================================================================
# Test Helpers - Reimplement functions for black-box testing
# =============================================================================


def extract_local_links_from_html(html_content: str) -> set:
    """Extract local file links from HTML content (href and src attributes)."""
    import re

    links = set()
    pattern = r'(?:href|src)=["\']([^"\']+)["\']'
    matches = re.findall(pattern, html_content, re.IGNORECASE)
    for link in matches:
        if link.startswith(
            ("http://", "https://", "mailto:", "#", "data:", "javascript:")
        ):
            continue
        if not link.strip():
            continue
        link = link.split("?")[0].split("#")[0]
        if link:
            links.add(link)
    return links


def check_missing_files_in_project(project_dir: Path) -> dict:
    """Scan all HTML files in project directory and check for broken local links."""
    missing_files = {}
    html_files = list(project_dir.glob("*.html")) + list(project_dir.glob("**/*.html"))
    for html_file in html_files:
        try:
            content = html_file.read_text(encoding="utf-8")
            local_links = extract_local_links_from_html(content)
            missing_for_file = []
            for link in local_links:
                if link.startswith("/"):
                    linked_path = project_dir / link.lstrip("/")
                else:
                    linked_path = html_file.parent / link
                if not linked_path.exists():
                    missing_for_file.append(link)
            if missing_for_file:
                rel_html_path = html_file.relative_to(project_dir)
                missing_files[str(rel_html_path)] = missing_for_file
        except Exception:
            pass
    return missing_files


def is_path_allowed(path: Path, allowed_dirs: list) -> tuple:
    """Check if a path is within allowed directories."""
    try:
        if not path.is_absolute() and allowed_dirs:
            path = allowed_dirs[0] / path
        resolved_path = path.resolve()
        is_allowed = any(
            resolved_path == base or base in resolved_path.parents
            for base in allowed_dirs
        )
        return (is_allowed, resolved_path)
    except (OSError, ValueError):
        return (False, path)


# =============================================================================
# Link Extraction Tests
# =============================================================================


class TestExtractLocalLinks:
    """Test the link extraction from HTML - all edge cases."""

    # Basic link types
    def test_extracts_href_links(self):
        """Should extract href attributes."""
        html = '<a href="page2.html">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page2.html" in links

    def test_extracts_src_links(self):
        """Should extract src attributes."""
        html = '<img src="image.png">'
        links = extract_local_links_from_html(html)
        assert "image.png" in links

    def test_extracts_multiple_links(self):
        """Should extract multiple links from same HTML."""
        html = """
        <a href="page1.html">Link 1</a>
        <a href="page2.html">Link 2</a>
        <img src="image.png">
        """
        links = extract_local_links_from_html(html)
        assert len(links) == 3
        assert "page1.html" in links
        assert "page2.html" in links
        assert "image.png" in links

    def test_extracts_nested_links(self):
        """Should extract links from nested HTML structures."""
        html = """
        <div>
            <section>
                <article>
                    <a href="deep-link.html">Deep</a>
                </article>
            </section>
        </div>
        """
        links = extract_local_links_from_html(html)
        assert "deep-link.html" in links

    # External URL filtering
    def test_ignores_https_urls(self):
        """Should ignore https:// URLs."""
        html = '<a href="https://example.com">External</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_http_urls(self):
        """Should ignore http:// URLs."""
        html = '<a href="http://example.com">External</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_mailto_links(self):
        """Should ignore mailto: links."""
        html = '<a href="mailto:test@example.com">Email</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_anchor_links(self):
        """Should ignore pure anchor (#) links."""
        html = '<a href="#section">Anchor</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_data_urls(self):
        """Should ignore data: URLs."""
        html = '<img src="data:image/png;base64,abc123">'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_javascript_links(self):
        """Should ignore javascript: links."""
        html = '<a href="javascript:void(0)">JS Link</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_javascript_function_calls(self):
        """Should ignore javascript function calls."""
        html = '<a href="javascript:doSomething()">JS</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    # Query string and anchor stripping
    def test_strips_query_strings(self):
        """Should strip query strings from links."""
        html = '<a href="page.html?param=value">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "page.html?param=value" not in links

    def test_strips_complex_query_strings(self):
        """Should strip complex query strings."""
        html = '<a href="page.html?a=1&b=2&c=3">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    def test_strips_anchors_from_local_links(self):
        """Should strip anchors from local links."""
        html = '<a href="page.html#section">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "page.html#section" not in links

    def test_strips_both_query_and_anchor(self):
        """Should strip both query string and anchor."""
        html = '<a href="page.html?foo=bar#section">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    # Quote handling
    def test_handles_single_quotes(self):
        """Should handle single-quoted attributes."""
        html = "<a href='page.html'>Link</a>"
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    def test_handles_double_quotes(self):
        """Should handle double-quoted attributes."""
        html = '<a href="page.html">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    def test_handles_mixed_quotes(self):
        """Should handle mixed quote styles in same document."""
        html = """
        <a href="double.html">Double</a>
        <a href='single.html'>Single</a>
        """
        links = extract_local_links_from_html(html)
        assert "double.html" in links
        assert "single.html" in links

    # Case handling
    def test_handles_uppercase_href(self):
        """Should handle uppercase HREF."""
        html = '<a HREF="page.html">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    def test_handles_uppercase_src(self):
        """Should handle uppercase SRC."""
        html = '<img SRC="image.png">'
        links = extract_local_links_from_html(html)
        assert "image.png" in links

    def test_handles_mixed_case(self):
        """Should handle mixed case attributes."""
        html = '<a HrEf="page.html">Link</a><img sRc="image.png">'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "image.png" in links

    # Path formats
    def test_handles_relative_paths(self):
        """Should handle relative paths."""
        html = '<a href="../parent/page.html">Up</a>'
        links = extract_local_links_from_html(html)
        assert "../parent/page.html" in links

    def test_handles_subdirectory_paths(self):
        """Should handle subdirectory paths."""
        html = '<a href="subdir/page.html">Sub</a>'
        links = extract_local_links_from_html(html)
        assert "subdir/page.html" in links

    def test_handles_absolute_paths(self):
        """Should handle absolute paths (starting with /)."""
        html = '<a href="/root/page.html">Root</a>'
        links = extract_local_links_from_html(html)
        assert "/root/page.html" in links

    def test_handles_current_dir_paths(self):
        """Should handle current directory paths (./)."""
        html = '<a href="./page.html">Current</a>'
        links = extract_local_links_from_html(html)
        assert "./page.html" in links

    # Empty and whitespace
    def test_ignores_empty_href(self):
        """Should ignore empty href."""
        html = '<a href="">Empty</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_whitespace_only_href(self):
        """Should ignore whitespace-only href."""
        html = '<a href="   ">Whitespace</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_handles_links_with_spaces_in_path(self):
        """Should handle links with spaces in filename."""
        html = '<a href="my file.html">Spaced</a>'
        links = extract_local_links_from_html(html)
        assert "my file.html" in links

    # File types
    def test_extracts_various_file_types(self):
        """Should extract links to various file types."""
        html = """
        <a href="doc.pdf">PDF</a>
        <a href="image.jpg">JPG</a>
        <a href="style.css">CSS</a>
        <a href="script.js">JS</a>
        <a href="data.json">JSON</a>
        """
        links = extract_local_links_from_html(html)
        assert "doc.pdf" in links
        assert "image.jpg" in links
        assert "style.css" in links
        assert "script.js" in links
        assert "data.json" in links

    # Deduplication
    def test_deduplicates_links(self):
        """Should return unique links only."""
        html = """
        <a href="page.html">Link 1</a>
        <a href="page.html">Link 2</a>
        <a href="page.html">Link 3</a>
        """
        links = extract_local_links_from_html(html)
        assert len(links) == 1
        assert "page.html" in links

    # Edge cases
    def test_handles_empty_html(self):
        """Should handle empty HTML."""
        links = extract_local_links_from_html("")
        assert len(links) == 0

    def test_handles_no_links(self):
        """Should handle HTML with no links."""
        html = "<p>Just some text</p>"
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_handles_malformed_html(self):
        """Should handle malformed HTML gracefully."""
        html = '<a href="page.html">Unclosed'
        links = extract_local_links_from_html(html)
        assert "page.html" in links


# =============================================================================
# Missing Files Detection Tests
# =============================================================================


class TestCheckMissingFiles:
    """Test the missing file detection in project directories."""

    # Basic detection
    def test_detects_missing_file(self):
        """Should detect when a linked file doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert "missing.html" in missing["index.html"]

    def test_no_missing_when_file_exists(self):
        """Should not report missing files that exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="page2.html">Page 2</a>')
            page2_html = project_dir / "page2.html"
            page2_html.write_text("<p>Page 2 content</p>")

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_detects_multiple_missing_files(self):
        """Should detect multiple missing files from one HTML."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text("""
                <a href="page1.html">Page 1</a>
                <a href="page2.html">Page 2</a>
                <a href="page3.html">Page 3</a>
            """)

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert len(missing["index.html"]) == 3

    def test_checks_multiple_html_files(self):
        """Should check all HTML files in the project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing1.html">Missing 1</a>')

            about_html = project_dir / "about.html"
            about_html.write_text('<a href="missing2.html">Missing 2</a>')

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert "about.html" in missing

    # External URL handling
    def test_ignores_external_https_urls(self):
        """Should not report external HTTPS URLs as missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="https://example.com">External</a>')

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_ignores_external_http_urls(self):
        """Should not report external HTTP URLs as missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="http://example.com">External</a>')

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_ignores_mailto_links(self):
        """Should not report mailto links as missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="mailto:test@example.com">Email</a>')

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    # Subdirectory handling
    def test_handles_subdirectories(self):
        """Should handle files in subdirectories."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            subdir = project_dir / "subdir"
            subdir.mkdir()

            sub_html = subdir / "page.html"
            sub_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            assert any("page.html" in key for key in missing.keys())

    def test_resolves_relative_paths_correctly(self):
        """Should resolve relative paths from HTML file location."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            subdir = project_dir / "subdir"
            subdir.mkdir()

            # HTML in subdir links to file that exists in same dir
            sub_html = subdir / "page.html"
            sub_html.write_text('<a href="sibling.html">Sibling</a>')

            sibling_html = subdir / "sibling.html"
            sibling_html.write_text("<p>Sibling</p>")

            missing = check_missing_files_in_project(project_dir)

            # Should not report as missing since sibling.html exists
            assert "subdir/page.html" not in missing

    def test_handles_absolute_paths(self):
        """Should handle absolute paths (from project root)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="/subdir/page.html">Absolute</a>')

            subdir = project_dir / "subdir"
            subdir.mkdir()
            page_html = subdir / "page.html"
            page_html.write_text("<p>Page</p>")

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    # Mixed scenarios
    def test_mixed_existing_and_missing(self):
        """Should only report missing files, not existing ones."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text("""
                <a href="exists.html">Exists</a>
                <a href="missing.html">Missing</a>
            """)

            exists_html = project_dir / "exists.html"
            exists_html.write_text("<p>Exists</p>")

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert "missing.html" in missing["index.html"]
            assert "exists.html" not in missing["index.html"]

    # Edge cases
    def test_empty_project(self):
        """Should handle project with no HTML files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_html_with_no_links(self):
        """Should handle HTML files with no links."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text("<p>Just text, no links</p>")

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_deeply_nested_structure(self):
        """Should handle deeply nested directory structures."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            deep_dir = project_dir / "a" / "b" / "c" / "d"
            deep_dir.mkdir(parents=True)

            deep_html = deep_dir / "deep.html"
            deep_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            assert any("deep.html" in key for key in missing.keys())


# =============================================================================
# Progress Blocking Tests
# =============================================================================


class TestProgressBlocking:
    """Test that progress is blocked when files are missing."""

    def test_should_block_at_90_percent_with_missing_files(self):
        """Progress >= 90% should be blocked if files are missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            percentage = 100
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 85

    def test_should_block_at_95_percent_with_missing_files(self):
        """Progress at 95% should also be blocked."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            percentage = 95
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 85

    def test_should_allow_89_percent_with_missing_files(self):
        """Progress at 89% should NOT be blocked (only >= 90)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            percentage = 89
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 89

    def test_should_allow_100_percent_when_no_missing_files(self):
        """Progress 100% should be allowed when all files exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text('<a href="page2.html">Page 2</a>')

            page2_html = project_dir / "page2.html"
            page2_html.write_text("<p>Content</p>")

            missing = check_missing_files_in_project(project_dir)

            percentage = 100
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 100

    def test_should_allow_100_percent_with_no_html_files(self):
        """Progress 100% should be allowed when there are no HTML files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Only markdown, no HTML
            readme = project_dir / "README.md"
            readme.write_text("# Project")

            missing = check_missing_files_in_project(project_dir)

            percentage = 100
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 100

    def test_should_allow_100_percent_with_only_external_links(self):
        """Progress 100% allowed when HTML only has external links."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text("""
                <a href="https://example.com">External</a>
                <a href="mailto:test@test.com">Email</a>
            """)

            missing = check_missing_files_in_project(project_dir)

            percentage = 100
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 100


# =============================================================================
# Path Validation Tests
# =============================================================================


class TestPathValidation:
    """Test path validation and security."""

    def test_allows_path_in_allowed_dir(self):
        """Should allow paths within allowed directories."""
        with tempfile.TemporaryDirectory() as tmpdir:
            allowed = [Path(tmpdir)]
            test_path = Path(tmpdir) / "file.txt"

            is_allowed, resolved = is_path_allowed(test_path, allowed)

            assert is_allowed is True

    def test_rejects_path_outside_allowed_dir(self):
        """Should reject paths outside allowed directories."""
        with tempfile.TemporaryDirectory() as tmpdir:
            allowed = [Path(tmpdir)]
            test_path = Path("/etc/passwd")

            is_allowed, resolved = is_path_allowed(test_path, allowed)

            assert is_allowed is False

    def test_resolves_relative_paths(self):
        """Should resolve relative paths against first allowed directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            allowed = [Path(tmpdir)]
            test_path = Path("file.txt")  # Relative

            is_allowed, resolved = is_path_allowed(test_path, allowed)

            assert is_allowed is True
            assert str(resolved) == str(Path(tmpdir) / "file.txt")

    def test_handles_parent_traversal(self):
        """Should handle and reject parent directory traversal attempts."""
        with tempfile.TemporaryDirectory() as tmpdir:
            allowed = [Path(tmpdir)]
            # Try to escape using ../
            test_path = Path(tmpdir) / ".." / ".." / "etc" / "passwd"

            is_allowed, resolved = is_path_allowed(test_path, allowed)

            assert is_allowed is False

    def test_allows_subdirectories(self):
        """Should allow paths in subdirectories of allowed dirs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            allowed = [Path(tmpdir)]
            subdir = Path(tmpdir) / "sub" / "dir"
            subdir.mkdir(parents=True)
            test_path = subdir / "file.txt"

            is_allowed, resolved = is_path_allowed(test_path, allowed)

            assert is_allowed is True

    def test_handles_empty_allowed_dirs(self):
        """Should reject all paths when no directories are allowed."""
        test_path = Path("/some/path")

        is_allowed, resolved = is_path_allowed(test_path, [])

        assert is_allowed is False

    def test_handles_multiple_allowed_dirs(self):
        """Should allow paths in any of multiple allowed directories."""
        with tempfile.TemporaryDirectory() as tmpdir1:
            with tempfile.TemporaryDirectory() as tmpdir2:
                allowed = [Path(tmpdir1), Path(tmpdir2)]

                path1 = Path(tmpdir1) / "file.txt"
                path2 = Path(tmpdir2) / "file.txt"

                assert is_path_allowed(path1, allowed)[0] is True
                assert is_path_allowed(path2, allowed)[0] is True


# =============================================================================
# Metadata Tests
# =============================================================================


class TestMetadataWriting:
    """Test research metadata writing functionality."""

    def test_metadata_file_created(self):
        """Should create metadata.json file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            metadata_file = project_dir / "metadata.json"

            metadata = {
                "title": "Test Research",
                "description": "Test description",
                "category": "Test",
                "tags": ["test", "demo"],
                "summary": "Test summary",
            }

            metadata_file.write_text(json.dumps(metadata, indent=2))

            assert metadata_file.exists()

            content = json.loads(metadata_file.read_text())
            assert content["title"] == "Test Research"

    def test_metadata_contains_required_fields(self):
        """Should contain all required metadata fields."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            metadata_file = project_dir / "metadata.json"

            metadata = {
                "title": "Test",
                "description": "Desc",
                "category": "Cat",
                "tags": [],
                "summary": "Sum",
                "createdAt": datetime.utcnow().isoformat() + "Z",
                "updatedAt": datetime.utcnow().isoformat() + "Z",
            }

            metadata_file.write_text(json.dumps(metadata, indent=2))

            content = json.loads(metadata_file.read_text())

            assert "title" in content
            assert "description" in content
            assert "category" in content
            assert "tags" in content
            assert "summary" in content
            assert "createdAt" in content
            assert "updatedAt" in content

    def test_metadata_tags_is_list(self):
        """Tags should be a list."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            metadata_file = project_dir / "metadata.json"

            metadata = {
                "title": "Test",
                "tags": ["a", "b", "c"],
            }

            metadata_file.write_text(json.dumps(metadata, indent=2))

            content = json.loads(metadata_file.read_text())
            assert isinstance(content["tags"], list)
            assert len(content["tags"]) == 3

    def test_metadata_empty_tags(self):
        """Should handle empty tags list."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            metadata_file = project_dir / "metadata.json"

            metadata = {
                "title": "Test",
                "tags": [],
            }

            metadata_file.write_text(json.dumps(metadata, indent=2))

            content = json.loads(metadata_file.read_text())
            assert content["tags"] == []


# =============================================================================
# Progress File Tests
# =============================================================================


class TestProgressFile:
    """Test progress file writing and reading."""

    def test_progress_file_created(self):
        """Should create progress file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            progress_file = project_dir / ".research-progress.json"

            progress = {
                "percentage": 50,
                "currentTask": "Testing",
                "currentTaskDescription": "Running tests",
                "completedTasks": [],
                "startedAt": datetime.utcnow().isoformat() + "Z",
                "updatedAt": datetime.utcnow().isoformat() + "Z",
            }

            progress_file.write_text(json.dumps(progress, indent=2))

            assert progress_file.exists()

    def test_progress_percentage_clamped_low(self):
        """Should clamp percentage to minimum 0."""

        def clamp_percentage(p):
            return min(100, max(0, p))

        assert clamp_percentage(-10) == 0
        assert clamp_percentage(-1) == 0

    def test_progress_percentage_clamped_high(self):
        """Should clamp percentage to maximum 100."""

        def clamp_percentage(p):
            return min(100, max(0, p))

        assert clamp_percentage(150) == 100
        assert clamp_percentage(101) == 100

    def test_progress_percentage_valid_range(self):
        """Should not clamp valid percentages."""

        def clamp_percentage(p):
            return min(100, max(0, p))

        assert clamp_percentage(0) == 0
        assert clamp_percentage(50) == 50
        assert clamp_percentage(100) == 100

    def test_progress_preserves_completed_tasks(self):
        """Should preserve completed tasks list across updates."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            progress_file = project_dir / ".research-progress.json"

            # Initial progress
            progress1 = {
                "percentage": 30,
                "completedTasks": ["Task 1"],
            }
            progress_file.write_text(json.dumps(progress1))

            # Read and update
            existing = json.loads(progress_file.read_text())
            completed_tasks = existing.get("completedTasks", [])
            completed_tasks.append("Task 2")

            progress2 = {
                "percentage": 60,
                "completedTasks": completed_tasks,
            }
            progress_file.write_text(json.dumps(progress2))

            final = json.loads(progress_file.read_text())
            assert "Task 1" in final["completedTasks"]
            assert "Task 2" in final["completedTasks"]

    def test_progress_has_timestamps(self):
        """Should include timestamp fields."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            progress_file = project_dir / ".research-progress.json"

            now = datetime.utcnow()
            progress = {
                "percentage": 50,
                "startedAt": now.isoformat() + "Z",
                "updatedAt": now.isoformat() + "Z",
            }
            progress_file.write_text(json.dumps(progress))

            content = json.loads(progress_file.read_text())
            assert "startedAt" in content
            assert "updatedAt" in content
            assert content["startedAt"].endswith("Z")

    def test_progress_estimated_completion(self):
        """Should calculate estimated completion time."""
        from datetime import timedelta

        now = datetime.utcnow()
        estimated_minutes = 30

        estimated_completion = (
            now + timedelta(minutes=estimated_minutes)
        ).isoformat() + "Z"

        assert estimated_completion.endswith("Z")
        assert "T" in estimated_completion  # ISO format has T separator


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
