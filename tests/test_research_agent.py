"""
Tests for the research agent script.

These tests verify that:
1. The research agent script can be imported without errors
2. The Agent class API is used correctly
3. Required imports are available
4. The script structure is correct
"""

import sys
from pathlib import Path
import ast
import importlib.util

try:
    import pytest
except ImportError:
    print("pytest not installed. Run: pip install pytest")
    sys.exit(1)


SCRIPTS_DIR = Path(__file__).parent.parent / "scripts"
RESEARCH_AGENT_PATH = SCRIPTS_DIR / "research-agent.py"


class TestResearchAgentScript:
    """Test the research agent script structure and imports."""

    def test_script_exists(self):
        """Research agent script should exist."""
        assert RESEARCH_AGENT_PATH.exists(), (
            f"research-agent.py not found at {RESEARCH_AGENT_PATH}"
        )

    def test_script_is_valid_python(self):
        """Script should be valid Python syntax."""
        source = RESEARCH_AGENT_PATH.read_text()
        try:
            ast.parse(source)
        except SyntaxError as e:
            pytest.fail(f"research-agent.py has syntax error: {e}")

    def test_script_has_main_function(self):
        """Script should have a main() function."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        function_names = [
            node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
        ]

        assert "main" in function_names, "Script must have a main() function"

    def test_script_has_run_research_function(self):
        """Script should have a run_research() async function."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        async_function_names = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, ast.AsyncFunctionDef)
        ]

        assert "run_research" in async_function_names, (
            "Script must have an async run_research() function"
        )

    def test_script_has_message_loop_function(self):
        """Script should have a message_loop() async function."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        async_function_names = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, ast.AsyncFunctionDef)
        ]

        assert "message_loop" in async_function_names, (
            "Script must have an async message_loop() function"
        )


class TestResearchAgentImports:
    """Test that required imports are present."""

    def get_imports(self):
        """Extract import statements from the script."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)

        return imports

    def test_imports_mcp_agent_app(self):
        """Should import MCPApp from mcp_agent."""
        imports = self.get_imports()
        assert any("mcp_agent" in imp for imp in imports), (
            "Must import from mcp_agent package"
        )

    def test_imports_agent_class(self):
        """Should import Agent class."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "from mcp_agent.agents.agent import Agent" in source, (
            "Must import Agent class from mcp_agent.agents.agent"
        )

    def test_imports_augmented_llm(self):
        """Should import AugmentedLLM classes for providers."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "AnthropicAugmentedLLM" in source, "Must import AnthropicAugmentedLLM"

    def test_imports_asyncio(self):
        """Should import asyncio."""
        imports = self.get_imports()
        assert "asyncio" in imports, "Must import asyncio"

    def test_imports_json(self):
        """Should import json."""
        imports = self.get_imports()
        assert "json" in imports, "Must import json"


class TestResearchAgentAPI:
    """Test that the Agent API is used correctly."""

    def test_uses_agent_initialize(self):
        """Should call agent.initialize() to connect to MCP servers."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "agent.initialize()" in source or "await agent.initialize()" in source, (
            "Must call agent.initialize() to connect to MCP servers"
        )

    def test_uses_agent_attach_llm(self):
        """Should call agent.attach_llm() to create LLM instance."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "attach_llm(" in source, (
            "Must call agent.attach_llm() to create LLM instance"
        )

    def test_uses_llm_generate_str(self):
        """Should call llm.generate_str() to generate responses."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "generate_str(" in source, (
            "Must call llm.generate_str() to generate responses"
        )

    def test_does_not_use_process_request(self):
        """Should NOT use agent.process_request() - that method doesn't exist."""
        source = RESEARCH_AGENT_PATH.read_text()
        # Check it's not called on agent
        assert "agent.process_request" not in source, (
            "Agent class does not have process_request method. "
            "Use agent.attach_llm() then llm.generate_str() instead."
        )


class TestResearchAgentStructure:
    """Test the script structure for correctness."""

    def test_has_tool_call_handler(self):
        """Should have ToolCallHandler class for logging."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "class ToolCallHandler" in source, (
            "Must have ToolCallHandler class for intercepting tool calls"
        )

    def test_has_update_progress_function(self):
        """Should have update_progress async function."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        async_function_names = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, ast.AsyncFunctionDef)
        ]

        assert "update_progress" in async_function_names, (
            "Must have async update_progress() function"
        )

    def test_has_request_params(self):
        """Should use RequestParams for LLM configuration."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "RequestParams" in source, (
            "Must use RequestParams for configuring LLM parameters"
        )

    def test_changes_directory_before_agent(self):
        """Should change to project directory before creating agent."""
        source = RESEARCH_AGENT_PATH.read_text()
        # Check that os.chdir is called before Agent creation
        chdir_pos = source.find("os.chdir(project_dir)")
        agent_pos = source.find("Agent(")

        assert chdir_pos != -1, "Must call os.chdir(project_dir)"
        assert agent_pos != -1, "Must create Agent instance"
        assert chdir_pos < agent_pos, (
            "Must call os.chdir(project_dir) BEFORE creating Agent"
        )


class TestAutoModelHandling:
    """Test that 'auto' model name is properly handled."""

    def test_handles_auto_model_for_anthropic(self):
        """Script should replace 'auto' model with actual model for anthropic provider."""
        source = RESEARCH_AGENT_PATH.read_text()
        # Check that the script handles "auto" model
        assert 'if model == "auto"' in source, (
            "Script must handle 'auto' model name and replace with actual model"
        )

    def test_defaults_to_claude_sonnet_for_anthropic(self):
        """Script should default to claude-sonnet-4-5 for anthropic provider."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "claude-sonnet-4-5" in source, (
            "Script must default to claude-sonnet-4-5 for anthropic provider"
        )

    def test_defaults_to_gpt_for_openai(self):
        """Script should default to gpt-4o-mini for openai provider."""
        source = RESEARCH_AGENT_PATH.read_text()
        assert "gpt-4o-mini" in source, (
            "Script must default to gpt-4o-mini for openai provider"
        )

    def test_auto_model_check_in_main_function(self):
        """The 'auto' model check should be in the main() function."""
        source = RESEARCH_AGENT_PATH.read_text()
        tree = ast.parse(source)

        # Find the main function
        main_func = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == "main":
                main_func = node
                break

        assert main_func is not None, "Must have main() function"

        # Check that "auto" is handled in main
        main_source = ast.get_source_segment(source, main_func)
        assert "auto" in main_source, "main() function must handle 'auto' model name"


class TestMCPAgentAvailability:
    """Test that mcp-agent package is available with correct API."""

    def test_mcp_agent_importable(self):
        """mcp-agent package should be importable."""
        try:
            import mcp_agent
        except ImportError:
            pytest.skip("mcp-agent not installed in test environment")

    def test_agent_class_exists(self):
        """Agent class should exist in mcp_agent.agents.agent."""
        try:
            from mcp_agent.agents.agent import Agent
        except ImportError:
            pytest.skip("mcp-agent not installed in test environment")

        assert Agent is not None

    def test_agent_has_initialize_method(self):
        """Agent class should have initialize method."""
        try:
            from mcp_agent.agents.agent import Agent
        except ImportError:
            pytest.skip("mcp-agent not installed in test environment")

        assert hasattr(Agent, "initialize"), "Agent class must have initialize() method"

    def test_agent_has_attach_llm_method(self):
        """Agent class should have attach_llm method."""
        try:
            from mcp_agent.agents.agent import Agent
        except ImportError:
            pytest.skip("mcp-agent not installed in test environment")

        assert hasattr(Agent, "attach_llm"), "Agent class must have attach_llm() method"

    def test_agent_does_not_have_process_request(self):
        """Agent class should NOT have process_request method."""
        try:
            from mcp_agent.agents.agent import Agent
        except ImportError:
            pytest.skip("mcp-agent not installed in test environment")

        assert not hasattr(Agent, "process_request"), (
            "Agent class should NOT have process_request() method. "
            "If this fails, the API may have changed."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
