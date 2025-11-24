# Research Portal - Setup & Usage Guide

## Overview

The Research Portal is a live-updating web application that displays all your research projects in an organized, browsable interface. It includes an AI Research Wizard that uses Claude Agent SDK to conduct automated research.

## Prerequisites

1. **Node.js** - Version 18 or higher
2. **Anthropic API Key** - Required for AI Research Wizard

## Quick Start

### 1. Set Up Anthropic API Key (Required for Research Wizard)

**Get your API key:**
1. Go to https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to API Keys → Create Key

**Set the environment variable:**

```bash
# macOS/Linux
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Add to ~/.zshrc or ~/.bashrc to persist
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.zshrc
source ~/.zshrc

# Verify it's set
echo $ANTHROPIC_API_KEY
```

### 2. Start the Server

```bash
cd /Users/eladbenhaim/dev/online-research
npm install  # First time only
npm start
```

The portal will be available at: **http://localhost:3000**

### 2. View Your Research

1. Open your browser to `http://localhost:3000`
2. Click on a project name in the left sidebar
3. Select a file from the tabs
4. The content will render beautifully with live updates

That's it! The portal automatically:
- ✅ Scans for new research projects
- ✅ Detects file changes in real-time
- ✅ Updates the UI every 5 seconds
- ✅ Renders markdown to HTML automatically
- ✅ Works on desktop, tablet, and mobile

---

## Project Structure

Research projects must follow this structure to work with the portal:

```
research-project-name/          (kebab-case directory)
├── README.md                   (Required - always shown first)
├── 01-filename.md              (Optional - numbered files)
├── 02-filename.md
└── 03-filename.md
```

### Required
- **README.md**: Overview of the project. This file should contain:
  - Project title
  - Quick summary/TL;DR
  - Guide for using other files
  - Key findings

### Optional
- **01-, 02-, 03- prefixed files**: Detailed documentation
  - Files are automatically sorted numerically
  - Each file becomes a tab in the portal

### Example Structure
```
indoor-grill-research/
├── README.md                          # Project overview (required)
├── 01-COMPREHENSIVE-GUIDE.md          # Deep dive content
├── 02-MODEL-COMPARISON-CHART.md       # Tables and comparisons
└── 03-APARTMENT-LIVING-GUIDE.md       # Practical tips
```

---

## Configuration

### Environment Variables

Edit `.env` to customize:

```bash
# Port to run on (default: 3000)
PORT=3000

# Directory to scan for research projects (default: current directory)
RESEARCH_DIR=.
```

### Examples

**Run on different port:**
```bash
PORT=3001 npm start
```

**Scan a specific directory:**
```bash
RESEARCH_DIR=/Users/eladbenhaim/dev/research npm start
```

**Both together:**
```bash
PORT=4000 RESEARCH_DIR=/Users/eladbenhaim/dev/my-research npm start
```

---

## How It Works

### Backend (Node.js + Express)

1. **File Scanning**: On startup, scans all directories for folders with `README.md`
2. **File Watching**: Uses `chokidar` to watch for file changes
3. **API Endpoints**: Provides REST API to fetch projects and files
4. **Markdown Parsing**: Converts markdown to HTML using `marked` library

**Key Endpoints:**
- `GET /api/health` - Check server status
- `GET /api/projects` - List all projects
- `GET /api/projects/:projectId` - Get project details
- `GET /api/projects/:projectId/files/:fileName` - Get file content

### Frontend (HTML + CSS + JavaScript)

1. **Polling**: Checks for updates every 5 seconds
2. **Live Rendering**: Updates when new projects detected
3. **Tab Navigation**: Switch between files in a project
4. **Responsive Design**: Works on all screen sizes
5. **Beautiful Markdown**: Custom CSS for perfect markdown rendering

**Features:**
- Auto-loading first file when project selected
- Live file content updates
- Connection status indicator
- Project statistics display
- Mobile-friendly interface

---

## Features

### 🔄 Live Updates
- Automatically detects new projects
- Refreshes file content every 5 seconds
- Shows connection status in header

### 📱 Responsive Design
- Works perfectly on desktop
- Mobile-friendly layout
- Tablet optimized
- Touch-friendly interface

### 📚 Rich Markdown Rendering
- Beautiful typography
- Syntax highlighting for code blocks
- Table rendering with hover effects
- Blockquotes and emphasis
- Links with underline on hover
- Proper heading hierarchy

### 📊 Smart Organization
- Projects sorted alphabetically
- Files sorted numerically (01-, 02-, 03-)
- Quick file access via tabs
- Project statistics (file count, last updated)

### 🎨 Professional Styling
- Clean, modern design
- Dark mode support
- Smooth animations
- Consistent color scheme
- High contrast for readability

---

## API Documentation

### Get All Projects
```
GET /api/projects
```

Response:
```json
{
  "projects": {
    "indoor-grill-research": {
      "name": "indoor-grill-research",
      "path": "/Users/eladbenhaim/dev/online-research/indoor-grill-research",
      "files": ["README.md", "01-COMPREHENSIVE-GUIDE.md", ...],
      "createdAt": "2025-11-22T15:25:01.127Z",
      "modifiedAt": "2025-11-22T15:31:03.285Z"
    }
  },
  "count": 1,
  "timestamp": "2025-11-22T15:32:17.089Z"
}
```

### Get Project Details
```
GET /api/projects/:projectId
```

Example: `GET /api/projects/indoor-grill-research`

### Get File Content
```
GET /api/projects/:projectId/files/:fileName
```

Example: `GET /api/projects/indoor-grill-research/files/README.md`

Response:
```json
{
  "fileName": "README.md",
  "projectId": "indoor-grill-research",
  "content": "# Indoor Grills...",
  "html": "<h1>Indoor Grills...</h1>...",
  "timestamp": "2025-11-22T15:32:17.089Z"
}
```

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "projectCount": 1,
  "researchDir": "/Users/eladbenhaim/dev/online-research",
  "timestamp": "2025-11-22T15:32:17.089Z"
}
```

---

## Writing Research for the Portal

### Best Practices

✅ **Do:**
- Use proper markdown syntax
- Organize files numerically (01-, 02-, 03-)
- Include comprehensive README.md
- Break up long documents into multiple files
- Use tables for comparisons
- Include summary sections
- Add source attribution

❌ **Don't:**
- Mix file naming conventions
- Create files without README.md
- Write plain text (use markdown)
- Create extremely long documents (split them)
- Ignore markdown syntax rules

### Markdown Writing Tips

**Headers:**
```markdown
# H1 - Project Title
## H2 - Main Section
### H3 - Subsection
#### H4 - Sub-subsection
```

**Lists:**
```markdown
- Unordered item
- Another item
  - Nested item

1. Ordered item
2. Another item
```

**Emphasis:**
```markdown
**Bold text**
*Italic text*
***Bold and italic***
```

**Links:**
```markdown
[Link text](https://example.com)
```

**Code:**
```markdown
`inline code`

\```python
# Code block
print("Hello")
\```
```

**Tables:**
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

**Blockquotes:**
```markdown
> Important note
> Can span multiple lines
```

**Emoji:**
```markdown
✅ Working well
❌ Not working
💡 Insight
📌 Important
```

---

## Troubleshooting

### Projects Not Appearing

1. Check that your project folder contains `README.md`
2. Verify folder name is in kebab-case (lowercase with hyphens)
3. Ensure it's in the correct directory (check `RESEARCH_DIR` setting)
4. Restart the server: `npm start`

### Files Not Showing

1. Verify files have `.md` extension
2. Check that files are in the project directory
3. Ensure markdown syntax is correct
4. Refresh the browser (browser cache can sometimes delay)

### Live Updates Not Working

1. Check browser console for errors (F12)
2. Verify port is correct in `.env`
3. Check that files are being saved properly
4. Restart the server if needed

### Markdown Not Rendering

1. Check syntax is correct (test on another markdown viewer)
2. Verify file extension is `.md`
3. Ensure no HTML special characters are unescaped
4. Refresh the page

---

## Development Notes

### Project Files

```
/Users/eladbenhaim/dev/online-research/
├── server.js              # Express backend server
├── public/
│   ├── index.html        # HTML template
│   ├── styles.css        # CSS styling
│   └── app.js            # Frontend JavaScript
├── package.json          # Dependencies
├── .env                  # Configuration
├── AGENTS.md             # Agent instructions
└── SETUP.md              # This file
```

### Dependencies

- **express**: Web framework
- **cors**: Enable cross-origin requests
- **chokidar**: File watching
- **marked**: Markdown parsing
- **dotenv**: Environment configuration

### Key Technologies

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Pure CSS with CSS variables
- **Rendering**: Marked library for markdown

### Future Enhancements

Possible improvements:
- WebSocket for real-time updates instead of polling
- Search functionality across all projects
- Project tags and categories
- Full-text search
- Export to PDF
- Collaborative editing
- Version history
- Comments and annotations

---

## Accessing from Other Machines

To access the portal from another computer on your network:

1. Find your IP address:
   ```bash
   # macOS
   ifconfig | grep "inet "
   
   # Linux
   hostname -I
   ```

2. Access from another machine:
   ```
   http://YOUR_IP:3000
   ```

   Example: `http://192.168.1.100:3000`

3. To access from internet (not recommended for security):
   - Use a tunnel service like `ngrok`
   - Or deploy to a cloud server

---

## Starting and Stopping

### Start Server
```bash
npm start
```

### Stop Server
```bash
# Press Ctrl+C in terminal
# Or kill the process
kill $(lsof -t -i :3000)
```

### Check if Running
```bash
curl http://localhost:3000/api/health
```

---

## Questions?

Refer back to the overview of how it works, the API documentation, or check the AGENTS.md file for more information about integrating with research workflows.

Good luck with your research! 🚀
