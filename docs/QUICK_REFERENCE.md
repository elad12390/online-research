# Quick Reference Guide

Fast lookup for common configuration tasks and environment setup.

## ⚡ 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Add API key to .env.local
# Edit .env.local and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-oat01-...
# RESEARCH_DIR=/Users/username/research

# 4. Create research directory
mkdir -p ~/research

# 5. Start server
npm run dev

# 6. Open http://localhost:3000
```

---

## 🔑 Environment Variables Checklist

```bash
# REQUIRED
RESEARCH_DIR=/Users/username/research

# AI PROVIDER (choose at least one)
ANTHROPIC_API_KEY=sk-ant-oat01-...
# or
OPENAI_API_KEY=sk-proj-...
# or
GOOGLE_API_KEY=AIzaSy...

# OPTIONAL
PORT=3000
DATABASE_URL=file:./research-wizard.db
```

### Get Your API Keys

| Provider | Get Key | Docs |
|----------|---------|------|
| **Anthropic** | https://console.anthropic.com/settings/keys | [Guide](#anthropic-apikey) |
| **OpenAI** | https://platform.openai.com/api-keys | [Guide](#openai_api_key) |
| **Google** | https://makersuite.google.com/app/apikey | [Guide](#google_api_key) |

---

## 📁 Directory Structure

```
~/                                    # Home directory
├── dev/
│   └── online-research/              # Project code (this repo)
│       ├── app/
│       ├── lib/
│       ├── mcp-servers/
│       ├── scripts/
│       ├── .env.local                # Your environment variables
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── mcp_agent.config.yaml
│
└── research/                         # Research projects directory
    ├── project-1/
    │   ├── metadata.json
    │   ├── README.md
    │   └── index.html
    └── project-2/
        ├── metadata.json
        ├── README.md
        └── findings.html
```

---

## 🚀 Common Commands

### Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Create production build
npm run start        # Run production server
npm run lint         # Check code quality
npm run type-check   # Check TypeScript errors
```

### Research Agent

```bash
# Run research (via API)
POST /api/research
{
  "topic": "Indoor grills",
  "depth": "standard"
}

# Or run Python script directly
python scripts/research-agent.py \
  --topic "Your topic" \
  --output ~/research/my-project
```

---

## 🔐 Authentication

### Option 1: OAuth via Claude CLI (Recommended)

```bash
# 1. Go to http://localhost:3000/auth
# 2. Click "Login with Claude"
# 3. Approve in browser
# 4. Token auto-saved to .env.local
```

### Option 2: Manual API Key

```bash
# 1. Get key from https://console.anthropic.com/settings/keys
# 2. Go to http://localhost:3000/auth
# 3. Paste key in form
# 4. Click "Save Key"
# 5. Key saved to .env.local
```

### Verify Token Valid

```bash
# Token format check:
# OAuth:  sk-ant-oat01-[95+ chars]
# API:    sk-ant-api03-[95+ chars]

echo $ANTHROPIC_API_KEY
```

---

## 📋 Configuration Files Quick Links

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (create from `.env.example`) |
| `tsconfig.json` | TypeScript compiler options |
| `next.config.js` | Next.js build configuration |
| `tailwind.config.js` | Tailwind CSS theme configuration |
| `mcp_agent.config.yaml` | MCP agent servers and LLM models |
| `package.json` | Node.js dependencies and scripts |

---

## 🗄️ Database

### Research Wizard DB (Live Sessions)

```bash
# Location
~/.research/research-wizard.db

# Or set with
DATABASE_URL=file:./research-wizard.db

# Tables: researches, agents, activities
# Auto-created on first run
```

### Reset Database

```bash
# Delete database file (will recreate on next run)
rm ./research-wizard.db
npm run dev
```

---

## 🛠️ Configuration by Feature

### Add New LLM Model

Edit `mcp_agent.config.yaml`:

```yaml
anthropic:
  default_model: "claude-opus-4-1"    # Change model

# Or use different model per agent
# Set in API request: { "model": "claude-haiku-3-5" }
```

### Change Server Port

Edit `.env.local`:

```bash
PORT=3001
```

Or run:

```bash
PORT=3001 npm run dev
```

### Add Research Directory

Edit `.env.local`:

```bash
RESEARCH_DIR=/path/to/research
```

Create directory:

```bash
mkdir -p /path/to/research
```

### Enable Debug Logging

Edit `mcp_agent.config.yaml`:

```yaml
logger:
  level: debug    # Change from 'info' to 'debug'
```

---

## 🐛 Common Issues

### Port 3000 Already in Use

```bash
# Kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### `ANTHROPIC_API_KEY` Not Found

```bash
# Check .env.local exists
ls -la .env.local

# Check key is set
cat .env.local | grep ANTHROPIC

# Reload environment
source .env.local
```

### `RESEARCH_DIR` Not Found

```bash
# Check environment variable
echo $RESEARCH_DIR

# Create directory
mkdir -p ~/research

# Add to .env.local
echo "RESEARCH_DIR=~/research" >> .env.local
```

### Build Fails - TypeScript Errors

```bash
# Check types
npm run type-check

# Or fix during build
npm run build
```

### Research Database Locked

```bash
# Restart server
npm run dev

# Or reset database
rm ./research-wizard.db
npm run dev
```

---

## 📚 Full Documentation

For detailed information, see:

- **[CONFIGURATION.md](/docs/CONFIGURATION.md)** - Complete configuration guide
- **[AGENTS.md](/AGENTS.md)** - Research agent architecture
- **[.env.example](/.env.example)** - Environment variables template

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Node.js v18+ installed: `node --version`
- [ ] Python v3.8+ installed: `python --version`
- [ ] Dependencies installed: `npm list | head -20`
- [ ] .env.local created with API key
- [ ] RESEARCH_DIR directory created and accessible
- [ ] Dev server starts: `npm run dev`
- [ ] Browser loads http://localhost:3000
- [ ] Auth page accessible at /auth
- [ ] API health check: `curl http://localhost:3000/api/health`

---

## 📞 Support

For help with configuration:

1. Check [CONFIGURATION.md](/docs/CONFIGURATION.md) for detailed docs
2. Review your `.env.local` file
3. Check server logs: `npm run dev` output
4. Verify API keys at:
   - Anthropic: https://console.anthropic.com/settings/keys
   - OpenAI: https://platform.openai.com/api-keys

Last updated: November 24, 2025
