---
title: What is Research Portal?
description: Automated research that actually works. No babysitting required.
---

Research Portal is a self-hosted tool that turns research tasks into structured reports. You give it a topic, it searches the web, reads sources, and writes up findings. You come back to organized documentation instead of 50 open tabs.

## The Problem It Solves

Research sucks. Not the learning part — the grunt work part.

You start with a simple question: "What's the best X for Y?" Two hours later, you're drowning in browser tabs, half-remembered facts, and a messy Google Doc that somehow got worse as you added to it.

AI chatbots help, but they hallucinate, can't access current information, and forget everything between sessions. You end up copy-pasting back and forth, manually fact-checking, losing context.

## How Research Portal Is Different

**It does the whole job, not just pieces.**

When you start a research task, an AI agent:
1. Searches the web using real search engines (via self-hosted SearXNG)
2. Actually reads and analyzes the sources it finds
3. Writes structured reports with proper organization
4. Saves everything locally in markdown/HTML you can browse anytime

You're not prompting a chatbot. You're delegating to an autonomous agent that handles the research workflow end-to-end.

**It runs on your machine.**

No data leaves your infrastructure. SearXNG handles web search locally. Your research stays in your research directory. No subscriptions, no cloud lock-in, no "we updated our privacy policy" emails.

**It's transparent.**

Watch the agent work in real-time. See every search query, every source it reads, every decision it makes. If something looks wrong, you'll know immediately.

## Who It's For

- **Developers** evaluating tools, frameworks, or services
- **Product people** doing competitive research or market analysis  
- **Anyone** who regularly needs to research topics and document findings

If you've ever thought "I wish I could just tell an AI to figure this out and come back with a report" — that's what this does.

## What You Need

- Docker (that's it for the quick setup)
- An API key from Anthropic, OpenAI, or Google
- A topic you want researched

## What You Get

- A local web interface for starting research and browsing results
- Real-time progress tracking while agents work
- Organized markdown/HTML reports saved to your filesystem
- MCP integration so Claude Desktop can access your research library

No complex setup. No infrastructure to manage. Clone, configure one API key, run.

**Ready?** [Get started in 2 minutes →](/online-research/getting-started/quick-start/)
