"""
Tests for research instruction prompt template.

These tests verify that the prompt template:
1. Can be loaded and formatted without errors
2. Contains all required sections
3. Has proper temporal awareness instructions
4. Doesn't have Python format string conflicts (curly braces in CSS/code)
"""

import sys
from pathlib import Path
from datetime import datetime

# Add pytest to path if not installed
try:
    import pytest
except ImportError:
    print("pytest not installed. Run: pip install pytest")
    sys.exit(1)


# Path to prompts
PROMPTS_DIR = Path(__file__).parent.parent / "scripts" / "prompts"
RESEARCH_INSTRUCTION_PATH = PROMPTS_DIR / "research-instruction.txt"
USER_PROMPT_PATH = Path(__file__).parent.parent / "scripts" / "user-prompt.template.txt"


class TestPromptLoading:
    """Test that prompts can be loaded and formatted."""

    def test_research_instruction_exists(self):
        """Research instruction file should exist."""
        assert RESEARCH_INSTRUCTION_PATH.exists(), (
            f"research-instruction.txt not found at {RESEARCH_INSTRUCTION_PATH}"
        )

    def test_user_prompt_exists(self):
        """User prompt template should exist."""
        assert USER_PROMPT_PATH.exists(), (
            f"user-prompt.template.txt not found at {USER_PROMPT_PATH}"
        )

    def test_research_instruction_format_no_errors(self):
        """Research instruction should format without KeyError from curly braces."""
        template = RESEARCH_INSTRUCTION_PATH.read_text()
        formatted = None

        # These are the only variables that should be in the template
        try:
            formatted = template.format(
                topic="Test Topic",
                current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                depth_instruction="Standard depth",
                style_instruction="Comprehensive style",
            )
        except KeyError as e:
            pytest.fail(
                f"Format string error - unescaped curly braces in template: {e}\n"
                f"CSS/code blocks with {{ }} must be escaped as {{{{ }}}}"
            )

        assert formatted is not None and len(formatted) > 0

    def test_user_prompt_format_no_errors(self):
        """User prompt should format without errors."""
        template = USER_PROMPT_PATH.read_text()
        formatted = None

        try:
            formatted = template.format(topic="Test Topic")
        except KeyError as e:
            pytest.fail(f"Format string error in user prompt: {e}")

        assert formatted is not None and "Test Topic" in formatted

    def test_user_prompt_is_minimal(self):
        """User prompt should be minimal - just the topic, not full instructions."""
        template = USER_PROMPT_PATH.read_text()

        # User prompt should be short (under 20 lines)
        lines = template.strip().split("\n")
        assert len(lines) < 20, (
            f"User prompt too long ({len(lines)} lines). "
            f"Instructions should be in system prompt, not user prompt."
        )

        # Should NOT contain methodology sections
        assert "PHASE 1:" not in template, "Methodology should be in system prompt"
        assert "CRAAP" not in template, "CRAAP framework should be in system prompt"
        assert "GAP ANALYSIS" not in template, "Gap analysis should be in system prompt"


class TestTemporalAwareness:
    """Test that temporal awareness instructions are present and complete."""

    def get_template(self):
        return RESEARCH_INSTRUCTION_PATH.read_text()

    def test_has_temporal_awareness_section(self):
        """Should have TEMPORAL AWARENESS section."""
        template = self.get_template()
        assert "TEMPORAL AWARENESS" in template, (
            "Missing TEMPORAL AWARENESS section in research instruction"
        )

    def test_has_current_time_placeholder(self):
        """Should reference {current_time} for recency checks."""
        template = self.get_template()
        assert "{current_time}" in template, (
            "Missing {current_time} placeholder for temporal awareness"
        )

    def test_has_latest_instructions(self):
        """Should have instructions for handling 'latest' requests."""
        template = self.get_template()
        assert "LATEST" in template or "latest" in template, (
            "Missing instructions for handling 'latest' queries"
        )

    def test_has_domain_thresholds(self):
        """Should have domain-specific recency thresholds."""
        template = self.get_template()
        # Check for AI/fast-moving fields
        assert "AI" in template and ("days" in template or "weeks" in template), (
            "Missing AI/fast-moving field recency threshold"
        )

    def test_has_product_release_date_verification(self):
        """Should instruct to verify product release dates."""
        template = self.get_template()
        assert "release date" in template.lower() or "released" in template.lower(), (
            "Missing instructions to verify product release dates"
        )

    def test_warns_against_old_year_searches(self):
        """Should warn against searching for year ranges like '2024 2025'."""
        template = self.get_template()
        assert "2024 2025" in template or "year range" in template.lower(), (
            "Missing warning about searching old year ranges"
        )

    def test_has_time_range_parameter_instruction(self):
        """Should mention using time_range parameter for searches."""
        template = self.get_template()
        assert "time_range" in template, (
            "Missing instruction to use time_range parameter"
        )


class TestResearchMethodology:
    """Test that research methodology instructions are present."""

    def get_template(self):
        return RESEARCH_INSTRUCTION_PATH.read_text()

    def test_has_planning_phase(self):
        """Should have planning phase instructions."""
        template = self.get_template()
        assert "PLANNING" in template, "Missing PLANNING phase"

    def test_has_search_phase(self):
        """Should have search phase instructions."""
        template = self.get_template()
        assert "SEARCH" in template, "Missing SEARCH phase"

    def test_has_evaluate_phase(self):
        """Should have source evaluation instructions."""
        template = self.get_template()
        assert "EVALUATE" in template or "CRAAP" in template, (
            "Missing source evaluation instructions"
        )

    def test_has_gap_analysis(self):
        """Should have gap analysis instructions."""
        template = self.get_template()
        assert "GAP ANALYSIS" in template, "Missing GAP ANALYSIS phase"

    def test_has_synthesis_phase(self):
        """Should have synthesis phase instructions."""
        template = self.get_template()
        assert "SYNTHESIS" in template, "Missing SYNTHESIS phase"

    def test_has_iterative_loop(self):
        """Should emphasize iterative research loop."""
        template = self.get_template()
        assert "iterate" in template.lower() or "LOOP" in template, (
            "Missing iterative research loop instructions"
        )


class TestOutputRequirements:
    """Test that output requirements are specified."""

    def get_template(self):
        return RESEARCH_INSTRUCTION_PATH.read_text()

    def test_has_metadata_instructions(self):
        """Should have metadata tool instructions."""
        template = self.get_template()
        assert "filesystem_write_research_metadata" in template, (
            "Missing metadata tool instructions"
        )

    def test_has_progress_tracking(self):
        """Should have progress tracking instructions."""
        template = self.get_template()
        assert "filesystem_update_research_progress" in template, (
            "Missing progress tracking instructions"
        )

    def test_has_html_styling_rules(self):
        """Should have HTML styling rules for dark theme."""
        template = self.get_template()
        assert "dark" in template.lower() or "background" in template.lower(), (
            "Missing HTML styling rules for dark theme"
        )

    def test_has_file_structure_guidance(self):
        """Should have multi-file structure guidance."""
        template = self.get_template()
        assert "index.html" in template or "multiple files" in template.lower(), (
            "Missing file structure guidance"
        )


class TestNoUnescapedBraces:
    """Test that there are no unescaped curly braces that would break formatting."""

    def test_no_css_braces(self):
        """CSS blocks with { } should be escaped or removed."""
        template = RESEARCH_INSTRUCTION_PATH.read_text()

        # List of patterns that indicate CSS with unescaped braces
        css_patterns = [
            "body {",
            ".card {",
            "h1 {",
            "table {",
            "th {",
            "td {",
            "code {",
        ]

        for pattern in css_patterns:
            # If pattern exists, it should be in a description, not actual CSS
            if pattern in template:
                # Check it's not followed by CSS properties (which would break format())
                idx = template.find(pattern)
                # Get the next 100 chars after the pattern
                context = template[idx : idx + 100]
                # Should NOT have CSS property patterns like "property: value;"
                has_css_properties = (
                    ":" in context.split("}")[0] and "max-width" in context
                )
                assert not has_css_properties, (
                    f"Found unescaped CSS block starting with '{pattern}'. "
                    f"This will break Python's format(). Context: {context[:50]}..."
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
