# Installation Guide - Paste to Markdown Chrome Extension

## Quick Start

### 1. Load the Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** by toggling the switch in the top right corner
3. **Click "Load unpacked"** button
4. **Select the `extension/` folder** (the folder containing `manifest.json`)
5. The extension should now appear in your extensions list and toolbar

### 2. Grant Permissions

When you first use the extension, Chrome will ask for clipboard permissions:
- Click **"Allow"** when prompted for clipboard access
- This is required for the extension to read and write clipboard content

### 3. Test the Extension

1. **Open the test page**: Open `test.html` in your browser
2. **Copy some content**: Select and copy (Ctrl+C / ⌘+C) any formatted text
3. **Open the extension**: Click the extension icon in your toolbar
4. **Convert**: Click "Paste & Convert" to convert the content to Markdown
5. **Copy result**: Click "Copy Markdown" to copy the converted text

## Troubleshooting

### Extension Not Loading
- Make sure you selected the correct folder (containing `manifest.json`)
- Check the Chrome console for any error messages
- Ensure all required files are present

### Clipboard Access Denied
- Go to `chrome://settings/content/clipboard`
- Make sure the extension has clipboard permissions
- Try reloading the extension and granting permissions again

### Conversion Not Working
- Make sure you have HTML or rich text content in your clipboard
- Plain text will be passed through without conversion
- Check the browser console for error messages



## Features

### Supported Content Types
- **Rich text** from web pages, documents, emails
- **HTML content** with formatting
- **Plain text** (passed through unchanged)

### Supported Markdown Elements
- Headers (H1-H6)
- Bold and italic text
- Links (with titles)
- Images (with alt text)
- Lists (ordered and unordered, including nested)
- Code blocks and inline code
- Blockquotes
- Tables
- Horizontal rules
- Strikethrough text

### Keyboard Shortcuts
- **Ctrl+Shift+M** (or **Cmd+Shift+M** on Mac): Open extension popup

## Development

### File Structure
```
paste2md/
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and conversion
├── popup.css             # Popup styling
├── background.js         # Background service worker
├── content.js            # Content script
├── to-markdown.js        # Core conversion library
├── test.html             # Test page with sample content
├── README.md             # Main documentation
└── INSTALL.md           # This file
```

### Making Changes
1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test your changes

### Debugging
- **Popup issues**: Right-click the extension icon → "Inspect popup"
- **Background script**: Go to `chrome://extensions/` → Click "background page"
- **Content script**: Use browser developer tools on any webpage

## Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Would need adaptation for Manifest V2
- **Safari**: Would need significant changes

## Privacy

This extension:
- ✅ Only accesses clipboard when you click "Paste & Convert"
- ✅ Processes all data locally in your browser
- ✅ Does not send any data to external servers
- ✅ Does not store any personal information
- ✅ Open source - you can review all code

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Look at the browser console for error messages
3. Try reloading the extension
4. Make sure you have the latest version of Chrome
