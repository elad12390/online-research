#!/usr/bin/env python3
"""
Research Agent using mcp-agent
Executes research tasks with MCP tools and multiple LLM providers
"""

import asyncio
import json
import sys
import logging
import re
from datetime import datetime
from pathlib import Path
from io import StringIO

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm_anthropic import AnthropicAugmentedLLM
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM


from mcp_agent.config import Settings, LoggerSettings


def infer_tool_from_output(output: str) -> str:
    """Infer the tool name from the output content"""
    output_lower = output.lower()

    if "progress updated:" in output_lower:
        return "update_research_progress"
    elif "metadata saved" in output_lower or "title:" in output_lower:
        return "write_research_metadata"
    elif "successfully wrote" in output_lower or "characters to" in output_lower:
        return "write_file"
    elif any(domain in output_lower for domain in ["https://", "http://", "www."]):
        return "web_search"
    elif "directory created" in output_lower or "created directory" in output_lower:
        return "create_directory"

    return "Unknown Tool"


def write_activity_to_file(project_dir: str, activity: dict):
    """Write activity to .activities.json file for persistence"""
    try:
        activities_file = Path(project_dir) / ".activities.json"
        activities = []

        # Load existing activities
        if activities_file.exists():
            try:
                activities = json.loads(activities_file.read_text())
            except:
                activities = []

        # Add new activity with unique ID
        activity["id"] = (
            f"activity_{int(datetime.now().timestamp() * 1000)}_{activity['type']}"
        )
        activities.append(activity)

        # Keep only last 1000 activities to prevent file bloat
        if len(activities) > 1000:
            activities = activities[-1000:]

        # Write back
        activities_file.write_text(json.dumps(activities, indent=2))
    except Exception as e:
        # Don't crash if file write fails
        # Write error to stderr so it doesn't break JSON parsing
        sys.stderr.write(f"Failed to write activity file: {str(e)}\n")


class ToolCallHandler(logging.Handler):
    """Custom logging handler to intercept tool calls and print them as JSON to STDOUT"""

    last_tool_called = None  # Track the last tool that was called
    project_dir: str | None = None  # Will be set by run_research

    def emit(self, record):
        try:
            # Use the raw message without all the logging formatting
            msg = record.getMessage()

            # Filter out low-level noise but allow logger names containing "mcp_agent"
            if "idempotency_key" in msg or "api_key" in msg:
                return

            # Pattern 1: Tool Execution
            # Try matching "Action: tool_name" format first
            action_match = re.search(r"^Action:\s+([a-zA-Z0-9_]+)", msg, re.MULTILINE)
            if action_match:
                tool_name = action_match.group(1)
                ToolCallHandler.last_tool_called = tool_name

                activity = {
                    "type": "tool_call",
                    "tool": tool_name,
                    "args": "Action format (args not extracted)",
                    "timestamp": datetime.utcnow().isoformat(),
                }
                # PRINT TO STDOUT (for ResearchManager)
                print(json.dumps(activity) + "\n", flush=True, end="")
                if ToolCallHandler.project_dir:
                    write_activity_to_file(ToolCallHandler.project_dir, activity)
                return

            # First try structured tool call format
            tool_match = re.search(
                r"(?:Calling|Executing|Invoking|Requesting)\s+(?:tool|function)[:\s]+['\"]?([a-zA-Z0-9_.-]+)['\"]?\s+with\s+(?:args|arguments|parameters)[:\s]*({.+})",
                msg,
                re.IGNORECASE | re.DOTALL,
            )

            if tool_match:
                tool_name = tool_match.group(1)
                tool_args_str = tool_match.group(2).strip()

                # Try to parse as JSON for better formatting
                try:
                    tool_args = json.loads(tool_args_str)
                except:
                    tool_args = tool_args_str

                # Store the tool name for the next result
                ToolCallHandler.last_tool_called = tool_name

                activity = {
                    "type": "tool_call",
                    "tool": tool_name,
                    "args": tool_args,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                # PRINT TO STDOUT
                print(json.dumps(activity) + "\n", flush=True, end="")
                if ToolCallHandler.project_dir:
                    write_activity_to_file(ToolCallHandler.project_dir, activity)
                return

            # Fallback: Try simpler pattern without args
            tool_match_simple = re.search(
                r"(?:Calling|Executing|Invoking|Requesting)\s+(?:tool|function)[:\s]+['\"]?([a-zA-Z0-9_.-]+)['\"]?",
                msg,
                re.IGNORECASE,
            )

            if tool_match_simple:
                candidate = tool_match_simple.group(1)
                # Block list for false positives
                if candidate.lower() not in [
                    "to",
                    "call",
                    "be",
                    "the",
                    "a",
                    "an",
                    "with",
                    "for",
                    "jsonrpc",
                    "mcp_agent",
                ]:
                    tool_name = candidate
                    remaining = msg[tool_match_simple.end() :].strip()
                    ToolCallHandler.last_tool_called = tool_name

                    # PRINT TO STDOUT
                    print(
                        json.dumps(
                            {
                                "type": "tool_call",
                                "tool": tool_name,
                                "args": remaining
                                if remaining
                                else "No arguments provided",
                                "timestamp": datetime.utcnow().isoformat(),
                            }
                        )
                        + "\n",
                        flush=True,
                        end="",
                    )
                    return

            # Pattern 2: Agent Thoughts/Reasoning
            if any(x in msg for x in ["Thought:", "Reasoning:", "Plan:", "Action:"]):
                content = msg
                for prefix in ["Thought:", "Reasoning:", "Plan:"]:
                    if prefix in msg:
                        parts = msg.split(prefix, 1)
                        if len(parts) > 1:
                            content = parts[1].strip()
                            break

                action_match = re.search(
                    r"Action:\s+([a-zA-Z0-9_]+)", msg, re.MULTILINE
                )
                if action_match:
                    tool_name = action_match.group(1)
                    ToolCallHandler.last_tool_called = tool_name

                activity = {
                    "type": "thought",
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                # PRINT TO STDOUT
                print(json.dumps(activity) + "\n", flush=True, end="")
                if ToolCallHandler.project_dir:
                    write_activity_to_file(ToolCallHandler.project_dir, activity)
                return

            # Pattern 3: Tool Results
            if "Tool call results:" in msg:
                content_to_show = ""
                try:
                    parts = msg.split("Tool call results: ", 1)
                    if len(parts) > 1:
                        import ast

                        results_list = ast.literal_eval(parts[1])
                        cleaned_results = []
                        for result in results_list:
                            if "content" in result:
                                for content_item in result["content"]:
                                    if content_item.get("type") == "text":
                                        cleaned_results.append(content_item.get("text"))
                        if cleaned_results:
                            content_to_show = "\n\n".join(cleaned_results)
                except Exception:
                    if len(msg.split("Tool call results: ", 1)) > 1:
                        content_to_show = msg.split("Tool call results: ", 1)[1]
                    else:
                        content_to_show = msg

                if content_to_show:
                    tool_name = (
                        ToolCallHandler.last_tool_called
                        or infer_tool_from_output(content_to_show)
                    )
                    activity = {
                        "type": "tool_result",
                        "tool": tool_name,
                        "output": content_to_show,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    # PRINT TO STDOUT
                    print(json.dumps(activity) + "\n", flush=True, end="")
                    if ToolCallHandler.project_dir:
                        write_activity_to_file(ToolCallHandler.project_dir, activity)
                    return

        except Exception:
            self.handleError(record)


# ... (update_progress and load_conversation_history remain same) ...


async def update_progress(
    project_dir: str, percentage: int, current_task: str, completed_tasks: list[str]
):
    """Update progress file for Research Portal"""
    progress_file = Path(project_dir) / ".research-progress.json"
    progress = {
        "percentage": percentage,
        "currentTask": current_task,
        "currentTaskDescription": f"Currently working on: {current_task}",
        "completedTasks": completed_tasks,
        "startedAt": datetime.utcnow().isoformat() + "Z",
        "estimatedCompletion": datetime.utcnow().isoformat() + "Z",
    }
    progress_file.write_text(json.dumps(progress, indent=2))


async def load_conversation_history(project_dir: str):
    """
    Load previous conversation messages from .messages.json
    Returns a formatted conversation history string
    """
    messages_file = Path(project_dir) / ".messages.json"

    if not messages_file.exists():
        return None

    try:
        messages = json.loads(messages_file.read_text())
        if not messages:
            return None

        # Build conversation history
        history = "=== PREVIOUS CONVERSATION HISTORY ===\n\n"
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            timestamp = msg.get("timestamp", 0)
            dt = datetime.fromtimestamp(timestamp / 1000)

            history += (
                f"[{dt.strftime('%Y-%m-%d %H:%M:%S')}] {role.upper()}: {content}\n"
            )

            if msg.get("response"):
                history += f"ASSISTANT: {msg['response']}\n"
            history += "\n"

        history += "=== END CONVERSATION HISTORY ===\n\n"
        return history

    except Exception as e:
        print(
            json.dumps(
                {
                    "type": "error",
                    "error": f"Failed to load conversation history: {str(e)}",
                }
            )
            + "\n",
            flush=True,
            end="",
        )
        return None


async def message_loop(llm, project_dir: str, request_params):
    """
    Listen for new messages and continue the conversation
    Polls for messages from the .messages.json file
    """
    messages_file = Path(project_dir) / ".messages.json"
    last_message_id = None

    print(
        json.dumps(
            {
                "type": "message_loop_started",
                "message": "Listening for follow-up messages",
            }
        )
        + "\n",
        flush=True,
        end="",
    )

    while True:
        try:
            # Check for kill signal
            kill_file = Path(project_dir) / ".kill"
            if kill_file.exists():
                print(
                    json.dumps(
                        {
                            "type": "log",
                            "message": "Received kill signal. Exiting message loop.",
                        }
                    )
                    + "\n",
                    flush=True,
                    end="",
                )
                # Optional: remove the kill file so future agents don't die immediately
                # But maybe the manager should handle that.
                # Let's just exit.
                return

            # Check for new messages
            if messages_file.exists():
                messages = json.loads(messages_file.read_text())

                # Find unprocessed messages
                for msg in messages:
                    if msg.get("id") != last_message_id and not msg.get("processed"):
                        last_message_id = msg.get("id")
                        user_message = msg.get("content", "")

                        print(
                            json.dumps(
                                {
                                    "type": "user_message_received",
                                    "message": user_message,
                                }
                            )
                            + "\n",
                            flush=True,
                            end="",
                        )

                        # Update progress - starting follow-up research
                        await update_progress(
                            project_dir, 10, "Processing follow-up request", []
                        )

                        # Build a proper research continuation prompt
                        try:
                            prompts_dir = Path(__file__).parent / "prompts"
                            continuation_template = (
                                prompts_dir / "continuation-instruction.txt"
                            ).read_text()
                        except Exception as e:
                            raise RuntimeError(
                                f"Failed to load continuation prompt file: {e}"
                            )

                        continuation_prompt = continuation_template.format(
                            user_message=user_message
                        )

                        print(
                            json.dumps(
                                {
                                    "type": "llm_starting",
                                    "topic": user_message,
                                }
                            ),
                            flush=True,
                        )

                        await update_progress(
                            project_dir, 30, "Researching follow-up", []
                        )

                        # Process the message with the LLM using full research capabilities
                        response = await llm.generate_str(
                            message=continuation_prompt,
                            request_params=request_params,
                        )

                        print(
                            json.dumps(
                                {
                                    "type": "llm_completed",
                                    "status": "success",
                                }
                            )
                            + "\n",
                            flush=True,
                            end="",
                        )

                        await update_progress(
                            project_dir, 90, "Finalizing response", []
                        )

                        # Mark message as processed
                        msg["processed"] = True
                        msg["response"] = response
                        msg["processed_at"] = datetime.utcnow().isoformat()

                        messages_file.write_text(json.dumps(messages, indent=2))

                        await update_progress(
                            project_dir,
                            100,
                            "Follow-up complete - Ready for messages",
                            [],
                        )

                        print(
                            json.dumps(
                                {
                                    "type": "message_processed",
                                    "message_id": last_message_id,
                                }
                            )
                            + "\n",
                            flush=True,
                            end="",
                        )

                        # Also emit the assistant response as an activity
                        print(
                            json.dumps(
                                {
                                    "type": "assistant_response",
                                    "message_id": last_message_id,
                                    "response": response,
                                }
                            )
                            + "\n",
                            flush=True,
                            end="",
                        )

                        # Mark research as completed (for UI status)
                        print(
                            json.dumps(
                                {
                                    "type": "research_fully_completed",
                                    "status": "success",
                                }
                            )
                            + "\n",
                            flush=True,
                            end="",
                        )

            # Sleep briefly before checking again
            await asyncio.sleep(2)

        except Exception as e:
            print(
                json.dumps(
                    {
                        "type": "message_loop_error",
                        "error": str(e),
                    }
                )
                + "\n",
                flush=True,
                end="",
            )
            await asyncio.sleep(5)


async def run_research(
    topic: str,
    project_dir: str,
    provider: str = "anthropic",
    model: str = "claude-sonnet-4-5",
    depth: str = "unlimited",
    style: str = "comprehensive",
    resume: bool = False,
):
    """
    Run research using mcp-agent

    Args:
        topic: Research topic
        project_dir: Directory to save research files
        provider: LLM provider (anthropic, openai, google, etc.)
        model: Model name
        depth: Research depth (quick, standard, deep)
        style: Research style (comprehensive, comparing, practical)
    """

    completed_tasks = []

    # Configure logging:
    # 1. mcp-agent logs -> stderr (so they don't pollute stdout JSON stream)
    # 2. ToolCallHandler -> stdout (JSON messages for ResearchManager)

    # 1. Hijack sys.stdout to ensure NOTHING uses it except us
    # This is the nuclear option to prevent library leaks
    original_stdout = sys.stdout
    sys.stdout = sys.stderr  # Redirect all standard print() calls to stderr by default

    # 2. Create a wrapper to write purely to the real stdout for our JSON protocol
    class ProtocolWriter:
        def write(self, msg):
            original_stdout.write(msg)
            original_stdout.flush()

        def flush(self):
            original_stdout.flush()

    protocol_out = ProtocolWriter()

    # 3. Configure root logger to write to stderr (which is also sys.stdout now)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Remove ALL existing handlers from root and mcp_agent
    root_logger.handlers = []
    logging.getLogger("mcp_agent").handlers = []

    # StreamHandler to stderr for all normal logs
    # We use the original stderr explicitly
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(
        logging.Formatter("[%(levelname)s] %(name)s: %(message)s")
    )
    root_logger.addHandler(stderr_handler)

    # ToolCallHandler needs to write to the REAL stdout via our wrapper
    # But ToolCallHandler uses print() internally which is now redirected to stderr!
    # We need to update ToolCallHandler to use protocol_out.write() or restore sys.stdout locally?
    # No, better to update ToolCallHandler class to use a specific stream.

    # Let's revert the sys.stdout hijack if it's too risky for ToolCallHandler
    # and instead scrub the loggers more thoroughly.
    sys.stdout = original_stdout  # Restore for now, I'll update handlers instead.

    # Remove handlers from ALL loggers
    for name in logging.root.manager.loggerDict:
        logger = logging.getLogger(name)
        logger.handlers = []
        logger.propagate = True

    root_logger.handlers = []

    # Re-add stderr handler to root
    root_logger.addHandler(stderr_handler)

    # ToolCallHandler to stdout for structured JSON
    tool_handler = ToolCallHandler()
    tool_handler.setLevel(logging.DEBUG)
    ToolCallHandler.project_dir = project_dir
    root_logger.addHandler(tool_handler)

    # Explicitly silence mcp_agent logger to verify
    # mcp_logger = logging.getLogger("mcp_agent")
    # mcp_logger.addHandler(stderr_handler)
    # mcp_logger.propagate = False

    # Create a temporary config file with project-specific filesystem path
    import os
    import tempfile
    import yaml

    # Load base config (get absolute path to project root config)
    script_dir = Path(__file__).parent.parent  # Go up from scripts/ to project root
    base_config_path = script_dir / "mcp_agent.config.yaml"

    with open(base_config_path, "r") as f:
        config = yaml.safe_load(f)

    # Override filesystem server to use our custom Python server with allowed directory
    config["mcp"]["servers"]["filesystem"]["args"] = [
        "run",
        "python",
        str(script_dir / "mcp-servers" / "filesystem-server.py"),
        os.path.abspath(project_dir),  # Pass allowed directory as argument
    ]

    # DISABLE mcp-agent's default console logger (which writes to stdout)
    # We handle logging ourselves via root logger above
    if "logger" not in config:
        config["logger"] = {}
    config["logger"]["transports"] = []

    # Write temporary config file
    temp_config_fd, temp_config_path = tempfile.mkstemp(suffix=".yaml", text=True)
    with os.fdopen(temp_config_fd, "w") as f:
        yaml.dump(config, f)

    print(
        json.dumps(
            {
                "type": "init",
                "project_dir": project_dir,
                "topic": topic,
                "provider": provider,
                "model": model,
            }
        )
        + "\n",
        flush=True,
        end="",
    )

    await update_progress(project_dir, 0, "Initializing", completed_tasks)

    print(
        json.dumps(
            {
                "type": "config_created",
                "path": temp_config_path,
                "filesystem_path": os.path.abspath(project_dir),
            }
        )
        + "\n",
        flush=True,
        end="",
    )

    # Create MCPApp with our custom config file (pass path directly)
    app = MCPApp(name="research_wizard", settings=temp_config_path)

    # Clean up temp config file immediately after loading
    try:
        os.remove(temp_config_path)
    except OSError:
        pass

    # Build research instruction
    depth_instructions = {
        "quick": "Provide a concise 15-20 minute research summary with 5-10 tool calls",
        "standard": "Provide a comprehensive 45-60 minute research with 15-20 tool calls",
        "deep": "Provide an exhaustive in-depth research with 30-40 tool calls",
        "unlimited": "Research as thoroughly as needed - NO LIMIT on tool calls or depth",
    }

    style_instructions = {
        "comprehensive": "Create detailed, well-structured documentation with multiple sections",
        "comparing": "Focus on comparisons and contrasts between options",
        "practical": "Focus on practical, actionable insights and implementation",
    }

    # Load instruction prompt from file
    try:
        prompts_dir = Path(__file__).parent / "prompts"
        instruction_template = (prompts_dir / "research-instruction.txt").read_text()
    except Exception as e:
        # Fallback (though user said "no fallback", crashing is worse if file missing in dev)
        # But user explicitly said "no fallback". I will let it crash or just not handle it.
        # Actually, to respect "no fallback", I should assume the file exists.
        raise RuntimeError(f"Failed to load prompt file: {e}")

    instruction = instruction_template.format(
        topic=topic,
        depth_instruction=depth_instructions.get(depth, depth_instructions["standard"]),
        style_instruction=style_instructions.get(
            style, style_instructions["comprehensive"]
        ),
    )

    completed_tasks.append("Created app configuration")
    await update_progress(project_dir, 10, "Connecting to MCP servers", completed_tasks)

    try:
        async with app.run() as running_app:
            logger = running_app.logger

            logger.info("MCPApp started successfully")
            logger.info(f"Config file: {os.environ.get('MCP_CONFIG_PATH', 'default')}")
            logger.info(f"Project directory: {os.path.abspath(project_dir)}")

            print(
                json.dumps(
                    {
                        "type": "app_started",
                        "project_dir": os.path.abspath(project_dir),
                    }
                )
                + "\n",
                flush=True,
                end="",
            )

            # Create research agent with web-research-assistant AND filesystem servers
            print(
                json.dumps(
                    {
                        "type": "connecting_servers",
                        "servers": ["web-research-assistant", "filesystem"],
                    }
                )
                + "\n",
                flush=True,
                end="",
            )

            # Load system prompt from template file
            system_prompt_file = Path(__file__).parent / "system-prompt.template.txt"
            if not system_prompt_file.exists():
                raise FileNotFoundError(
                    f"System prompt template not found: {system_prompt_file}"
                )

            system_prompt = system_prompt_file.read_text()

            researcher = Agent(
                name="researcher",
                instruction=system_prompt,
                server_names=["web-research-assistant", "filesystem"],
            )

            completed_tasks.append("Connected to MCP servers")
            await update_progress(
                project_dir, 20, "Initializing research agent", completed_tasks
            )

            async with researcher:
                # List available tools
                tools_result = await researcher.list_tools()
                tool_count = (
                    len(tools_result.tools) if hasattr(tools_result, "tools") else 0
                )

                # Get tool names for debugging
                tool_names = []
                if hasattr(tools_result, "tools"):
                    tool_names = [tool.name for tool in tools_result.tools]

                logger.info(f"Available tools: {tool_count} tools")
                logger.info(f"Tool names: {tool_names}")

                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "message": f"Loaded {tool_count} tools",
                            "percentage": 30,
                        }
                    ),
                    flush=True,
                )

                print(
                    json.dumps(
                        {
                            "type": "tools_loaded",
                            "count": tool_count,
                            "tools": tool_names,
                        }
                    ),
                    flush=True,
                )

                completed_tasks.append("Loaded research tools")
                await update_progress(project_dir, 30, "Attaching LLM", completed_tasks)

                # Attach LLM based on provider (model is set in config)
                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "message": f"Connecting to {provider} ({model})",
                            "percentage": 35,
                        }
                    ),
                    flush=True,
                )

                if provider == "anthropic":
                    llm = await researcher.attach_llm(AnthropicAugmentedLLM)
                elif provider == "openai":
                    llm = await researcher.attach_llm(OpenAIAugmentedLLM)
                else:
                    raise ValueError(f"Unsupported provider: {provider}")

                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "message": f"Connected to {provider}",
                            "percentage": 40,
                        }
                    ),
                    flush=True,
                )

                completed_tasks.append("Connected to LLM")
                await update_progress(
                    project_dir, 40, "Starting research", completed_tasks
                )

                # Check if this is a resume operation
                if resume:
                    print(
                        json.dumps(
                            {
                                "type": "resume_mode",
                                "message": "Resuming research session",
                            }
                        ),
                        flush=True,
                    )

                    # Load conversation history
                    history = await load_conversation_history(project_dir)
                    if history:
                        print(
                            json.dumps(
                                {
                                    "type": "history_loaded",
                                    "message": "Loaded previous conversation history",
                                }
                            ),
                            flush=True,
                        )

                    # Set request params for continued conversation
                    from mcp_agent.workflows.llm.augmented_llm import RequestParams

                    request_params = RequestParams(
                        max_iterations=999999,  # Practically unlimited - agent decides when done
                        temperature=0.7,
                        maxTokens=100000,  # High limit (within OpenAI's 128k max) - agent writes as much as needed
                    )

                    # Skip directly to message loop
                    await update_progress(
                        project_dir,
                        100,
                        "Resumed - Ready for messages",
                        completed_tasks,
                    )

                    # Removed research_fully_completed message to prevent setting status to 'completed'
                    # This keeps the research in 'in_progress' state while waiting for messages

                    print(
                        json.dumps(
                            {
                                "type": "waiting_for_messages",
                                "message": "Research resumed. Waiting for messages...",
                            }
                        ),
                        flush=True,
                    )

                    await message_loop(llm, project_dir, request_params)
                    return {"success": True, "status": "resumed"}

                print(
                    json.dumps({"type": "research_started", "cwd": project_dir}),
                    flush=True,
                )

                # Execute research in the project directory
                import os

                original_dir = os.getcwd()
                os.chdir(project_dir)

                try:
                    # Run research using tool-calling loop
                    print(
                        json.dumps({"type": "llm_starting", "topic": topic}), flush=True
                    )

                    # Use generate() which handles tool calling properly
                    print(
                        json.dumps(
                            {
                                "type": "progress",
                                "message": "LLM is researching...",
                                "percentage": 50,
                            }
                        ),
                        flush=True,
                    )

                    # Use generate_str() with RequestParams to allow multiple tool-calling turns
                    from mcp_agent.workflows.llm.augmented_llm import RequestParams

                    # Effectively unlimited - agent decides when research is complete based on prompt
                    request_params = RequestParams(
                        max_iterations=999999,  # Practically unlimited - agent decides when done
                        temperature=0.7,
                        maxTokens=100000,  # High limit (within OpenAI's 128k max) - agent writes as much as needed
                    )

                    # Load user prompt template (REQUIRED)
                    user_prompt_file = (
                        Path(__file__).parent / "user-prompt.template.txt"
                    )
                    if not user_prompt_file.exists():
                        raise FileNotFoundError(
                            f"Required user prompt template not found: {user_prompt_file}"
                        )

                    user_prompt_template = user_prompt_file.read_text()
                    prompt_message = user_prompt_template.replace("{topic}", topic)

                    result = await llm.generate_str(
                        message=prompt_message,
                        request_params=request_params,
                    )

                    completed_tasks.append("Completed web research")
                    await update_progress(
                        project_dir,
                        80,
                        "Creating markdown documentation",
                        completed_tasks,
                    )

                    print(
                        json.dumps(
                            {
                                "type": "llm_completed",
                                "status": "success",
                            }
                        ),
                        flush=True,
                    )

                    completed_tasks.append("Completed research")
                    await update_progress(
                        project_dir, 90, "Finalizing", completed_tasks
                    )

                    print(
                        json.dumps(
                            {
                                "type": "research_completed",
                                "status": "success",
                            }
                        ),
                        flush=True,
                    )

                finally:
                    os.chdir(original_dir)

                completed_tasks.append("Generated all files")
                await update_progress(project_dir, 100, "Complete", completed_tasks)

                # Emit the final research result as an assistant response so it appears in chat
                print(
                    json.dumps(
                        {
                            "type": "assistant_response",
                            "message_id": None,  # Initial research has no parent message ID
                            "response": result,
                        }
                    )
                    + "\n",
                    flush=True,
                    end="",
                )

                # Signal that initial research is complete
                print(
                    json.dumps(
                        {
                            "type": "research_fully_completed",
                            "status": "success",
                        }
                    )
                    + "\n",
                    flush=True,
                    end="",
                )

                # Enter message loop to handle follow-up questions
                print(
                    json.dumps(
                        {
                            "type": "waiting_for_messages",
                            "message": "Research complete. Waiting for follow-up questions...",
                        }
                    )
                    + "\n",
                    flush=True,
                    end="",
                )

                await message_loop(llm, project_dir, request_params)

                return {"success": True, "status": "completed"}

    except Exception as e:
        print(
            json.dumps(
                {
                    "type": "error",
                    "error": str(e),
                    "error_type": type(e).__name__,
                }
            )
            + "\n",
            flush=True,
            end="",
        )

        await update_progress(project_dir, 100, "Failed", completed_tasks)

        return {"success": False, "error": str(e)}

    finally:
        # Clean up temporary config file
        if "temp_config_path" in locals():
            try:
                os.unlink(temp_config_path)
            except:
                pass


def main():
    """Main entry point"""
    if len(sys.argv) < 3:
        print(
            json.dumps(
                {
                    "type": "error",
                    "error": "Usage: research-agent.py <topic> <project_dir> [provider] [model] [--resume]",
                }
            ),
            flush=True,
        )
        sys.exit(1)

    topic = sys.argv[1]
    project_dir = sys.argv[2]
    provider = sys.argv[3] if len(sys.argv) > 3 else "anthropic"
    model = sys.argv[4] if len(sys.argv) > 4 else "claude-sonnet-4-5"

    # Check for --resume flag
    resume = "--resume" in sys.argv

    # CRITICAL: Convert project_dir to absolute path BEFORE any operations
    # This ensures relative paths work correctly regardless of where script is run
    import os

    project_dir = os.path.abspath(project_dir)

    # Create the project directory if it doesn't exist
    os.makedirs(project_dir, exist_ok=True)

    # Run async research
    result = asyncio.run(
        run_research(
            topic=topic,
            project_dir=project_dir,
            provider=provider,
            model=model,
            resume=resume,
        )
    )

    if result["success"]:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
