# Paste to Markdown

Convert rich text from your clipboard to Markdown format with a single click. Available as both a **Chrome extension** and a **standalone web app**.

## 🌐 **[Try the Web App](https://plopcas.github.io/paste2md/)** | 🔧 **[Install Chrome Extension](#two-ways-to-use)**

## Features

- 📋 **One-click conversion**: Paste rich text and convert to Markdown instantly
- 🎨 **Rich text support**: Handles formatted text, links, images, tables, and more
- 📄 **Easy copying**: Copy the converted Markdown back to clipboard
- 🌙 **Dark mode support**: Automatically adapts to your system theme
- ⌨️ **Keyboard shortcuts**: Quick access with Ctrl+Shift+M (or Cmd+Shift+M on Mac)
- 🔄 **Context menu**: Right-click access for quick conversion

## Two Ways to Use

### 🌐 **Web App** (Recommended)
**No installation required!** Use it directly in your browser:

**👉 [Live Demo](https://plopcas.github.io/paste2md/)** *(or your deployed GitHub Pages URL)*

- ✅ Works on any device (desktop, mobile, tablet)
- ✅ No browser restrictions
- ✅ Always up-to-date
- ✅ Same features as the extension

### 🔧 **Chrome Extension**
For users who prefer a browser extension:

#### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension/` folder
5. The extension icon will appear in your toolbar

📖 **Detailed installation guide**: See [docs/INSTALL.md](docs/INSTALL.md) for complete setup instructions and troubleshooting.

#### From Chrome Web Store
*Coming soon...*

## Usage

1. **Copy rich text** from any source (websites, documents, emails, etc.)
2. **Click the extension icon** in your Chrome toolbar
3. **Convert the content** using either:
   - Click "Paste & Convert" button, OR
   - Press `Ctrl+V` / `⌘+V` anywhere in the popup
4. **Copy the result** using either:
   - Click "Copy Markdown" button, OR
   - Press `Ctrl+C` / `⌘+C` when the output area is focused
5. **Paste the Markdown** wherever you need it!

### Keyboard Shortcuts
- **Open extension**: `Ctrl+Shift+M` / `Cmd+Shift+M` (on any webpage)
- **Paste & Convert**: `Ctrl+V` / `⌘+V` (in popup)
- **Select all output**: `Ctrl+A` / `⌘+A` (in popup)
- **Copy result**: `Ctrl+C` / `⌘+C` (when output is focused)
- **Clear output**: `Escape` (in popup)

## Supported Formats

The extension can convert:
- **Text formatting**: Bold, italic, strikethrough
- **Headings**: H1-H6
- **Links**: Both inline and reference-style
- **Images**: With alt text and titles
- **Lists**: Ordered and unordered, including nested lists
- **Tables**: With proper alignment
- **Code**: Inline code and code blocks
- **Blockquotes**: Single and nested
- **Line breaks**: Proper paragraph and line break handling

## Technical Details

This extension is based on the excellent [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown) web tool by Euan Goddard, adapted for Chrome extension format.

### Core Technologies
- **Conversion engine**: [to-markdown](https://github.com/domchristie/to-markdown) by Dom Christie
- **Extension framework**: Chrome Extension Manifest V3
- **Clipboard API**: Modern browser clipboard access

## Development

## Deployment

### 🌐 **Deploy Web App to GitHub Pages**
See [docs/DEPLOY.md](docs/DEPLOY.md) for complete deployment instructions.

Quick steps:
1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Your web app will be live at `https://USERNAME.github.io/REPOSITORY-NAME/`

### Project Structure
```
paste2md/
├── index.html              # 🌐 Web app main page
├── web-app.js             # 🌐 Web app logic
├── _config.yml            # 🌐 GitHub Pages config
├── README.md              # 📖 This file
├── extension/             # 🔧 Chrome Extension files
│   ├── manifest.json      # 🔧 Extension manifest
│   ├── popup.html         # 🔧 Extension popup UI
│   ├── popup.js           # 🔧 Extension logic
│   ├── popup.css          # 🔧 Extension styling
│   ├── background.js      # 🔧 Extension service worker
│   └── content.js         # 🔧 Extension content script
├── lib/                   # 📚 Shared libraries
│   └── to-markdown.js     # 📚 Conversion library
├── docs/                  # 📖 Documentation
│   ├── DEPLOY.md          # 🌐 Deployment guide
│   └── INSTALL.md         # 🔧 Extension installation guide
└── tests/                 # 🧪 Test files
    ├── test.html          # 🧪 Test page with sample content
    ├── test-shortcuts.html # 🧪 Keyboard shortcuts test
    └── clipboard-test.html # 🧪 Clipboard functionality test
```

🌐 = Web app files | 🔧 = Extension files | 📚 = Shared | 📖 = Documentation | 🧪 = Testing

### Building
No build process required - this is a pure JavaScript extension.

## License

MIT License - see the original [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown) project for details.

## Credits

- Original web tool: [Euan Goddard](https://github.com/euangoddard)
- Conversion library: [Dom Christie](https://github.com/domchristie)
- Chrome extension adaptation: This project
