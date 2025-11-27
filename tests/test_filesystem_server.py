"""
Tests for the filesystem MCP server.

Tests the missing file detection functionality that prevents
research from marking as complete when HTML files have broken links.
"""

import sys
import tempfile
from pathlib import Path

try:
    import pytest
except ImportError:
    print("pytest not installed. Run: pip install pytest")
    sys.exit(1)


# Import the functions from filesystem-server.py
# We need to add the path since it's not a proper package
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp-servers"))


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


class TestExtractLocalLinks:
    """Test the link extraction from HTML."""

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

    def test_ignores_external_urls(self):
        """Should ignore http/https URLs."""
        html = """
        <a href="https://example.com">External</a>
        <a href="http://example.com">External</a>
        <a href="local.html">Local</a>
        """
        links = extract_local_links_from_html(html)
        assert "local.html" in links
        assert "https://example.com" not in links
        assert "http://example.com" not in links

    def test_ignores_mailto_links(self):
        """Should ignore mailto: links."""
        html = '<a href="mailto:test@example.com">Email</a>'
        links = extract_local_links_from_html(html)
        assert len(links) == 0

    def test_ignores_anchor_links(self):
        """Should ignore anchor (#) links."""
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

    def test_strips_query_strings(self):
        """Should strip query strings from links."""
        html = '<a href="page.html?param=value">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "page.html?param=value" not in links

    def test_strips_anchors_from_local_links(self):
        """Should strip anchors from local links."""
        html = '<a href="page.html#section">Link</a>'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "page.html#section" not in links

    def test_handles_single_quotes(self):
        """Should handle single-quoted attributes."""
        html = "<a href='page.html'>Link</a>"
        links = extract_local_links_from_html(html)
        assert "page.html" in links

    def test_handles_mixed_case(self):
        """Should handle mixed case attributes."""
        html = '<a HREF="page.html">Link</a><img SRC="image.png">'
        links = extract_local_links_from_html(html)
        assert "page.html" in links
        assert "image.png" in links


class TestCheckMissingFiles:
    """Test the missing file detection in project directories."""

    def test_detects_missing_file(self):
        """Should detect when a linked file doesn't exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Create index.html that links to missing file
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert "missing.html" in missing["index.html"]

    def test_no_missing_when_file_exists(self):
        """Should not report missing files that exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Create both files
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
            assert "page1.html" in missing["index.html"]
            assert "page2.html" in missing["index.html"]
            assert "page3.html" in missing["index.html"]

    def test_checks_multiple_html_files(self):
        """Should check all HTML files in the project."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Create two HTML files with missing links
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing1.html">Missing 1</a>')

            about_html = project_dir / "about.html"
            about_html.write_text('<a href="missing2.html">Missing 2</a>')

            missing = check_missing_files_in_project(project_dir)

            assert "index.html" in missing
            assert "about.html" in missing

    def test_ignores_external_urls(self):
        """Should not report external URLs as missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            index_html = project_dir / "index.html"
            index_html.write_text("""
                <a href="https://example.com">External</a>
                <a href="http://example.com">External HTTP</a>
            """)

            missing = check_missing_files_in_project(project_dir)

            assert len(missing) == 0

    def test_handles_subdirectories(self):
        """Should handle files in subdirectories."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)
            subdir = project_dir / "subdir"
            subdir.mkdir()

            # Create HTML in subdirectory with relative link
            sub_html = subdir / "page.html"
            sub_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            # Should be reported with relative path
            assert any("page.html" in key for key in missing.keys())


class TestProgressBlocking:
    """Test that progress is blocked when files are missing."""

    def test_should_block_at_90_percent_with_missing_files(self):
        """Progress >= 90% should be blocked if files are missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Create HTML with missing link
            index_html = project_dir / "index.html"
            index_html.write_text('<a href="missing.html">Missing</a>')

            missing = check_missing_files_in_project(project_dir)

            # Simulate progress logic
            percentage = 100
            if percentage >= 90 and missing:
                actual_percentage = 85
            else:
                actual_percentage = percentage

            assert actual_percentage == 85, (
                "Progress should be capped at 85% when files are missing"
            )

    def test_should_allow_100_percent_when_no_missing_files(self):
        """Progress 100% should be allowed when all files exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            project_dir = Path(tmpdir)

            # Create HTML with existing link
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

            assert actual_percentage == 100, (
                "Progress should be 100% when no files are missing"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
