#!/usr/bin/env python3
"""
Simulation Agent
Simulates the output of the research agent for UI testing purposes.
Run this instead of research-agent.py to test the frontend without LLM costs.
"""

import json
import time
import sys
import os
from datetime import datetime


def print_json(data):
    print(json.dumps(data), flush=True)


def simulate():
    topic = sys.argv[1] if len(sys.argv) > 1 else "Simulation Test"
    project_dir = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.path.abspath("./research-projects/simulation-test")
    )

    # 1. Init
    print_json(
        {
            "type": "init",
            "project_dir": project_dir,
            "topic": topic,
            "provider": "simulator",
            "model": "test-model",
        }
    )
    time.sleep(1)

    # 2. App Started
    print_json({"type": "app_started", "project_dir": project_dir})
    time.sleep(0.5)

    # 3. Tools Loaded
    print_json(
        {
            "type": "tools_loaded",
            "count": 15,
            "tools": ["web_search", "write_file", "read_file", "crawl_url"],
        }
    )
    time.sleep(0.5)

    # 4. Research Started
    print_json({"type": "research_started", "cwd": project_dir})
    time.sleep(1)

    # 5. LLM Starting
    print_json({"type": "llm_starting", "topic": topic})
    time.sleep(1)

    # 6. First Thought (Planning)
    print_json(
        {
            "type": "thought",
            "content": f"I need to research '{topic}'. I will start by searching the web for the latest information.",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(2)

    # 7. Tool Call (Web Search)
    print_json(
        {
            "type": "tool_call",
            "tool": "web_search",
            "args": json.dumps({"query": f"{topic} latest news 2025", "limit": 3}),
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(2)

    # 8. Tool Result (Web Search)
    print_json(
        {
            "type": "tool_result",
            "output": "1. News Article A: The topic is trending.\n2. News Article B: Experts say it's important.\n3. News Article C: New developments released yesterday.",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(2)

    # 9. Second Thought (Writing)
    print_json(
        {
            "type": "thought",
            "content": "The search results are promising. I will now create the landing page to summarize these findings.",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(2)

    # 10. Tool Call (Write File)
    print_json(
        {
            "type": "tool_call",
            "tool": "write",
            "args": json.dumps(
                {
                    "path": "index.html",
                    "content": "<html><body><h1>Research Summary</h1><p>Findings...</p></body></html>",
                }
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(2)

    # 11. Tool Result (Write File)
    print_json(
        {
            "type": "tool_result",
            "output": "Successfully wrote to index.html",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    time.sleep(1)

    # 12. Completion
    print_json({"type": "llm_completed", "status": "success"})
    print_json({"type": "research_completed", "status": "success"})


if __name__ == "__main__":
    simulate()
