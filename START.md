# 🚀 Research Portal - Quick Start

## One-Minute Setup

```bash
cd /Users/eladbenhaim/dev/online-research
npm start
```

Then open your browser to: **http://localhost:3000**

That's it! The portal is now running.

---

## What You Get

- 📚 **Project Browser**: See all research projects in the left sidebar
- 📄 **File Viewer**: Click files to read them in a beautiful formatted view
- 🔄 **Live Updates**: Changes appear automatically (no refresh needed)
- 📱 **Mobile Ready**: Works on phones, tablets, and desktops
- 🎨 **Beautiful Design**: Professional styling with dark mode support

---

## How to Use

1. **Run the server**
   ```bash
   npm start
   ```

2. **Open in browser**
   - Go to `http://localhost:3000`

3. **Browse projects**
   - Click a project name in the left sidebar
   - It will auto-load the README.md file
   - Click file tabs at the top to switch between files

4. **Watch for changes**
   - Edit any markdown file in your project folder
   - The portal automatically updates every 5 seconds

5. **Create new projects**
   - Make a new folder with kebab-case name: `my-research-project`
   - Add a `README.md` file inside
   - The portal auto-detects it

---

## Project Structure

Create research projects like this:

```
my-research-project/
├── README.md              (required - shows first)
├── 01-guide.md           (optional - becomes a tab)
├── 02-comparison.md      (optional - becomes a tab)
└── 03-tips.md            (optional - becomes a tab)
```

That's all! The numbers (01-, 02-, 03-) make files appear in order.

---

## Stopping the Server

Press **Ctrl+C** in the terminal to stop.

Or in another terminal:
```bash
kill $(lsof -t -i :3000)
```

---

## Troubleshooting

**Projects not appearing?**
- Make sure each project has a `README.md` file
- Use kebab-case for folder names: `my-project` (not `MyProject`)
- Restart the server

**Files not updating?**
- Check that files end with `.md`
- Reload the browser (though it should auto-update)

**Port already in use?**
- Change the port in `.env`: `PORT=3001`
- Or: `PORT=3001 npm start`

---

## Full Documentation

For detailed information, see **SETUP.md** for:
- Complete configuration guide
- API documentation
- Best practices for writing research
- Advanced features
- Troubleshooting guide

---

## That's All!

Your research portal is ready to go! 🎉

Start the server with `npm start` and enjoy browsing your research projects.
