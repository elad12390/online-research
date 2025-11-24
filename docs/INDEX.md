# Research Portal Documentation Index

Welcome to the Research Portal documentation! This guide helps you navigate all available documentation.

## 📚 Documentation Files

### [ARCHITECTURE.md](./ARCHITECTURE.md) - **START HERE** 
**1,217 lines | Comprehensive system design**

The complete technical architecture covering:
- Technology stack (Next.js, React, TypeScript, SQLite, Python)
- Complete folder structure with file descriptions
- Data flow diagrams and request flows
- Core module dependencies and interactions
- Database schemas (SQLite, JSON files)
- API architecture (20+ REST endpoints, WebSocket events)
- Authentication flow
- Research agent interaction model
- 8 key architectural decisions with rationale
- Module dependency graph
- Component hierarchy
- Performance and security considerations
- Environment configuration
- Testing strategy
- Deployment considerations
- Future improvements

**Best for:** Understanding how the system works, developer onboarding, architectural decisions

---

### [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
**~400 lines | Fast lookup guide**

Quick reference for common tasks:
- Key files to know
- Architecture quick reference tables
- Common development tasks
- Important concepts
- Environment variables
- Common code patterns
- TypeScript interfaces
- Testing checklist
- Debugging tips
- Performance tips
- Security reminders
- Links to resources

**Best for:** Quick lookups while coding, onboarding, common patterns

---

### [MCP-SERVER.md](./MCP-SERVER.md)
**~400 lines | MCP implementation details**

Model Context Protocol server documentation:
- MCP server overview
- Tool implementations
- Safe filesystem operations
- Error handling
- Integration with research agents

**Best for:** Understanding AI agent integration, building custom MCP servers

---

### Supporting Documentation

#### [CONFIGURATION.md](./CONFIGURATION.md)
Environment setup and configuration options for all providers.

#### [FEATURES.md](./FEATURES.md)
User-facing features and capabilities.

#### [PRODUCT.md](./PRODUCT.md)
Product overview and use cases.

---

## 🎯 Documentation by Use Case

### "I'm a new developer, where do I start?"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Sections 1-3** (Tech stack, folder structure, data flow)
2. Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - **Entire document**
3. Explore key files mentioned in quick reference
4. Run the application and trace through a user action

### "I need to add a new API endpoint"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Section 6** (API Architecture)
2. Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - **"Adding a New API Endpoint"**
3. Check similar endpoints in `app/api/`
4. Implement and test

### "I need to understand the research agent system"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Sections 8-9** (Research Agent, Architectural Decisions)
2. Read [MCP-SERVER.md](./MCP-SERVER.md)
3. Review `mcp_agent.config.yaml`
4. Check `scripts/research-prompt.txt`
5. Review `lib/research-wizard/research-manager.ts`

### "I need to modify the UI"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Sections 11** (Component Hierarchy)
2. Review component files in `components/`
3. Check Zustand store in `lib/store.ts`
4. Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - **"Accessing Global State"**

### "I need to debug an issue"
1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - **"Debugging Tips"**
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - **Section 18** (Troubleshooting)
3. Check relevant module in [ARCHITECTURE.md](./ARCHITECTURE.md) - **Sections 4-5**

### "I need to deploy the application"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Section 16** (Deployment)
2. Review environment variables in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
3. Check `.env.example` for all configuration options

### "I want to understand security"
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - **Section 13** (Security)
2. Review `lib/server/file-scanner.ts` - path validation code
3. Check `mcp-servers/filesystem-server.py` - allowed directories

---

## 🔍 Quick Navigation

### By Technology
- **Next.js & React** → ARCHITECTURE.md Sections 1, 11
- **TypeScript** → QUICK-REFERENCE.md "TypeScript Interfaces"
- **Zustand (State)** → ARCHITECTURE.md Section 4.1, QUICK-REFERENCE.md "Accessing Global State"
- **SQLite (Database)** → ARCHITECTURE.md Section 5, QUICK-REFERENCE.md "Verify Database"
- **Python Agent** → ARCHITECTURE.md Sections 8-9, MCP-SERVER.md
- **Tailwind CSS** → ARCHITECTURE.md Section 1

### By System
- **Research Portal (File-based browsing)** → ARCHITECTURE.md Sections 3.2, 4.2
- **Research Wizard (AI Agent)** → ARCHITECTURE.md Sections 3.3, 4.3, 4.4, 8
- **Authentication** → ARCHITECTURE.md Section 7, QUICK-REFERENCE.md "Environment Variables"

### By Topic
- **API Design** → ARCHITECTURE.md Section 6
- **Data Flows** → ARCHITECTURE.md Section 3
- **Dependencies** → ARCHITECTURE.md Sections 4, 10
- **Performance** → ARCHITECTURE.md Section 12
- **Security** → ARCHITECTURE.md Section 13
- **Testing** → ARCHITECTURE.md Section 15, QUICK-REFERENCE.md "Testing Checklist"
- **Deployment** → ARCHITECTURE.md Section 16

---

## 📊 Architecture Overview Diagram

```
┌─────────────────────────────────────────────────┐
│           Research Portal (Next.js)              │
│                                                   │
│  ┌──────────────────────────────────────────┐  │
│  │      Frontend (React Components)         │  │
│  │  Sidebar │ DocumentView │ CommandPalette│  │
│  └───────────────────┬──────────────────────┘  │
│                      │                          │
│         ┌────────────┴──────────────┐           │
│         ▼                           ▼           │
│    Zustand Store          File System Watcher   │
│    (localStorage)         (chokidar)            │
│                                                   │
└────────────┬──────────────────────────┬─────────┘
             │                          │
      ┌──────┴──────┐            ┌──────┴──────┐
      ▼             ▼            ▼             ▼
  Research Portal  MCP        Research       Auth
  REST API        Server       Wizard        API
  /api/projects   /api/mcp    /api/research /api/auth

      │             │            │             │
      ├─ File       └─ Python    ├─ SQLite    └─ Tokens
      │  Scanning     MCP Agent  │  Database
      │  Project      Tools      └─ Process
      │  Discovery             Management
      │
      RESEARCH_DIR/
      └── [project-id]/
          ├── README.md
          ├── *.md files
          ├── metadata.json
          └── .research-progress.json
```

---

## 📈 File Statistics

```
ARCHITECTURE.md         1,217 lines   Complete technical documentation
QUICK-REFERENCE.md       400 lines   Common patterns and quick lookups
MCP-SERVER.md            400 lines   Agent integration details
CONFIGURATION.md       1,086 lines   Configuration reference
FEATURES.md              897 lines   Feature documentation
PRODUCT.md               943 lines   Product overview
```

**Total: ~5,500 lines of comprehensive documentation**

---

## 🔗 Related Files in Codebase

| File | Purpose |
|------|---------|
| `README.md` | User-facing overview |
| `AGENTS.md` | Agent integration guide |
| `SETUP.md` | Setup and installation |
| `START.md` | Quick start guide |
| `.env.example` | Environment variables template |
| `mcp_agent.config.yaml` | MCP server configuration |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |

---

## 🎓 Learning Path

### Beginner (Understanding the system)
1. ARCHITECTURE.md - Sections 1-3 (45 min)
2. QUICK-REFERENCE.md - Entire document (30 min)
3. Explore codebase following section 2 folder structure (1 hour)

### Intermediate (Making changes)
1. ARCHITECTURE.md - Sections 4-6, 10-11 (1 hour)
2. QUICK-REFERENCE.md - Code patterns sections (30 min)
3. Make your first API endpoint change
4. Make your first UI component change

### Advanced (System design)
1. ARCHITECTURE.md - Sections 7-9 (1 hour)
2. ARCHITECTURE.md - Sections 12-18 (1 hour)
3. Study module dependencies (Section 10)
4. Understand architectural decisions (Section 9)

---

## 💬 Getting Help

1. **Architecture questions** → Read ARCHITECTURE.md
2. **Quick lookup** → Check QUICK-REFERENCE.md
3. **Agent integration** → Read MCP-SERVER.md
4. **Setup issues** → Check SETUP.md in root
5. **Feature questions** → Read FEATURES.md
6. **Debugging** → QUICK-REFERENCE.md "Debugging Tips"

---

## 📝 Notes

- All code examples are TypeScript/JavaScript unless noted
- File paths are relative to project root
- Timestamps are ISO format
- Database queries are SQLite syntax
- Python code uses 3.8+ features

---

**Last Updated:** November 24, 2024  
**Documentation Version:** 2.0.0  
**Project Version:** 2.0.0
