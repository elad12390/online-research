---
title: Introduction
description: Learn about Research Portal and its capabilities.
---

Research Portal is an AI-powered research assistant that combines web search, multiple LLM providers, and a beautiful web interface for organizing and browsing your research findings.

## What is Research Portal?

Research Portal helps you conduct automated research by deploying AI agents that:

- **Search the web** using private, self-hosted SearXNG
- **Synthesize findings** into well-organized documents
- **Track progress** in real-time as research happens
- **Store results** in markdown and HTML for easy access

## Key Features

### AI Research Wizard

Start a research project by simply describing what you want to learn. The AI agent will:

1. Search multiple sources across the web
2. Analyze and synthesize information
3. Generate comprehensive reports
4. Update progress in real-time

### Multi-Provider LLM Support

Choose from multiple AI providers based on your needs:

- **Anthropic Claude** - Best for complex, nuanced research
- **OpenAI GPT** - Great for general research and coding
- **Google Gemini** - Fast iterations and multimodal support

### Private Web Search

Research Portal includes SearXNG, a privacy-respecting metasearch engine that:

- Aggregates results from multiple search engines
- Keeps your searches private
- Runs entirely on your infrastructure

### MCP Integration

Expose your research library to AI assistants via the Model Context Protocol (MCP):

- Works with Claude Desktop
- Compatible with OpenCode and other MCP clients
- Allows AI assistants to search and read your research

## Architecture Overview

Research Portal uses a two-system architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   Research Portal (Next.js)                   │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Frontend (React Components)               │   │
│  │  Sidebar | DocumentView | ResearchPanel | CommandPalette │ │
│  └───────────────────────────────────────────────────────┘   │
│                              │                                 │
│              ┌───────────────┴───────────────┐                │
│              ▼                               ▼                │
│   ┌──────────────────┐        ┌──────────────────────┐       │
│   │ Research Portal  │        │  Research Wizard     │       │
│   │ (File-based)     │        │  (Database-driven)   │       │
│   │                  │        │                      │       │
│   │ Browse projects  │        │ AI agent orchestration│      │
│   │ View documents   │        │ Progress tracking     │      │
│   │ Search & filter  │        │ Chat interface        │      │
│   └──────────────────┘        └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Research Portal (File-based)

The portal system scans your research directory for projects and:

- Displays projects with metadata
- Renders markdown and HTML files
- Supports drag-and-drop reordering
- Tracks favorites and recent files

### Research Wizard (Database-driven)

The wizard system manages active research sessions:

- Spawns AI agents for research tasks
- Tracks progress in SQLite database
- Streams agent activities in real-time
- Supports conversation continuation

## Use Cases

### Product Research

"Find the best indoor grills for apartments in 2024, focusing on smoke reduction and compact size."

### Market Analysis

"Research the current state of the AI coding assistant market, including key players and trends."

### Technical Documentation

"Create a comprehensive guide to setting up Kubernetes on bare metal."

### Competitive Analysis

"Compare the top 5 project management tools for small teams."

## Getting Started

Ready to start? Check out the [Quick Start guide](/online-research/getting-started/quick-start/) to get Research Portal running in minutes.
