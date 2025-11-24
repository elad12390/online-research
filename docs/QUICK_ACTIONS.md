# Quick Actions Guide

## Overview

The Research Portal now includes Quick Actions in the command palette (Cmd/Ctrl+K) to help you perform common tasks quickly without navigating through menus.

## Accessing Quick Actions

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the command palette. When the search field is empty, you'll see all available quick actions:

```
🔍 Search projects, files, or use quick actions...

Quick Actions
Type to search projects and files, or use the actions above to:
✨ Start a new research project
📚 Browse all research projects
⚙️ Monitor running agents
⛔ Stop active researches
```

## Available Quick Actions

### 1. ✨ Start New Research

**Command**: `Start New Research`

**What it does**: Takes you directly to the Research Wizard to create a new research project.

**Use cases**:
- Creating a new research topic quickly
- Starting a new investigation
- Launching a quick inquiry

**Keyboard shortcuts**:
1. Press Cmd+K (or Ctrl+K)
2. See "Start New Research" in the list
3. Press Enter or click on it
4. You'll be taken to `/wizard`

---

### 2. 📚 View All Researches

**Command**: `View All Researches`

**What it does**: Takes you back to the main portal dashboard where you can browse all completed and in-progress research projects.

**Use cases**:
- Returning to the main view
- Browsing your research library
- Looking for a specific project

**Keyboard shortcuts**:
1. Press Cmd+K (or Ctrl+K)
2. See "View All Researches" in the list
3. Press Enter or click on it
4. You'll be taken to `/`

---

### 3. ⚙️ Running Agents

**Command**: `Running Agents`

**What it does**: Highlights and scrolls to the Research Side Panel on the right side of the screen where you can monitor all active research agents and their real-time progress.

**Use cases**:
- Checking on active research sessions
- Monitoring agent status and progress
- Viewing real-time research updates

**Keyboard shortcuts**:
1. Press Cmd+K (or Ctrl+K)
2. See "Running Agents" in the list
3. Press Enter or click on it
4. The right panel will highlight and scroll into view

---

### 4. ⛔ Stop All Researches

**Command**: `Stop All Researches`

**What it does**: Terminates all currently running research agents with a confirmation dialog to prevent accidental stops.

**Use cases**:
- Stopping runaway researches
- Cleaning up when you're done
- Freeing up system resources
- Emergency halt of all operations

**Important**: This action requires confirmation before executing. You'll see a dialog asking:
```
Are you sure you want to stop all running researches?
```

**Keyboard shortcuts**:
1. Press Cmd+K (or Ctrl+K)
2. See "Stop All Researches" in the list
3. Press Enter or click on it
4. Confirm in the dialog
5. All active researches will be terminated
6. The page will reload to show updated status

---

## Combining Quick Actions with Search

You can also search within quick actions. For example:

| Search Query | Results |
|---|---|
| `start` | Shows "Start New Research" |
| `research` | Shows "Start New Research", "View All Researches", "Stop All Researches" |
| `agent` | Shows "Running Agents" |
| `stop` | Shows "Stop All Researches" |
| `run` | Shows "Running Agents" |

---

## Search Projects and Files

Beyond quick actions, you can use the command palette to search for existing projects and files:

### Search by Project Name
```
Cmd+K → type "project-name" → Select from results
```

### Search by File Name
```
Cmd+K → type "filename.md" → Select from results
```

### Search by Description
```
Cmd+K → type keywords from project description → See matching projects
```

---

## Navigation Shortcuts

Once the command palette is open, use these keyboard shortcuts:

| Key | Action |
|---|---|
| **↑** | Navigate to previous item |
| **↓** | Navigate to next item |
| **Enter** | Select highlighted item or execute action |
| **Esc** | Close command palette |

---

## Tips & Tricks

### 1. Quick Navigation Pattern
- Press Cmd+K to open palette
- Type project name/file to search
- Press Enter to navigate
- This is faster than clicking through the sidebar

### 2. Monitoring Workflow
1. Press Cmd+K
2. Select "Running Agents" to monitor
3. Press Cmd+K again to see actions
4. Select "Start New Research" for another project

### 3. Emergency Stop
- If researches are running too long
- Press Cmd+K
- Select "Stop All Researches"
- Confirm the dialog
- All agents terminate immediately

### 4. Dashboard Return
- Always use "View All Researches" to get back to the main portal
- Faster than using browser back button
- Ensures clean state

---

## Implementation Details

### File: `components/CommandPalette.tsx`

The quick actions are defined at the top of the component:

```typescript
const QUICK_ACTIONS: SearchResult[] = [
  {
    type: 'action',
    title: 'Start New Research',
    description: 'Create a new research project',
    icon: '✨',
    action: () => {
      window.location.href = '/wizard';
    }
  },
  // ... more actions
];
```

### Adding New Quick Actions

To add a new quick action:

1. Add a new object to `QUICK_ACTIONS` array
2. Set the `type` to `'action'`
3. Provide a descriptive `title` and `description`
4. Choose an appropriate `icon` (emoji)
5. Define the `action` function that runs when selected

Example:
```typescript
{
  type: 'action',
  title: 'My New Action',
  description: 'What this action does',
  icon: '🚀',
  action: () => {
    // Your action code here
  }
}
```

---

## Troubleshooting

### Quick Actions Not Showing?
- Make sure the search field is empty
- Start typing to search for projects instead
- The actions only appear when you first open the palette

### Action Not Working?
- Check browser console (F12) for errors
- Ensure you have necessary permissions
- Try refreshing the page (Cmd+R or Ctrl+R)

### Stop All Not Terminating?
- Some research agents may be stuck
- Check the Research Side Panel for details
- Try stopping individual researches first
- Restart the server if needed

---

## Future Enhancements

Potential quick actions to add in the future:

- 🔄 **Refresh All Projects** - Reload all project data
- 📋 **Export All Data** - Download research data as ZIP
- 🎯 **Recent Projects** - Jump to recently viewed projects
- 🏷️ **Filter by Tag** - Show projects with specific tags
- 🔐 **API Settings** - Quick access to API configuration
- 📊 **Statistics** - View research statistics and metrics
- 🌙 **Toggle Theme** - Switch between light/dark modes
- 🔔 **Notifications** - View research notifications

---

## Keyboard Shortcut Reference

| Action | Shortcut |
|---|---|
| Open Command Palette | Cmd+K / Ctrl+K |
| Navigate Down | ↓ |
| Navigate Up | ↑ |
| Select Item | Enter |
| Close Palette | Esc |
| Click Quick Action | Click button |

---

**Last Updated**: November 24, 2025

For more information, see:
- [FEATURES.md](./FEATURES.md) - Complete feature list
- [PRODUCT.md](./PRODUCT.md) - User workflows
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
