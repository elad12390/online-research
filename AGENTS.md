# Research Agent Configuration

## Overview

This file documents how research agents interact with the Research Portal.

**CRITICAL TECHNOLOGY**: This project uses **`mcp-agent`**, NOT Claude Code (cc). The research agent is a Python script that uses the mcp-agent library to orchestrate LLM calls and MCP tool usage.

**IMPORTANT**: The actual research prompt that agents use is in:
- **`scripts/research-prompt.txt`** - User message template with instructions

## Architecture & Data Storage

### Two Separate Systems

The application uses TWO distinct systems that serve different purposes:

#### 1. Research Wizard (Live Research Sessions)
**Location**: `/Users/eladbenhaim/research/`
**Database**: `/Users/eladbenhaim/research/research-wizard.db`
**Purpose**: Active research sessions with real-time chat interface

- Live research chat at `/research/[id]` routes
- Real-time agent activity streaming
- SQLite database with tables: `researches`, `agents`, `activities`
- Research directories created here during active sessions
- Managed by `lib/research-wizard/research-manager.ts`

#### 2. Research Portal (Historical Projects)
**Location**: `/Users/eladbenhaim/dev/online-research/research-projects/`
**Purpose**: Browse completed research projects as files

- Main portal at `/` route showing project cards
- File-based system scanning directories for `.html` and `.md` files
- No database - reads from filesystem directly
- Managed by `lib/server/file-scanner.ts`

### Key Distinction

- **Research Wizard** = Database-driven, live sessions, chat interface
- **Research Portal** = File-based, static browsing, completed projects

**DO NOT create duplicate databases in the project directory!** There is only ONE active research database at `~/research/research-wizard.db`.

## Key Tools Available

### 1. write_research_metadata()

**MUST BE CALLED FIRST when starting any research project.**

Creates `metadata.json` with project information that appears in the portal sidebar.

**Example:**
```python
write_research_metadata(
    title="Best Indoor Grills for Apartments 2024",
    description="Comprehensive research on low-odor indoor grills",
    category="Product Research",
    tags=["kitchen appliances", "apartment living", "product comparison"],
    summary="Reviewed 15+ models focusing on smoke reduction"
)
```

**Parameters:**
- `title` (REQUIRED): Human-readable title shown in portal
- `description`: Brief description of research
- `category`: Research category
- `tags`: List of tags for categorization
- `summary`: Executive summary

### 2. update_research_progress()

Reports progress as the agent works. Creates `.research-progress.json` file.

**Example:**
```python
update_research_progress(
    percentage=50,
    current_task="Analyzing products",
    task_description="Comparing features across 15 models"
)
```

## File Structure Requirements

Each research project must follow this structure:

```
project-directory/
├── metadata.json          (created by write_research_metadata tool)
├── README.md              (required - project overview)
├── index.html             (or other .html files with findings)
└── .research-progress.json (created by update_research_progress tool)
```

## HTML Styling for Dark Portal

⚠️ **CRITICAL**: The portal has automatic dark theme styling. **DO NOT ADD ANY CUSTOM <style> TAGS!**

HTML files should be **clean semantic HTML with NO styling**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Research Title</title>
</head>
<body>
  <h1>Research Title</h1>
  <p>Your content here...</p>
  <table>
    <thead>
      <tr><th>Header 1</th><th>Header 2</th></tr>
    </thead>
    <tbody>
      <tr><td>Data 1</td><td>Data 2</td></tr>
    </tbody>
  </table>
</body>
</html>
```

**The portal automatically provides:**
- Dark background (#191919)
- Light text (#ececec)
- Blue links (#0ea5e9)
- Dark table styling
- Proper spacing and fonts

**❌ DO NOT DO THIS:**
- Add `<style>` tags with colors
- Set `background: white` or `background: #ffffff`
- Set `color: #111` or other dark text colors
- Create styled `.container` divs
- Override fonts, padding, or layout
- Use CSS variables like `--card-bg`

If agents add custom styles, they conflict with the portal's dark theme!

## Metadata Priority

The portal reads project titles in this order:
1. `metadata.json` → `title` field (HIGHEST PRIORITY)
2. `README.md` → YAML frontmatter `title:` field
3. `README.md` → First `# Heading`
4. Folder name (fallback)

## MCP Server Configuration

Research agents use the `filesystem` MCP server defined in `mcp_agent.config.yaml`:

```yaml
mcp:
  servers:
    filesystem:
      command: "uv"
      args: ["run", "python", "mcp-servers/filesystem-server.py"]
```

This provides:
- `write_research_metadata()` - Write project metadata
- `update_research_progress()` - Track progress
- `read_file()` - Read files
- `write_file()` - Write files
- `list_directory()` - List directory contents
- `create_directory()` - Create directories

## Workflow

1. Agent receives research topic
2. Creates project directory with unique ID
3. **Calls `write_research_metadata()` FIRST** with title and metadata
4. Calls `update_research_progress(0, "Starting", "...")`
5. Conducts research using web tools
6. Updates progress periodically
7. Writes README.md and .html files
8. Calls `update_research_progress(100, "Complete", "...")`

## Portal Features

Projects appear in the portal with:
- **Draggable ordering** - Users can reorder projects by dragging
- **Custom titles** - From metadata.json, not folder names
- **Live progress** - Real-time progress panel while researching
- **Auto-discovery** - New projects appear automatically at the top
- **Persistent order** - Saved to localStorage

---

**For implementation details, see:**
- `scripts/research-agent.py` - Main research agent
- `scripts/research-prompt.txt` - Prompt template
- `mcp-servers/filesystem-server.py` - MCP tools
