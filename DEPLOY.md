# Deployment Guide - Paste to Markdown Web App

This guide explains how to deploy the standalone web version of Paste to Markdown to GitHub Pages.

## Quick Deployment to GitHub Pages

### 1. **Create a GitHub Repository**

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `paste2md` (or any name you prefer)
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README (we'll push our existing code)

### 2. **Push Your Code**

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit: Paste to Markdown web app and Chrome extension"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOURUSERNAME/paste2md.git

# Push to GitHub
git push -u origin main
```

### 3. **Enable GitHub Pages**

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

### 4. **Update Configuration**

Edit `_config.yml` and update:
```yaml
url: "https://YOURUSERNAME.github.io"
baseurl: "/paste2md"  # Use your actual repo name
github_username: YOURUSERNAME
```

Edit `index.html` and update the Open Graph URL:
```html
<meta property="og:url" content="https://YOURUSERNAME.github.io/paste2md/">
```

### 5. **Access Your Site**

Your web app will be available at:
```
https://YOURUSERNAME.github.io/paste2md/
```

GitHub Pages typically takes 5-10 minutes to deploy after pushing changes.

## File Structure for Web Deployment

The web app uses these files:
```
paste2md/
├── index.html            # Main web app page
├── web-app.js           # Web app JavaScript logic
├── to-markdown.js       # Conversion library (shared with extension)
├── _config.yml          # GitHub Pages configuration
├── DEPLOY.md           # This deployment guide
└── README.md           # Main documentation
```

**Extension-only files** (automatically excluded from web deployment):
- `manifest.json`, `popup.html`, `popup.js`, `popup.css`
- `background.js`, `content.js`
- `INSTALL.md`, `test.html`

## Features of the Web Version

### ✅ **Same Functionality as Extension**
- Convert rich text/HTML to Markdown
- Support for all formatting (headers, lists, tables, links, etc.)
- Keyboard shortcuts (Ctrl+V, Ctrl+C, Ctrl+A, Escape)
- Error handling and user feedback

### ✅ **Web-Specific Enhancements**
- **Responsive design** - works on mobile and desktop
- **Fallback support** - manual paste if clipboard API unavailable
- **Better accessibility** - proper semantic HTML
- **SEO optimized** - meta tags, Open Graph, structured data
- **No installation required** - just visit the URL

### ✅ **Browser Compatibility**
- **Modern browsers**: Full clipboard API support
- **Older browsers**: Fallback to manual paste/copy
- **Mobile browsers**: Touch-friendly interface
- **All platforms**: Windows, Mac, Linux, iOS, Android

## Customization Options

### **Branding**
- Update the title and description in `index.html`
- Modify colors in the CSS variables
- Add your own logo or favicon

### **Analytics** (Optional)
Add Google Analytics to `_config.yml`:
```yaml
google_analytics: UA-XXXXXXXX-X
```

### **Custom Domain** (Optional)
1. Add a `CNAME` file with your domain:
   ```
   paste2md.yourdomain.com
   ```
2. Configure DNS with your domain provider
3. Update the URL in `_config.yml`

## Maintenance

### **Updating the Web App**
1. Make changes to your local files
2. Test locally by opening `index.html` in a browser
3. Commit and push changes:
   ```bash
   git add .
   git commit -m "Update web app"
   git push
   ```
4. GitHub Pages will automatically redeploy

### **Syncing with Extension**
The `to-markdown.js` file is shared between the web app and extension. When you update the conversion logic:
1. Test both versions
2. Update version numbers if needed
3. Deploy both the web app and extension updates

## Troubleshooting

### **Site Not Loading**
- Check GitHub Pages settings in repository
- Ensure repository is public
- Wait 5-10 minutes for deployment
- Check for errors in repository's Actions tab

### **Clipboard Not Working**
- Modern browsers require HTTPS for clipboard API
- GitHub Pages provides HTTPS automatically
- Fallback manual paste should work in all browsers

### **Styling Issues**
- Test in multiple browsers
- Check browser console for CSS errors
- Ensure all CSS variables are defined

## Security and Privacy

The web app:
- ✅ **Processes everything locally** - no data sent to servers
- ✅ **No tracking** - respects user privacy
- ✅ **Open source** - all code is visible and auditable
- ✅ **HTTPS only** - secure connection required for clipboard access

## Support

If you encounter issues:
1. Check the browser console for errors
2. Try the manual paste fallback
3. Test in a different browser
4. Check GitHub Pages status
5. Open an issue in the GitHub repository
