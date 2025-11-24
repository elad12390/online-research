# 🔬 Research Portal with AI Research Wizard

A beautiful, live-updating web interface for browsing research projects, with an integrated AI Research Wizard that supports multiple LLM providers (Anthropic Claude, OpenAI GPT, Google Gemini).

## ✨ What It Does

- **🤖 AI Research Wizard** - Automated research using Claude, GPT, or Gemini
- **📚 Auto-discovers** all research projects in your directory
- **🔄 Live updates** - changes appear automatically  
- **📱 Responsive design** - works perfectly on desktop, tablet, and mobile
- **🎨 Beautiful markdown rendering** - your research looks professional
- **🔌 Multi-provider support** - Use any AI provider you prefer

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Python Environment (for AI Research Wizard)

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install mcp-agent with provider support
pip install "mcp-agent[anthropic,openai,google]"
```

### 3. Configure AI Provider (Choose One or More)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then add at least one API key:

**Option A: Anthropic (Claude)**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```
Get your key at: https://console.anthropic.com/settings/keys

**Option B: OpenAI (GPT)**
```bash
OPENAI_API_KEY=sk-...
```
Get your key at: https://platform.openai.com/api-keys

**Option C: Google AI (Gemini)**
```bash
GOOGLE_API_KEY=AIza...
```
Get your key at: https://makersuite.google.com/app/apikey

### 4. Start the Portal

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

### 5. Authenticate

Visit `/auth` to add your API keys through the web interface, or manually add them to `.env.local`.

## 📁 Project Structure

Research projects must follow this format:

```
my-research-project/          # kebab-case directory
├── README.md                 # Required - project overview
├── 01-comprehensive.md       # Optional - detailed guide
├── 02-comparison.md          # Optional - comparisons & tables
└── 03-practical.md           # Optional - actionable tips
```

## 📖 Documentation

- **[START.md](START.md)** - One-minute quick start guide
- **[SETUP.md](SETUP.md)** - Complete setup and configuration
- **[AGENTS.md](AGENTS.md)** - Integration guide for research agents

## 🎯 Features

### For Users
- Browse research projects with beautiful sidebar navigation
- View multiple files as tabs
- Live markdown rendering with syntax highlighting
- Mobile-friendly responsive design
- Connection status indicator
- Project statistics (file count, last updated)

### For Researchers
- Automatic project detection (no setup needed)
- File change watching (updates in real-time)
- Professional markdown rendering
- Organized file structure with numbering (01-, 02-, 03-)
- Dark mode support
- Keyboard-friendly navigation

### For Developers
- REST API for all functionality
- Configurable port and directory
- Uses industry-standard tools (Express, Marked)
- Clean, modular code
- Full documentation

## 🔧 Configuration

### Environment Variables

The portal uses `.env.local` for configuration. See `.env.example` for all available options:

```bash
# Research Directory
RESEARCH_DIR=/Users/you/research

# AI Provider API Keys (add at least one)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# Database (auto-created)
DATABASE_URL=file:./research.db

# Server Port (optional, default: 3000)
PORT=3000
```

### Supported AI Providers

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 Turbo | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Google AI** | Gemini Pro, Gemini Flash | [makersuite.google.com](https://makersuite.google.com/app/apikey) |

You can add **multiple providers** for flexibility!

## 🌐 API Endpoints

The portal provides a REST API:

- `GET /api/health` - Health check
- `GET /api/projects` - List all projects
- `GET /api/projects/:projectId` - Project details
- `GET /api/projects/:projectId/files/:fileName` - File content

### MCP Server (AI Agent Integration)

The portal also exposes an **MCP (Model Context Protocol)** server for AI agents:

- `GET /api/mcp` - SSE stream for server notifications
- `POST /api/mcp` - JSON-RPC endpoint for resource access

AI agents can use the MCP server to:
- List all research projects
- Read research content
- Search by topic/category/tags

See **[docs/MCP-SERVER.md](docs/MCP-SERVER.md)** for complete MCP documentation.

## 📦 What's Included

```
online-research/
├── server.js              # Backend server
├── public/
│   ├── index.html        # Frontend template
│   ├── styles.css        # Styling (responsive + dark mode)
│   └── app.js            # Frontend logic
├── package.json          # Dependencies
├── .env                  # Configuration
├── AGENTS.md             # Agent integration guide
├── SETUP.md              # Detailed documentation
└── START.md              # Quick start guide
```

## 🛠 Tech Stack

**Backend:**
- Node.js
- Express 5
- Chokidar (file watching)
- Marked (markdown parsing)

**Frontend:**
- Vanilla HTML/CSS/JavaScript (no frameworks)
- Responsive CSS Grid & Flexbox
- Dark mode support via CSS variables

**Zero external dependencies for frontend** - pure HTML/CSS/JS

## 📝 Writing Research for the Portal

### Do's ✅
- Use proper markdown syntax
- Organize files with numbers (01-, 02-, 03-)
- Include comprehensive README.md
- Break long documents into multiple files
- Use tables for comparisons
- Add source attribution

### Don'ts ❌
- Don't skip README.md
- Don't mix naming conventions
- Don't use plain text (use markdown)
- Don't skip markdown headers

## 🔗 Accessing from Other Machines

Find your IP address:
```bash
# macOS
ifconfig | grep "inet "
```

Then access from another machine:
```
http://YOUR_IP:3000
```

## 🐛 Troubleshooting

**Projects not appearing?**
- Ensure each project has `README.md`
- Use kebab-case names: `my-project` (not `MyProject`)
- Restart the server

**Files not updating?**
- Check files end with `.md`
- Files update every 5 seconds automatically

**Port in use?**
- Change port in `.env`: `PORT=3001`

## 📚 Example Project

See `indoor-grill-research/` for a real example:
- Professional README.md with overview
- Comprehensive guides
- Comparison tables
- Practical tips
- Beautiful formatting in the portal

## 🎨 Features in Detail

### Live Markdown Rendering
- Headers with proper hierarchy
- Code blocks with syntax highlighting
- Tables with hover effects
- Blockquotes and emphasis
- Links with underline on hover
- Lists (ordered and unordered)
- Proper spacing and typography

### Responsive Design
- Mobile-first approach
- Works on phones (320px+)
- Tablet optimized
- Desktop professional layout
- Touch-friendly interface

### Real-time Updates
- Detects new projects automatically
- Watches file changes
- Updates UI every 5 seconds
- No page reload needed
- Connection status indicator

## 🚀 Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   ```
   http://localhost:3000
   ```

4. **Create a research project**:
   ```bash
   mkdir my-research-project
   echo "# My Research" > my-research-project/README.md
   ```

5. **Watch it appear** in the portal automatically!

## 📖 Full Documentation

For complete setup instructions, API documentation, and best practices, see **[SETUP.md](SETUP.md)**.

For a quick one-minute overview, see **[START.md](START.md)**.

For research agent integration, see **[AGENTS.md](AGENTS.md)**.

## 💡 Tips

- The portal polls every 5 seconds for changes
- No restart needed when you add/edit files
- First file in a project is auto-loaded
- Files are sorted numerically (01-, 02-, etc.)
- Use meaningful README.md summaries
- Tables render beautifully for comparisons
- Code blocks with syntax highlighting
- Emoji work great in headers!

## 🎯 Use Cases

Perfect for:
- 📚 Product research documentation
- 🔬 Technical deep dives
- 🛍️ Buying guides
- 📊 Competitive analysis
- 📖 Learning resources
- 🎓 Educational materials
- 📋 Project documentation
- 💼 Team research sharing

## 🤝 Integration

This portal integrates seamlessly with the research workflow defined in [AGENTS.md](AGENTS.md). Follow that guide to ensure your research is:
- Well-structured for web viewing
- Properly formatted in markdown
- Organized with clear file naming
- Easy to navigate and reference

## 📄 License

MIT

## 🎉 Enjoy!

Your research portal is ready to go. Start with `npm start` and happy researching! 🚀
