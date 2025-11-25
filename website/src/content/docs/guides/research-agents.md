---
title: Research Agents
description: How AI research agents work in Research Portal.
---

This guide explains how Research Portal's AI research agents work and how to customize them.

## Overview

Research agents are AI-powered processes that:

1. Accept a research topic from the user
2. Search the web for relevant information
3. Analyze and synthesize findings
4. Generate organized research documents
5. Track progress in real-time

## Agent Architecture

```
User Request
    │
    ▼
┌─────────────────────────────────────┐
│     Research Manager (Node.js)       │
│                                      │
│  - Create project directory          │
│  - Initialize database record        │
│  - Spawn Python process              │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     mcp-agent (Python)               │
│                                      │
│  - Load MCP servers                  │
│  - Execute research prompt           │
│  - Make LLM decisions                │
└─────────────────┬────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ web-research  │   │  filesystem   │
│   -assistant  │   │    server     │
│               │   │               │
│ - Web search  │   │ - Write files │
│ - API docs    │   │ - Metadata    │
│ - Package info│   │ - Progress    │
└───────────────┘   └───────────────┘
```

## Research Workflow

### 1. User Initiates Research

The user submits a research request via the wizard:

```typescript
{
  topic: "Best indoor grills for apartments",
  depth: "standard",    // quick | standard | deep
  focus: "smoke reduction",
  style: "practical",   // comprehensive | comparing | practical
  provider: "anthropic"
}
```

### 2. Project Setup

The Research Manager:

1. Generates a unique project ID
2. Creates the project directory
3. Inserts a database record
4. Spawns the Python agent process

### 3. Agent Execution

The mcp-agent:

1. Reads the research prompt template
2. Loads MCP servers (web-research, filesystem)
3. Sends the prompt to the configured LLM
4. Executes tool calls as directed by the LLM

### 4. Tool Calls

The agent makes tool calls to:

- **Search the web** for information
- **Read API documentation**
- **Find code examples**
- **Write research files**
- **Update progress**

### 5. File Generation

The agent writes:

| File | Purpose |
|------|---------|
| `metadata.json` | Project metadata for portal display |
| `README.md` | Executive summary and overview |
| `*.html` | Detailed research findings |
| `.research-progress.json` | Progress tracking |

### 6. Completion

When finished, the agent:

- Sets progress to 100%
- Marks research as "completed"
- Terminates the subprocess

## Research Prompts

### Main Prompt Template

Located at `scripts/prompts/research-instruction.txt`:

```text
You are a research assistant conducting research on: {topic}

Research parameters:
- Depth: {depth}
- Focus: {focus}
- Style: {style}

Your task:
1. First, call write_research_metadata() to set the project title
2. Search for relevant information using web_search
3. Analyze and synthesize your findings
4. Write comprehensive research documents
5. Update progress throughout using update_research_progress()
...
```

### Customizing Prompts

Edit the prompt templates in `scripts/prompts/`:

- `research-instruction.txt` - Main research instructions
- `continuation-instruction.txt` - For continuing research

Key variables:
- `{topic}` - Research topic
- `{depth}` - Research depth level
- `{focus}` - Research focus area
- `{style}` - Output style

## Progress Tracking

Agents report progress via `.research-progress.json`:

```json
{
  "percentage": 65,
  "currentTask": "Analyzing findings",
  "currentTaskDescription": "Comparing product features across 12 models",
  "completedTasks": [
    "Web search completed",
    "Sources gathered",
    "Initial analysis done"
  ],
  "startedAt": "2024-01-01T10:00:00Z",
  "estimatedCompletion": "2024-01-01T10:30:00Z",
  "updatedAt": "2024-01-01T10:15:00Z"
}
```

The portal polls this file to display real-time progress.

## MCP Servers

### web-research-assistant

Provides web research tools:

```python
@tool
def web_search(query: str) -> list:
    """Search the web using SearXNG"""
    
@tool
def search_examples(query: str, type: str) -> list:
    """Find code examples and tutorials"""
    
@tool
def api_docs(api: str, topic: str) -> str:
    """Fetch API documentation"""
    
@tool
def package_info(name: str, registry: str) -> dict:
    """Get package information"""
```

### filesystem

Provides file operations:

```python
@tool
def write_research_metadata(title: str, description: str, 
                           category: str, tags: list) -> str:
    """Write project metadata.json"""
    
@tool
def update_research_progress(percentage: int, 
                            current_task: str,
                            task_description: str) -> str:
    """Update progress tracking"""
    
@tool
def write_file(path: str, content: str) -> str:
    """Write a file to the project directory"""
    
@tool
def read_file(path: str) -> str:
    """Read a file from the project directory"""
```

## Customization

### Custom MCP Servers

Add your own MCP servers in `mcp_agent.config.yaml`:

```yaml
mcp:
  servers:
    my-custom-server:
      command: "python"
      args: ["path/to/my-server.py"]
```

### Custom Research Styles

Modify the prompt templates to add new research styles:

```text
{% if style == "academic" %}
Focus on peer-reviewed sources and citations.
Use formal academic language.
Include methodology discussion.
{% endif %}
```

### Custom Output Formats

Edit `mcp-servers/filesystem-server.py` to add custom output tools:

```python
@mcp.tool()
def write_comparison_table(products: list, criteria: list) -> str:
    """Generate a comparison table in HTML format"""
    # Custom implementation
```

## Debugging

### View Agent Logs

```bash
# In development
npm run dev
# Watch console for [ResearchManager] and [Agent] logs

# In Docker
docker compose logs -f portal
```

### Test Agent Directly

```bash
python scripts/research-agent.py \
  --topic "Test research topic" \
  --output ./research/test-project \
  --depth quick \
  --provider anthropic
```

### Check Database

```bash
sqlite3 ./research/research-wizard.db

# List research sessions
SELECT id, topic, status FROM researches;

# List agent activities
SELECT action, description FROM activities 
WHERE agentId = 'agent-id'
ORDER BY timestamp DESC;
```

## Best Practices

1. **Clear Topics**: Specific topics produce better results
2. **Appropriate Depth**: Use "quick" for overviews, "deep" for comprehensive research
3. **Focus Areas**: Narrow focus improves relevance
4. **Monitor Progress**: Watch for stalled agents (stuck at same percentage)
5. **Review Results**: AI-generated content should be reviewed
