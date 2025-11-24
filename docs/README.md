# Research Portal Documentation

This directory contains comprehensive documentation for the Research Portal application, covering both technical and product perspectives.

## 📚 Documentation Files

### **PRODUCT.md** (31 KB) ⭐ START HERE
**For**: Product Managers, Designers, Stakeholders, Business Analysts

The main product documentation covering:
- **What is the Research Portal?** - Overview and purpose
- **Core Value Proposition** - Benefits for researchers, teams, knowledge management
- **Main User Workflows** - 4 key user flows through the application
- **Key Features** - Feature breakdown from user perspective
- **UI/UX Organization** - Layout, design system, visual language
- **Research Portal Features** - 6 features for browsing completed research
- **Research Wizard Features** - 6 features for creating new research
- **User Journeys** - 4 detailed user stories with timelines
- **Design & UX Principles** - Philosophy and approach
- **Success Metrics** - KPIs for measuring product success

**Jump to sections**:
- User workflows: [Main User Workflows](#main-user-workflows)
- Feature overview: [Key Features from a User Perspective](#key-features-from-a-user-perspective)
- UI/UX details: [UI/UX Organization](#uiux-organization)

---

### **CONFIGURATION.md** (25 KB)
**For**: Developers, DevOps, System Administrators

Complete setup and configuration guide:
- Environment variables
- Database configuration
- API provider setup (Anthropic, OpenAI, Google)
- Server configuration
- Docker/deployment options
- Troubleshooting

---

### **FEATURES.md** (26 KB)
**For**: Developers, Technical Leads, Product Managers

Detailed technical feature documentation:
- Feature breakdown
- Technical implementation details
- API endpoints
- Database schema
- Performance considerations

---

### **MCP-SERVER.md** (8.6 KB)
**For**: Developers, AI Integration Specialists

Model Context Protocol server documentation:
- MCP server setup
- Available tools and resources
- Integration with AI agents
- Tool usage examples

---

## 🎯 Quick Navigation by Role

### Product Manager
1. Start with [PRODUCT.md](PRODUCT.md) - **Complete product guide**
2. Review [User Journeys](PRODUCT.md#user-journeys) - Understand user behavior
3. Check [Success Metrics](PRODUCT.md#success-metrics-product-kpis) - KPIs for tracking
4. Look at [Future Enhancements](PRODUCT.md#future-enhancement-opportunities) - Roadmap ideas

### Designer
1. Read [UI/UX Organization](PRODUCT.md#uiux-organization) - Layout and structure
2. Review [Design Principles](PRODUCT.md#design--ux-principles) - Philosophy
3. Check [Color System](PRODUCT.md#ui-ux-organization) - Visual design
4. Explore [Key Features](PRODUCT.md#key-features-from-a-user-perspective) - Feature UI

### Developer
1. Start with [CONFIGURATION.md](CONFIGURATION.md) - Setup and config
2. Read [FEATURES.md](FEATURES.md) - Technical details
3. Check [MCP-SERVER.md](MCP-SERVER.md) - Agent integration
4. Reference [PRODUCT.md](PRODUCT.md) - Feature requirements

### Stakeholder/Executive
1. Start with [PRODUCT.md](PRODUCT.md#core-value-proposition) - Value proposition
2. Review [What is the Research Portal?](PRODUCT.md#what-is-the-research-portal)
3. Check [User Journeys](PRODUCT.md#user-journeys) - Real-world usage
4. Look at [Success Metrics](PRODUCT.md#success-metrics-product-kpis) - Business KPIs

---

## 📖 Documentation Structure

```
docs/
├── README.md                    (this file - index)
├── PRODUCT.md                   ⭐ Main product documentation
├── CONFIGURATION.md             Technical setup guide
├── FEATURES.md                  Technical feature details
└── MCP-SERVER.md               AI agent integration
```

---

## 🔑 Key Concepts

### Research Portal (File-based)
Browse and view completed research projects stored as files in the filesystem.
- **Location**: `/research-projects/` directory
- **Interface**: Homepage (`/`)
- **Features**: Project discovery, file viewing, search, favorites

### Research Wizard (Database-driven)
Create and run new research using AI agents with real-time monitoring.
- **Location**: `~/research/research-wizard.db` (SQLite database)
- **Interface**: Form page (`/wizard`) and detail page (`/research/[id]`)
- **Features**: Research configuration, real-time progress, live chat

### Two-System Architecture
The application manages two separate but complementary data stores:

```
Research Wizard (Active)           Research Portal (Historical)
├── SQLite Database                ├── Filesystem
├── Live research sessions         ├── Completed projects
├── Real-time chat                 ├── Beautiful browsing
└── Progress tracking              └── Team viewing
```

---

## 🚀 Getting Started

### For Users
See [START.md](../START.md) for quick start guide

### For Configuration
See [CONFIGURATION.md](CONFIGURATION.md)

### For Understanding Features
See [PRODUCT.md](PRODUCT.md)

### For Technical Details
See [FEATURES.md](FEATURES.md)

---

## 📊 Application Overview

**What It Does**:
- Enables users to create automated research projects using AI
- Provides beautiful interface for browsing research findings
- Tracks research progress in real-time
- Allows live conversation with research agents
- Auto-detects and organizes research projects

**Who Uses It**:
- Product managers researching market trends
- Engineers exploring technical solutions
- Teams evaluating competitive analysis
- Researchers needing comprehensive product information
- Organizations building knowledge archives

**Key Differentiators**:
- Real-time progress monitoring
- Live conversation with research agents
- Beautiful Notion-style interface
- Auto-detection of projects (no manual setup)
- Multi-AI provider support (Claude, GPT, Gemini)

---

## 🎨 Design Philosophy

The application follows these design principles:
- **Notion-Inspired**: Clean, minimal, professional aesthetic
- **Progressive Disclosure**: Show information at the right time
- **Real-time Feedback**: Users see work happening in real-time
- **Clear Visual Hierarchy**: Important information stands out
- **Accessibility**: High contrast, keyboard shortcuts, semantic HTML

See [Design Principles](PRODUCT.md#design--ux-principles) for details.

---

## 📝 Common Tasks

| Task | Time | Document |
|------|------|----------|
| Setup application | 10-30 min | [CONFIGURATION.md](CONFIGURATION.md) |
| Start first research | 5-10 min | [PRODUCT.md#workflow-2](PRODUCT.md#workflow-2-start-new-research-research-wizard) |
| Browse research | 5 min | [PRODUCT.md#workflow-1](PRODUCT.md#workflow-1-browse-existing-research) |
| Monitor research | 1-5 hours | [PRODUCT.md#workflow-3](PRODUCT.md#workflow-3-monitor-active-research) |
| Understand architecture | 15 min | [PRODUCT.md#data--architecture](PRODUCT.md#data--architecture) |

---

## ❓ FAQ

**Q: What's the difference between Research Portal and Research Wizard?**
A: See [Two Systems, One Interface](PRODUCT.md#two-systems-one-interface) in PRODUCT.md

**Q: How long does research take?**
A: See [Depth Selection Impact](PRODUCT.md#depth-selection-impact) - Quick (30-45 min) to Deep (2-4 hours)

**Q: Can I modify research while it's running?**
A: Yes! See [Workflow 3](PRODUCT.md#workflow-3-monitor-active-research) for details

**Q: How are projects organized?**
A: See [File Organization](PRODUCT.md#feature-4-file-organization) in PRODUCT.md

**Q: What AI providers are supported?**
A: See [CONFIGURATION.md](CONFIGURATION.md) - Claude, GPT, and Gemini

---

## 📧 Documentation Metadata

- **Created**: November 2024
- **Version**: 2.0
- **Last Updated**: November 24, 2024
- **Audience**: Product Managers, Designers, Developers, Stakeholders
- **Status**: Complete and comprehensive

---

## 🔗 Related Files

- **START.md** - One-minute quick start
- **SETUP.md** - Detailed setup guide
- **AGENTS.md** - Research agent configuration
- **README.md** - Main project README

---

**Questions or feedback?** Please refer to the specific documentation file for your role and needs. Each file is self-contained and can be read independently.
