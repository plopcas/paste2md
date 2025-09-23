// web-app.js - Standalone web version of Paste to Markdown / Markdown to Rich Text
// Adapted from the Chrome extension popup.js

(function() {
  'use strict';

  // DOM elements
  let pasteBtn, copyBtn, clearBtn, output, outputSection, errorSection, errorText, charCount, status, instructions, themeToggle, themeIcon, themeText;
  let modeToggle, modeIcon, mainTitle, subtitle, outputTitle, instructionsList, pasteBtnText, copyBtnText, richTextPreview, footerText;

  // Mode state
  const MODES = {
    PASTE2MD: 'paste2md',
    MD2RICH: 'md2rich'
  };

  let currentMode = MODES.PASTE2MD;

  // Initialize the web app
  document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    initializeTheme();
    initializeMode();
    updateUI();

    // Show a welcome message
    console.log('Paste to Markdown / Markdown to Rich Text web app loaded successfully!');
  });

  function initializeElements() {
    pasteBtn = document.getElementById('pasteBtn');
    copyBtn = document.getElementById('copyBtn');
    clearBtn = document.getElementById('clearBtn');
    output = document.getElementById('output');
    outputSection = document.getElementById('output-section');
    errorSection = document.getElementById('error-section');
    errorText = document.getElementById('error-text');
    charCount = document.getElementById('char-count');
    status = document.getElementById('status');
    instructions = document.getElementById('instructions');
    themeToggle = document.getElementById('themeToggle');
    themeIcon = document.querySelector('.theme-icon');
    themeText = document.querySelector('.theme-text');

    // New mode-related elements
    modeToggle = document.getElementById('modeToggle');
    modeIcon = document.querySelector('.mode-icon');
    mainTitle = document.getElementById('mainTitle');
    subtitle = document.getElementById('subtitle');
    outputTitle = document.getElementById('outputTitle');
    instructionsList = document.getElementById('instructionsList');
    pasteBtnText = document.getElementById('pasteBtnText');
    copyBtnText = document.getElementById('copyBtnText');
    richTextPreview = document.getElementById('richTextPreview');
    footerText = document.getElementById('footerText');
  }

  function setupEventListeners() {
    pasteBtn.addEventListener('click', handlePaste);
    copyBtn.addEventListener('click', handleCopy);
    clearBtn.addEventListener('click', handleClear);
    output.addEventListener('input', updateCharCount);
    themeToggle.addEventListener('click', handleThemeToggle);
    modeToggle.addEventListener('click', handleModeToggle);

    // Add keyboard shortcut support
    document.addEventListener('keydown', handleKeydown);
  }

  function updateUI() {
    const hasContent = output.value.trim().length > 0;
    copyBtn.disabled = !hasContent;
    clearBtn.disabled = !hasContent;

    if (hasContent) {
      outputSection.classList.remove('hidden');
      instructions.style.opacity = '0.7';

      // Show/hide appropriate output display based on mode
      if (currentMode === MODES.MD2RICH) {
        output.style.display = 'none';
        richTextPreview.classList.remove('hidden');
      } else {
        output.style.display = 'block';
        richTextPreview.classList.add('hidden');
      }
    } else {
      outputSection.classList.add('hidden');
      instructions.style.opacity = '1';
      richTextPreview.classList.add('hidden');
    }

    updateCharCount();
    hideError();
  }

  function displayRichText(markdown) {
    try {
      // Convert markdown to HTML using marked
      const html = marked.parse(markdown);
      richTextPreview.innerHTML = html;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      richTextPreview.innerHTML = '<p style="color: var(--error-color);">Error converting markdown to rich text.</p>';
    }
  }

  async function handlePaste() {
    try {
      setStatus('Reading clipboard...', 'loading');
      pasteBtn.disabled = true;

      // Check if the Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        // Fallback: show instructions for manual paste
        showManualPasteInstructions();
        return;
      }

      // Check clipboard permissions
      let permission;
      try {
        permission = await navigator.permissions.query({ name: 'clipboard-read' });
      } catch (e) {
        // Some browsers don't support permission query for clipboard
        console.log('Clipboard permission query not supported, trying direct access');
      }
      
      if (permission && permission.state === 'denied') {
        throw new Error('Clipboard access denied. Please allow clipboard permissions or use manual paste.');
      }

      // Read clipboard content
      let clipboardItems;
      try {
        clipboardItems = await navigator.clipboard.read();
      } catch (e) {
        // Fallback for browsers that don't support clipboard.read()
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            if (currentMode === MODES.MD2RICH) {
              // Markdown to Rich Text mode
              setStatus('Converting Markdown to Rich Text...', 'loading');
              output.value = text;
              displayRichText(text);
              setStatus('Conversion complete!', 'success');
              updateUI();
              return;
            } else {
              // Paste to Markdown mode
              const markdown = cleanupMarkdown(text);
              output.value = markdown;
              setStatus('Plain text processed!', 'success');
              updateUI();
              return;
            }
          }
        } catch (e2) {
          throw new Error('Unable to access clipboard. Please use manual paste or check browser permissions.');
        }
      }
      
      if (!clipboardItems || clipboardItems.length === 0) {
        throw new Error('Clipboard is empty');
      }

      let htmlContent = '';
      let textContent = '';

      // Get both HTML and text content from clipboard
      for (const clipboardItem of clipboardItems) {
        if (clipboardItem.types.includes('text/html') && !htmlContent) {
          const blob = await clipboardItem.getType('text/html');
          htmlContent = await blob.text();
        }
        if (clipboardItem.types.includes('text/plain') && !textContent) {
          const blob = await clipboardItem.getType('text/plain');
          textContent = await blob.text();
        }
      }

      // Convert based on current mode
      let result = '';
      if (currentMode === MODES.MD2RICH) {
        // Markdown to Rich Text mode
        if (textContent && textContent.trim()) {
          setStatus('Converting Markdown to Rich Text...', 'loading');
          result = textContent;
          displayRichText(result);
        } else {
          // More detailed error for debugging
          const availableTypes = clipboardItems.map(item => item.types.join(', ')).join(' | ');
          console.log('Clipboard debug - Available types:', availableTypes);
          console.log('Clipboard debug - Text content:', textContent);
          console.log('Clipboard debug - HTML content:', htmlContent);
          throw new Error(`No text content found in clipboard. Available types: ${availableTypes}. Please copy Markdown text.`);
        }
      } else {
        // Paste to Markdown mode (default)
        if (htmlContent) {
          setStatus('Converting HTML to Markdown...', 'loading');
          result = convertHtmlToMarkdown(htmlContent);
        } else if (textContent) {
          setStatus('Processing plain text...', 'loading');
          result = textContent; // Plain text doesn't need conversion
        } else {
          throw new Error('No text or HTML content found in clipboard');
        }

        // Clean up the markdown
        result = cleanupMarkdown(result);

        if (!result.trim()) {
          throw new Error('No content could be converted to Markdown');
        }
      }

      // Display the result
      output.value = result;
      setStatus('Conversion complete!', 'success');
      updateUI();

      // Auto-focus and select the output for easy copying
      setTimeout(() => {
        output.focus();
        output.select();
      }, 100);

    } catch (error) {
      console.error('Paste error:', error);
      showError(error.message);
      setStatus('', '');
    } finally {
      pasteBtn.disabled = false;
    }
  }

  function showManualPasteInstructions() {
    setStatus('', '');
    showError('Automatic clipboard access not available. Please manually paste your content into the text area below, then click "Convert" to process it.');
    
    // Show the output section for manual input
    outputSection.classList.remove('hidden');
    output.placeholder = 'Paste your rich text or HTML content here, then click "Convert" to process it...';
    output.focus();
    
    // Change the button text temporarily
    const originalText = pasteBtn.textContent;
    pasteBtn.textContent = '🔄 Convert';
    pasteBtn.disabled = false;
    
    // Set up one-time conversion handler
    const convertHandler = function() {
      if (output.value.trim()) {
        try {
          setStatus('Converting to Markdown...', 'loading');
          const markdown = convertHtmlToMarkdown(output.value);
          const cleanMarkdown = cleanupMarkdown(markdown);
          output.value = cleanMarkdown;
          setStatus('Conversion complete!', 'success');
          hideError();
          
          // Restore original button
          pasteBtn.textContent = originalText;
          pasteBtn.removeEventListener('click', convertHandler);
          pasteBtn.addEventListener('click', handlePaste);
        } catch (error) {
          showError('Conversion failed: ' + error.message);
          setStatus('', '');
        }
      } else {
        showError('Please paste some content first.');
      }
    };
    
    pasteBtn.removeEventListener('click', handlePaste);
    pasteBtn.addEventListener('click', convertHandler);
  }

  async function handleCopy() {
    try {
      setStatus('Copying to clipboard...', 'loading');
      copyBtn.disabled = true;

      if (currentMode === MODES.MD2RICH) {
        // Copy rich text (HTML) to clipboard
        if (navigator.clipboard && navigator.clipboard.write) {
          const html = richTextPreview.innerHTML;
          const plainText = richTextPreview.textContent || richTextPreview.innerText;

          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          });

          await navigator.clipboard.write([clipboardItem]);
          setStatus('Rich text copied to clipboard!', 'success');
        } else {
          // Fallback: copy plain text version
          const plainText = richTextPreview.textContent || richTextPreview.innerText;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(plainText);
            setStatus('Plain text copied to clipboard!', 'success');
          } else {
            throw new Error('Clipboard API not supported');
          }
        }
      } else {
        // Copy markdown text
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(output.value);
          setStatus('Copied to clipboard!', 'success');
        } else {
          // Fallback for older browsers
          output.select();
          document.execCommand('copy');
          setStatus('Copied to clipboard!', 'success');
        }
      }

      // Reset status after a delay
      setTimeout(() => {
        setStatus('', '');
      }, 2000);

    } catch (error) {
      console.error('Copy error:', error);
      showError('Failed to copy to clipboard. Please select the text and copy manually (Ctrl+C / ⌘+C).');

      // Select the text for manual copying
      output.focus();
      output.select();
    } finally {
      copyBtn.disabled = false;
    }
  }

  function handleClear() {
    output.value = '';
    richTextPreview.innerHTML = '';

    // Update placeholder based on current mode
    if (currentMode === MODES.MD2RICH) {
      output.placeholder = 'Paste your Markdown here...';
    } else {
      output.placeholder = 'Converted Markdown will appear here...';
    }

    updateUI();
    setStatus('', '');

    // Reset any manual paste mode
    const pasteBtnText = document.getElementById('pasteBtnText');
    if (pasteBtnText) {
      pasteBtnText.textContent = '📋 Paste & Convert';
    }
    pasteBtn.removeEventListener('click', arguments.callee);
    pasteBtn.addEventListener('click', handlePaste);
  }

  function handleKeydown(event) {
    // Handle Ctrl+V / Cmd+V for paste and convert
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      // Only trigger if we're not already focused on the output textarea
      if (document.activeElement !== output) {
        event.preventDefault();
        handlePaste();
      }
    }
    
    // Handle Ctrl+A / Cmd+A to select all text in output when it has content
    if ((event.ctrlKey || event.metaKey) && event.key === 'a' && output.value.trim()) {
      if (document.activeElement === output) {
        return; // Let default behavior happen
      } else {
        event.preventDefault();
        output.focus();
        output.select();
      }
    }
    
    // Handle Ctrl+C / Cmd+C to copy when output is focused and has content
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && output.value.trim()) {
      if (document.activeElement === output && window.getSelection().toString()) {
        return; // Let default copy behavior happen for selected text
      } else if (document.activeElement === output) {
        event.preventDefault();
        handleCopy();
      }
    }
    
    // Handle Escape to clear
    if (event.key === 'Escape' && output.value.trim()) {
      event.preventDefault();
      handleClear();
    }
  }

  function convertHtmlToMarkdown(html) {
    try {
      // Use the custom converters from the original clipboard2markdown
      const pandocConverters = getPandocConverters();
      
      // Convert using toMarkdown with custom converters
      const markdown = toMarkdown(html, { 
        converters: pandocConverters, 
        gfm: true 
      });

      return markdown;
    } catch (error) {
      console.error('Conversion error:', error);
      throw new Error('Failed to convert HTML to Markdown: ' + error.message);
    }
  }

  function getPandocConverters() {
    // Custom converters based on the original clipboard2markdown project
    return [
      {
        filter: 'h1',
        replacement: function(content, node) {
          const underline = Array(content.length + 1).join('=');
          return '\n\n' + content + '\n' + underline + '\n\n';
        }
      },
      {
        filter: 'h2',
        replacement: function(content, node) {
          const underline = Array(content.length + 1).join('-');
          return '\n\n' + content + '\n' + underline + '\n\n';
        }
      },
      {
        filter: 'sup',
        replacement: function(content) {
          return '^' + content + '^';
        }
      },
      {
        filter: 'sub',
        replacement: function(content) {
          return '~' + content + '~';
        }
      },
      {
        filter: 'br',
        replacement: function() {
          return '\\\n';
        }
      },
      {
        filter: 'hr',
        replacement: function() {
          return '\n\n* * * * *\n\n';
        }
      },
      {
        filter: ['em', 'i', 'cite', 'var'],
        replacement: function(content) {
          return '*' + content + '*';
        }
      },
      {
        filter: function(node) {
          const hasSiblings = node.previousSibling || node.nextSibling;
          const isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
          const isCodeElem = node.nodeName === 'CODE' ||
              node.nodeName === 'KBD' ||
              node.nodeName === 'SAMP' ||
              node.nodeName === 'TT';
          return isCodeElem && !isCodeBlock;
        },
        replacement: function(content) {
          return '`' + content + '`';
        }
      },
      {
        filter: function(node) {
          return node.nodeName === 'A' && node.getAttribute('href');
        },
        replacement: function(content, node) {
          const url = node.getAttribute('href');
          const titlePart = node.title ? ' "' + node.title + '"' : '';
          if (content === url) {
            return '<' + url + '>';
          } else if (url === ('mailto:' + content)) {
            return '<' + content + '>';
          } else {
            return '[' + content + '](' + url + titlePart + ')';
          }
        }
      },
      {
        filter: 'li',
        replacement: function(content, node) {
          content = content.replace(/^\s+/, '').replace(/\n/gm, '\n    ');
          let prefix = '-   ';
          const parent = node.parentNode;

          if (/ol/i.test(parent.nodeName)) {
            const index = Array.prototype.indexOf.call(parent.children, node) + 1;
            prefix = index + '. ';
            while (prefix.length < 4) {
              prefix += ' ';
            }
          }

          return prefix + content;
        }
      }
    ];
  }

  function cleanupMarkdown(markdown) {
    // Smart punctuation and cleanup (from original clipboard2markdown)
    return markdown
      .replace(/[\u2018\u2019\u00b4]/g, "'")
      .replace(/[\u201c\u201d\u2033]/g, '"')
      .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
      .replace(/[\u2013\u2015]/g, '--')
      .replace(/\u2014/g, '---')
      .replace(/\u2026/g, '...')
      .replace(/[ ]+\n/g, '\n')
      .replace(/\s*\\\n/g, '\\\n')
      .replace(/\s*\\\n\s*\\\n/g, '\n\n')
      .replace(/\s*\\\n\n/g, '\n\n')
      .replace(/\n-\n/g, '\n')
      .replace(/\n\n\s*\\\n/g, '\n\n')
      .replace(/\n\n\n*/g, '\n\n')
      .replace(/[ ]+$/gm, '')
      .replace(/^\s+|[\s\\]+$/g, '');
  }

  function updateCharCount() {
    const count = output.value.length;
    charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + (type || '');
  }

  function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
    setTimeout(() => {
      hideError();
    }, 8000); // Longer timeout for web version
  }

  function hideError() {
    errorSection.classList.add('hidden');
  }

  // Theme management functions
  const THEME_KEY = 'paste2md-theme';
  const THEMES = {
    AUTO: 'auto',
    LIGHT: 'light',
    DARK: 'dark'
  };

  const THEME_CONFIG = {
    [THEMES.AUTO]: { icon: '🌓', text: 'Auto' },
    [THEMES.LIGHT]: { icon: '☀️', text: 'Light' },
    [THEMES.DARK]: { icon: '🌙', text: 'Dark' }
  };

  function initializeTheme() {
    // Get saved theme or default to auto
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    updateThemeToggleUI(savedTheme);

    // Listen for system theme changes when in auto mode
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return Object.values(THEMES).includes(saved) ? saved : THEMES.AUTO;
    } catch (error) {
      console.warn('localStorage not available for theme persistence:', error);
      return THEMES.AUTO;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.warn('Unable to save theme to localStorage:', error);
    }
  }

  function applyTheme(theme) {
    // Apply the theme to the document element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add smooth transition class if not already present
    if (!document.documentElement.classList.contains('theme-transitioning')) {
      document.documentElement.classList.add('theme-transitioning');
      
      // Remove the class after transitions complete
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);
    }
  }

  function updateThemeToggleUI(currentTheme) {
    const config = THEME_CONFIG[currentTheme];
    if (config && themeIcon && themeText) {
      themeIcon.textContent = config.icon;
      themeIcon.setAttribute('data-theme', currentTheme);
      themeText.textContent = config.text;
      
      // Update the title attribute for accessibility
      themeToggle.title = `Current theme: ${config.text}. Click to switch theme.`;
    }
  }

  function handleThemeToggle() {
    const currentTheme = getSavedTheme();
    let nextTheme;

    // Cycle through themes: auto -> light -> dark -> auto
    switch (currentTheme) {
      case THEMES.AUTO:
        nextTheme = THEMES.LIGHT;
        break;
      case THEMES.LIGHT:
        nextTheme = THEMES.DARK;
        break;
      case THEMES.DARK:
        nextTheme = THEMES.AUTO;
        break;
      default:
        nextTheme = THEMES.AUTO;
    }

    saveTheme(nextTheme);
    applyTheme(nextTheme);
    updateThemeToggleUI(nextTheme);

    // Log theme change for debugging
    console.log(`Theme changed from ${currentTheme} to ${nextTheme}`);
  }

  function handleSystemThemeChange(mediaQuery) {
    // Only respond to system theme changes if we're in auto mode
    const currentTheme = getSavedTheme();
    if (currentTheme === THEMES.AUTO) {
      // Re-apply auto theme to trigger CSS updates
      applyTheme(THEMES.AUTO);
      console.log(`System theme changed, auto theme updated (dark: ${mediaQuery.matches})`);
    }
  }

  // Mode management functions
  const MODE_KEY = 'paste2md-mode';

  function initializeMode() {
    const savedMode = getSavedMode();
    currentMode = savedMode;
    applyMode(currentMode);
    updateModeUI();
  }

  function getSavedMode() {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      return Object.values(MODES).includes(saved) ? saved : MODES.PASTE2MD;
    } catch (e) {
      return MODES.PASTE2MD;
    }
  }

  function saveMode(mode) {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch (e) {
      console.warn('Could not save mode preference:', e);
    }
  }

  function applyMode(mode) {
    document.documentElement.setAttribute('data-mode', mode);
  }

  function handleModeToggle() {
    const newMode = currentMode === MODES.PASTE2MD ? MODES.MD2RICH : MODES.PASTE2MD;
    currentMode = newMode;
    saveMode(newMode);
    applyMode(newMode);
    updateModeUI();

    // Clear output when switching modes
    handleClear();
  }

  function updateModeUI() {
    if (currentMode === MODES.MD2RICH) {
      // Markdown to Rich Text mode
      mainTitle.textContent = 'Paste to Rich Text';
      subtitle.textContent = 'Convert Markdown to formatted rich text instantly';
      outputTitle.textContent = 'Converted Rich Text:';
      pasteBtnText.textContent = '📋 Paste & Convert';
      copyBtnText.textContent = '📄 Copy Rich Text';
      output.placeholder = 'Paste your Markdown here...';

      // Update instructions
      instructionsList.innerHTML = `
        <li>Copy Markdown text from any source (files, editors, etc.)</li>
        <li>Click "Paste & Convert" below or press <code>Ctrl+V</code> / <code>⌘+V</code></li>
        <li>The converted rich text will appear below</li>
        <li>Click "Copy Rich Text" to copy the formatted result</li>
      `;

      // Update footer
      footerText.innerHTML = `
        Powered by <a href="https://github.com/markedjs/marked" target="_blank" rel="noopener">marked</a>
        • Based on <a href="https://github.com/euangoddard/clipboard2markdown" target="_blank" rel="noopener">clipboard2markdown</a>
      `;
    } else {
      // Paste to Markdown mode (default)
      mainTitle.textContent = 'Paste to Markdown';
      subtitle.textContent = 'Convert rich text to Markdown format instantly';
      outputTitle.textContent = 'Converted Markdown:';
      pasteBtnText.textContent = '📋 Paste & Convert';
      copyBtnText.textContent = '📄 Copy Markdown';
      output.placeholder = 'Converted Markdown will appear here...';

      // Update instructions
      instructionsList.innerHTML = `
        <li>Copy rich text from any source (websites, documents, emails, etc.)</li>
        <li>Click "Paste & Convert" below or press <code>Ctrl+V</code> / <code>⌘+V</code></li>
        <li>The converted Markdown will appear in the text area</li>
        <li>Click "Copy Markdown" or press <code>Ctrl+C</code> / <code>⌘+C</code> to copy the result</li>
      `;

      // Update footer
      footerText.innerHTML = `
        Powered by <a href="https://github.com/domchristie/to-markdown" target="_blank" rel="noopener">to-markdown</a>
        • Based on <a href="https://github.com/euangoddard/clipboard2markdown" target="_blank" rel="noopener">clipboard2markdown</a>
      `;
    }
  }

  // Expose theme functions for debugging (optional)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.themeDebug = {
      getCurrentTheme: getSavedTheme,
      setTheme: (theme) => {
        if (Object.values(THEMES).includes(theme)) {
          saveTheme(theme);
          applyTheme(theme);
          updateThemeToggleUI(theme);
        }
      },
      themes: THEMES
    };
  }

})();
