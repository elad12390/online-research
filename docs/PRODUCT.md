# Research Portal - Product Documentation

> A comprehensive guide to the Research Portal application for Product Managers and Designers

---

## 📋 Table of Contents

1. [What is the Research Portal?](#what-is-the-research-portal)
2. [Core Value Proposition](#core-value-proposition)
3. [Main User Workflows](#main-user-workflows)
4. [Key Features from a User Perspective](#key-features-from-a-user-perspective)
5. [UI/UX Organization](#uiux-organization)
6. [Research Portal Features](#research-portal-features)
7. [Research Wizard Features](#research-wizard-features)
8. [Data & Architecture](#data--architecture)
9. [User Journeys](#user-journeys)

---

## What is the Research Portal?

The **Research Portal** is a modern web application that enables users to:

1. **Browse & Explore** AI-generated research projects in a beautiful, organized interface
2. **Create & Run** new research automatically using AI agents (Claude, GPT, or Gemini)
3. **Track Progress** in real-time as research is being conducted
4. **Collaborate** on research findings through a live chat interface
5. **Organize** research projects with metadata, tags, and custom organization

The application bridges the gap between research generation (via AI agents) and research consumption (via the portal interface). It transforms raw research output into a polished, browsable collection that teams can explore and iterate on.

---

## Core Value Proposition

### For Individual Researchers
- **Automated Research**: Start research projects with a simple form, let AI do the heavy lifting
- **Fast Iteration**: Modify research direction mid-project through live conversation with the AI agent
- **Beautiful Output**: Research findings are automatically formatted and styled professionally
- **Organized Archive**: All past research is easily discoverable and browsable

### For Teams
- **Shared Knowledge**: All team members can browse completed research projects
- **Real-time Collaboration**: Watch research progress in real-time as agents work
- **Conversation History**: Full chat history shows reasoning and thought processes
- **Reusable Findings**: Projects can be referenced and built upon

### For Knowledge Management
- **Persistent Storage**: All research is saved in organized file structure
- **Metadata Tagging**: Projects have titles, descriptions, categories, and tags
- **Live Updates**: Portal automatically detects new projects and changes
- **Professional Presentation**: Beautiful markdown rendering with dark mode support

---

## Main User Workflows

### Workflow 1: Browse Existing Research

**Entry Point**: User navigates to homepage (`/`)

**Steps**:
1. User sees welcome screen with call-to-action buttons
2. User clicks on a project in the left sidebar
3. README.md loads automatically in the main content area
4. User can click file tabs to switch between different documents
5. User can search for projects using ⌘K command palette
6. User can mark favorites and track recently viewed items

**User Goals**:
- Find relevant research quickly
- Compare different research findings
- Share research with team members
- Reference previous research in new projects

---

### Workflow 2: Start New Research (Research Wizard)

**Entry Point**: User clicks "Start New Research" button (`/wizard`)

**Steps**:
1. User fills out the Research Wizard form with:
   - **Topic**: What to research (required)
   - **Depth**: How thorough (quick / standard / deep)
   - **Focus**: Specific aspect to emphasize (optional)
   - **Style**: Output format (comprehensive / comparing / practical)

2. Form validates input and creates a new research record
3. AI agent automatically starts researching in background
4. User is redirected to research detail page (`/research/[id]`)
5. User can watch live progress and agent activity

**User Goals**:
- Start a focused research project quickly
- Specify research direction and depth
- Get automated research without manual effort
- Begin getting results within minutes

---

### Workflow 3: Monitor Active Research

**Entry Point**: User navigates to `/research/[id]` after starting research

**Key Features**:
1. **Progress Bar**: Shows percentage complete and current task
2. **Live Chat Interface**: Messages from the research assistant
3. **Activity Timeline**: Shows all agent actions (searches, file writes, etc.)
4. **Stop Controls**: Option to halt research at any time
5. **Resume Capability**: Can send messages to continue research after completion

**What User Sees**:
- Initial research topic message from user
- Agent's thoughts (💭) - internal reasoning
- Tool calls (🔧) - searches, API calls, etc.
- Tool results (✓) - data returned from tools
- Assistant responses (💬) - summaries and analysis
- Completion message when done

**User Goals**:
- Monitor research progress in real-time
- Understand agent's reasoning and methodology
- Guide research direction through conversation
- Verify quality and accuracy as work progresses

---

### Workflow 4: View Completed Research in Portal

**Entry Point**: User navigates back to homepage after research completes

**Steps**:
1. New research project appears at top of sidebar automatically
2. Project shows with metadata (title, description, tags)
3. Progress indicator shows 100% complete
4. User can click to view generated research files
5. Files are formatted beautifully with markdown rendering
6. User can add to favorites for quick access

**User Goals**:
- Access completed research immediately
- Review research findings with team
- Archive and organize research by topic
- Reference findings in future work

---

## Key Features from a User Perspective

### 🔍 Project Discovery

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Sidebar Navigation** | Left sidebar shows all projects in list | Quick visual scanning of all research |
| **Search (⌘K)** | Command palette for searching by name, tags, category | Find specific research instantly |
| **Favorites** | Star icon to mark projects as favorites | Quick access to frequently used research |
| **Recent Items** | Automatically tracks recently viewed projects | Resume work without scrolling |
| **Metadata Display** | Shows project title, description, tags, creation date | Understand project context at a glance |

### 📄 Document Viewing

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Tab System** | View multiple files as tabs in one project | Compare related documents side-by-side |
| **Markdown Rendering** | Beautiful formatting of headers, lists, tables, code | Professional presentation of findings |
| **Dark Mode** | Dark background with light text (Notion-style) | Easy on eyes, modern aesthetic |
| **Responsive Design** | Works on mobile, tablet, desktop | Access research from any device |
| **Scrollable Content** | Long documents with smooth scrolling | Read detailed research comfortably |

### 🚀 Research Creation

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Simple Form** | Topic, depth, focus, style inputs | Non-technical users can start research |
| **Depth Levels** | Quick / Standard / Deep | Control research thoroughness vs. time |
| **Output Styles** | Comprehensive / Comparing / Practical | Tailor research format to needs |
| **Instant Start** | Research begins immediately upon submission | Quick feedback and visible progress |

### ⏱️ Real-time Progress

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Live Progress Bar** | Visual indication of completion percentage | See how far research has progressed |
| **Current Task Display** | Shows what agent is working on now | Understand agent's current focus |
| **Activity Stream** | Timeline of all actions (with icons and colors) | Transparency into agent's work |
| **Estimated Completion** | Time prediction for research finish | Plan next steps |

### 💬 Live Chat Interface

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Message History** | Full conversation with the research agent | Reference previous analysis |
| **Color-coded Messages** | Different colors for user/agent/thoughts/tools | Quickly parse message types |
| **Send Messages** | Continue conversation after research completes | Refine or expand findings |
| **Stop Research** | Halt progress if results satisfactory | Save time on unnecessary research |

### 📊 Progress Tracking Panel

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Floating Panel** | Bottom-right corner, always accessible | Monitor progress without changing view |
| **Completed Tasks List** | Shows all finished tasks with checkmarks | Verify all research steps complete |
| **Auto-close** | Panel closes when research reaches 100% | Clean interface when work is done |

---

## UI/UX Organization

### Application Structure

```
Research Portal (/)
├── Left Sidebar (Projects)
│   ├── Home button
│   ├── Research Wizard link
│   ├── Search box
│   ├── Favorites section
│   ├── Recent projects section
│   └── Projects tree
│       ├── Expandable project
│       │   └── Files list
│       └── Project metadata
├── Main Content Area
│   ├── Welcome screen (when nothing selected)
│   └── Document view (when project selected)
│       ├── Document header (title, metadata)
│       ├── File tabs (switch between files)
│       ├── Document content (markdown)
│       └── Scroll area
└── Right Sidebar (Research Activity)
    ├── Active Agents tab
    │   └── List of running research sessions
    ├── History tab
    │   └── Stats and recent activities
```

### Key UI Patterns

#### 1. **Three-Panel Layout**

```
┌─────────────────────────────────────────────────────┐
│         Left Sidebar    │  Main Content  │  Right    │
│                         │                │  Panel    │
│  Projects List          │  Welcome or    │  Research │
│  - Favorites            │  Document      │  Activity │
│  - Recent               │  - Tabs        │  - Agents │
│  - All Projects         │  - Content     │  - History│
│  - Search               │  - Scrollable  │           │
├─────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────┘
```

#### 2. **Resizable Panels**

- Left sidebar: 15-35% width, default 20%
- Main content: 30-100% width, default 60%
- Right panel: 15-35% width, default 20%
- Users can drag dividers to adjust proportions
- Layout persists across sessions via `autoSaveId`

#### 3. **Color System** (Notion-inspired)

| Color | Usage | Hex |
|-------|-------|-----|
| Primary Background | Main surfaces | #191919 |
| Secondary Background | Sidebar, panels | #252525 |
| Text Primary | Main text, headings | #ececec |
| Text Secondary | Secondary text | #999999 |
| Accent | Buttons, highlights | #0084ff |
| Border | Dividers, separators | #373737 |

#### 4. **Icon & Visual Language**

Emojis used throughout for quick visual scanning:
- 🔬 Research/Science context
- 📚 Projects/Documents
- 🔍 Search/Find
- ⭐ Favorites
- 🕐 Recent items
- ⏳ In progress
- ✅ Completed
- ❌ Failed
- 💭 Thoughts/Reasoning
- 🔧 Tools/Actions

---

## Research Portal Features

### Feature 1: Auto-discovery of Projects

**What it does**: Automatically detects new research projects without manual configuration

**How it works**:
- Scans filesystem every 5 seconds
- Looks for directories with `README.md` files
- Reads project metadata from `metadata.json` (if present)
- Detects all markdown and HTML files
- Updates UI automatically when projects change

**User Experience**:
- No setup required after project creation
- Projects appear in sidebar automatically
- File changes are reflected in real-time
- No page refresh needed

**Technical Notes**:
- Watches `/research-projects/` directory (configurable)
- Reads metadata, progress, and file structure
- Builds project tree with file counts and last-updated dates

---

### Feature 2: Metadata System

**What it does**: Enriches projects with searchable metadata

**Metadata Fields**:
```json
{
  "title": "Best Indoor Grills for Apartments",
  "description": "Comprehensive research on low-odor indoor grills",
  "category": "Product Research",
  "tags": ["kitchen", "apartment living", "comparison"],
  "summary": "Reviewed 15+ models focusing on smoke reduction"
}
```

**User Impact**:
- Titles appear in sidebar and cards
- Descriptions help understand project scope
- Tags enable searching and filtering
- Categories organize research by type

---

### Feature 3: Progress Tracking

**What it does**: Shows real-time progress of research projects

**Progress Data Shown**:
- Percentage complete (0-100%)
- Current task being worked on
- Task description/details
- Estimated completion time
- List of completed tasks

**Display Locations**:
1. **Progress Panel** (floating bottom-right): Detailed progress view
2. **Sidebar Metadata**: Quick percentage indicator
3. **Research Wizard Page**: Shows progress while creating

---

### Feature 4: File Organization

**What it does**: Organizes research into multiple files with automatic sorting

**File Naming Convention**:
```
README.md           # Overview (shown first, required)
01-comprehensive.md # Detailed guide
02-comparison.md    # Comparison tables
03-practical.md     # Actionable tips
```

**User Benefits**:
- Logical file ordering (01-, 02-, 03- sorting)
- Quick switching between sections via tabs
- README always loads first
- Users choose which files to view

---

### Feature 5: Smart Search (⌘K)

**What it does**: Quick search across all projects and files

**Search Capability**:
- Search by project name
- Search by tags
- Search by category
- Search by description

**User Experience**:
- Press ⌘K (or Ctrl+K) anywhere
- Type to filter projects in real-time
- Click result to jump to that project
- Shows recent and favorite items quickly

---

### Feature 6: Favorites & Recent

**What it does**: Personalizes project access

**Favorites Feature**:
- Click star icon to add/remove favorites
- Favorites appear in dedicated section
- Persist across sessions
- Quick access to frequently used research

**Recent Feature**:
- Automatically tracks viewed projects
- Shows 5 most recent items
- Helps resume work quickly
- Ordered by last viewed time

---

## Research Wizard Features

### Feature 1: Guided Research Form

**Form Fields**:

| Field | Type | Options | Purpose |
|-------|------|---------|---------|
| **Topic** | Text input | User entered | What to research |
| **Depth** | Select dropdown | Quick / Standard / Deep | Research thoroughness |
| **Focus** | Text input | User entered | Specific angle (optional) |
| **Style** | Select dropdown | Comprehensive / Comparing / Practical | Output format |

**Example Usage**:
```
Topic: "Best coffee grinders for espresso"
Depth: "Standard"
Focus: "Under $200, consistent grind size"
Style: "Comparing"
```

---

### Feature 2: Real-time Agent Activity Display

**Activity Types Shown**:

1. **Thoughts** (💭 Yellow)
   - Internal reasoning of the agent
   - Shows decision-making process
   - Displayed in monospace font for clarity

2. **Tool Calls** (🔧 Purple)
   - Actions like web searches, API calls
   - Shows tool name and arguments
   - Expandable to see full parameters

3. **Tool Results** (✓ Green)
   - Data returned from tools
   - Often collapsed with "View output" toggle
   - Shows raw data or formatted results

4. **Assistant Responses** (A Blue)
   - Analysis and summaries from agent
   - Full text messages in chat bubbles
   - Timestamped for reference

5. **Status Updates** (Various colors)
   - Completion messages
   - Error notifications
   - Progress milestones

---

### Feature 3: Live Progress Tracking

**Progress Components**:

1. **Header Progress Bar**
   - Shows percentage and current task
   - Updates every few seconds
   - Changes color based on progress

2. **Task Description**
   - Details what agent is working on
   - Helps user understand methodology
   - Updated in real-time

3. **Estimated Time**
   - Predicts when research will complete
   - Adjusts as research progresses
   - Helps with planning

---

### Feature 4: Interactive Conversation

**During Research**:
- User can only view progress
- Stop button available to halt research
- Messages disabled (research active)

**After Research Completes**:
- User can send follow-up messages
- Agent can expand on findings
- Research automatically resumes if needed
- Full conversation history preserved

**Message Types Supported**:
- Refinement requests ("Make this more focused on...")
- Clarification questions ("Why did you...")
- Expansion requests ("Can you also research...")
- Format requests ("Can you create a table for...")

---

### Feature 5: Research Configuration Options

**Depth Selection Impact**:
- **Quick** (30-45 min): Basic overview, 5-7 sources
- **Standard** (1-2 hours): Balanced depth, 10-15 sources
- **Deep** (2-4 hours): Comprehensive, 20+ sources

**Style Selection Impact**:
- **Comprehensive**: Full guides, detailed analysis
- **Comparing**: Side-by-side comparisons, tables
- **Practical**: Actionable tips, how-tos, checklists

---

### Feature 6: Automatic File Generation

**Output Files Created**:
- `metadata.json` - Project metadata (title, tags, category)
- `README.md` - Project overview and summary
- `.html` files - Formatted research findings
- `.research-progress.json` - Progress tracking data

**Formatting**:
- HTML files generated with dark-mode styling
- Markdown with proper hierarchy and formatting
- Tables for comparisons
- Code blocks for technical content

---

## Data & Architecture

### Two Systems, One Interface

The application manages **two distinct data stores**:

#### 1. **Research Wizard Database** (Active Research)

**Location**: `~/research/research-wizard.db` (SQLite)

**Contains**:
- Active research sessions
- Agent execution history
- Activity logs
- Progress tracking
- Chat history

**Tables**:
- `researches` - Research projects
- `agents` - AI agents assigned to research
- `activities` - Action logs from agents

**User Interface**: `/research/[id]` pages with live chat

---

#### 2. **Research Portal Filesystem** (Completed Projects)

**Location**: `/research-projects/` directory

**Contains**:
- Completed research project files
- Metadata files (`metadata.json`)
- Research documents (`README.md`, `.html` files)
- Progress files (`.research-progress.json`)

**User Interface**: Homepage (`/`) with sidebar and document viewer

---

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         Research Wizard Page (/wizard)              │
│  - User fills form (topic, depth, focus, style)    │
│  - Submits to /api/research                        │
└──────────────┬──────────────────────────────────────┘
               │ POST with form data
               ▼
┌─────────────────────────────────────────────────────┐
│    Research Manager (Node.js Backend)              │
│  - Creates research record in DB                   │
│  - Spawns Python mcp-agent process                 │
│  - Monitors agent progress                         │
└──────────────┬──────────────────────────────────────┘
               │ Starts agent
               ▼
┌─────────────────────────────────────────────────────┐
│    Python mcp-agent (Claude/OpenAI/Gemini)         │
│  - Conducts research using web tools               │
│  - Calls write_research_metadata()                 │
│  - Calls update_research_progress()                │
│  - Writes files to project directory               │
└──────────────┬──────────────────────────────────────┘
               │ Writes files
               ▼
┌─────────────────────────────────────────────────────┐
│     Research Project Directory                     │
│  - metadata.json                                   │
│  - README.md                                       │
│  - research-findings.html                          │
│  - .research-progress.json                         │
└──────────────┬──────────────────────────────────────┘
               │ Auto-detected by portal
               ▼
┌─────────────────────────────────────────────────────┐
│     Research Portal Homepage (/)                   │
│  - Shows in sidebar                                │
│  - User can view and interact                      │
└─────────────────────────────────────────────────────┘
```

---

## User Journeys

### Journey 1: The First-Time Researcher

**User**: Product manager who has never used the portal

**Timeline**: 5-10 minutes

**Steps**:
1. Navigate to `http://localhost:3000`
2. See welcome screen with options
3. Click "Start New Research" button
4. Fill out form: "AI tools for product management"
5. Select depth: "Standard"
6. Add focus: "Free or low-cost options"
7. Select style: "Comparing"
8. Click "Start Research"
9. Redirected to research page
10. Watch progress bar climb from 0% to 100%
11. See agent searching the web, analyzing results
12. Research completes after ~1.5 hours
13. Click "View Research Files" button
14. Return to homepage and see new project in sidebar
15. Click project to view beautiful formatted research

**Pain Points Addressed**:
- No technical knowledge required
- Visual feedback throughout
- No need to refresh or check manually
- Results appear in organized interface

---

### Journey 2: The Team Lead Researching with Context

**User**: Engineering lead exploring architectural decisions

**Timeline**: 20+ minutes with active involvement

**Steps**:
1. Land on homepage - see list of past researches
2. Browse 3-4 existing research projects for context
3. Notice gap in knowledge - something not yet researched
4. Click "Start New Research"
5. Fill form with specific requirements
6. Set depth to "Deep" for thorough analysis
7. Navigate to research page
8. Watch research progress for 15 minutes
9. Stop research mid-way (got enough info)
10. Send follow-up message: "Can you also compare with open-source options?"
11. Research resumes with user's direction
12. Continue monitoring progress
13. Once complete, message agent: "Create a decision matrix"
14. Agent expands research with comparison tables
15. Return to portal, star the project as favorite
16. Share research link with team
17. Team members browse findings at their own pace

**Key Benefits Used**:
- Ability to guide research in real-time
- Stop capability for efficiency
- Message-based refinement without full restart
- Shareable results

---

### Journey 3: The Knowledge Librarian

**User**: Research coordinator maintaining organizational knowledge

**Timeline**: Ongoing daily task

**Steps**:
1. Open portal each morning as part of routine
2. Check "Recent" section to see latest research
3. Notice new research about "Cloud cost optimization"
4. Review findings quickly
5. Read conclusion and recommendations
6. Click favorites star to add to "Important"
7. Browse by category using sidebar filters
8. Find related research from 3 months ago
9. Compare findings between two projects
10. Create internal doc linking both researches
11. Next day, search for "machine learning" using ⌘K
12. Find 2 relevant research projects
13. Present findings to team

**Key Features Leveraged**:
- Auto-discovery of new projects
- Quick browsing
- Favorites for important items
- Search capability
- Beautiful presentation for sharing

---

### Journey 4: The Deep-Diver (Multiple Research Sessions)

**User**: Researcher conducting comprehensive competitive analysis

**Timeline**: 3-4 hours over 2-3 days

**Day 1**:
1. Start research: "Competitor A analysis"
2. Set to Deep
3. Focus on "pricing and features"
4. Let run for 1 hour, then check progress
5. Satisfied with direction, leave running
6. Research completes after 2.5 hours
7. Review results, send follow-up question
8. Agent clarifies one section
9. Mark as favorite

**Day 2**:
1. Start new research: "Competitor B analysis"
2. Same configuration as previous day
3. Research runs overnight
4. Morning review - results look good
5. Compare both projects side-by-side using tabs

**Day 3**:
1. Start final research: "Market trends synthesis"
2. Focus on "consolidating findings from competitors"
3. Deep dive into trends and implications
4. Research completes
5. Review all three research projects
6. Create executive summary referencing all three

**User Experience Elements**:
- Ability to run multiple researches
- Easy comparison between projects
- Progressive refinement of knowledge
- Professional presentation of findings

---

## Design & UX Principles

### 1. **Notion-Inspired Aesthetic**

- Clean, minimal design
- Dark background with light text
- Generous whitespace
- Subtle hover effects
- Professional color palette

### 2. **Progressive Disclosure**

- Welcome screen guides new users
- Sidebar shows projects without overwhelming
- Expand projects to see files
- Tabs show multiple files one at a time
- Right panel for secondary information

### 3. **Real-time Feedback**

- Progress bar updates live
- Activity stream shows work in progress
- Auto-detecting new projects
- File changes appear immediately
- No waiting for refresh

### 4. **Clear Visual Hierarchy**

- Large project titles
- Secondary file names in tabs
- Tertiary metadata in sidebar
- Primary content in main area
- Quick status indicators with icons

### 5. **Accessibility Considerations**

- High contrast text (light on dark)
- Keyboard shortcuts (⌘K for search)
- Tab navigation between elements
- Semantic HTML structure
- ARIA labels where needed

---

## Common User Tasks

### Task 1: "Find research about AI tools"
1. Press ⌘K
2. Type "AI tools"
3. Select matching project
4. Read findings

**Estimated Time**: 10 seconds

---

### Task 2: "Start research about sustainable packaging"
1. Click "Start New Research"
2. Fill form
3. Submit
4. Watch progress
5. Review when complete

**Estimated Time**: 2-5 hours (mostly automated)

---

### Task 3: "Compare two research projects"
1. Click first project
2. Click first file in tabs
3. Click second project in sidebar
4. Click second file in tabs
5. Look at second project
6. Reference back to first

**Estimated Time**: 5-10 minutes

---

### Task 4: "Share research with team"
1. Complete research
2. Copy browser URL
3. Send to team
4. Team members visit link
5. Team can browse findings

**Estimated Time**: 1 minute

---

### Task 5: "Modify research direction mid-way"
1. Navigate to research page
2. Wait for completion or decide to guide it
3. Send message with new direction
4. Agent continues with guidance
5. Review updated results

**Estimated Time**: Variable (depends on new task)

---

## Success Metrics (Product KPIs)

### Usage Metrics
- Number of research projects created per week
- Average research completion rate
- User engagement (projects viewed, files read)
- Repeat users (researchers using portal multiple times)

### Quality Metrics
- User satisfaction with research findings
- Accuracy of agent research (via user feedback)
- Task completion rate (research started → completed)
- User feedback on UI/UX

### Performance Metrics
- Research creation to completion time
- Page load time
- Search response time
- Uptime/availability

### Business Metrics
- Cost per research (compute, API calls)
- Time saved vs. manual research
- ROI of AI agent vs. human researcher
- Team adoption rate

---

## Future Enhancement Opportunities

### UI/UX Enhancements
1. **Advanced Search**: Filter by date range, tags, category
2. **Research Templates**: Pre-configured research profiles
3. **Collaboration**: Real-time commenting on research
4. **Export Options**: PDF, Word, Markdown downloads
5. **Research Comparison View**: Side-by-side document comparison
6. **Custom Styling**: User theme preferences

### Feature Enhancements
1. **Multi-Agent Research**: Multiple agents working on different aspects
2. **Research Synthesis**: Auto-combine findings from multiple projects
3. **Version History**: Track changes to research files over time
4. **Scheduled Research**: Automatic periodic research on topics
5. **Research Suggestions**: AI recommends related research to explore
6. **Team Roles**: Different permissions for viewers vs. creators

### Integration Enhancements
1. **Slack Integration**: Post research summaries to Slack
2. **Calendar Sync**: Schedule research project dates
3. **Notion Integration**: Export research to Notion databases
4. **GitHub Integration**: Save research as repo documentation
5. **Email Delivery**: Email research summaries

---

## Glossary

| Term | Definition |
|------|-----------|
| **Research Project** | A collection of files (README, HTML, etc.) generated from a research request |
| **Research Wizard** | The form-based interface for creating new research (/wizard) |
| **Agent** | The AI service (Claude, GPT, Gemini) conducting the research |
| **Metadata** | Project information (title, tags, category, description) |
| **Activity** | An action taken by the research agent (search, file write, etc.) |
| **Progress** | The percentage and status of ongoing research |
| **Portal** | The main interface for browsing and viewing research (homepage) |
| **MCP** | Model Context Protocol - interface between agents and tools |

---

## Support & Documentation

- **Quick Start**: See START.md
- **Setup Guide**: See SETUP.md
- **Agent Configuration**: See AGENTS.md
- **Technical Details**: See README.md

---

**Last Updated**: November 2024
**Version**: 2.0
**Audience**: Product Managers, Designers, Stakeholders
