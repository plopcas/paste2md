// web-app.js - Standalone web version of Paste to Markdown
// Adapted from the Chrome extension popup.js

(function() {
  'use strict';

  // DOM elements
  let pasteBtn, copyBtn, clearBtn, output, outputSection, errorSection, errorText, charCount, status, instructions;

  // Initialize the web app
  document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    updateUI();
    
    // Show a welcome message
    console.log('Paste to Markdown web app loaded successfully!');
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
  }

  function setupEventListeners() {
    pasteBtn.addEventListener('click', handlePaste);
    copyBtn.addEventListener('click', handleCopy);
    clearBtn.addEventListener('click', handleClear);
    output.addEventListener('input', updateCharCount);
    
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
    } else {
      outputSection.classList.add('hidden');
      instructions.style.opacity = '1';
    }
    
    updateCharCount();
    hideError();
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
          if (text) {
            const markdown = cleanupMarkdown(text);
            output.value = markdown;
            setStatus('Plain text processed!', 'success');
            updateUI();
            return;
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

      // Try to get HTML content first, fall back to text
      for (const clipboardItem of clipboardItems) {
        if (clipboardItem.types.includes('text/html')) {
          const blob = await clipboardItem.getType('text/html');
          htmlContent = await blob.text();
          break;
        } else if (clipboardItem.types.includes('text/plain')) {
          const blob = await clipboardItem.getType('text/plain');
          textContent = await blob.text();
        }
      }

      // Convert to markdown
      let markdown = '';
      if (htmlContent) {
        setStatus('Converting HTML to Markdown...', 'loading');
        markdown = convertHtmlToMarkdown(htmlContent);
      } else if (textContent) {
        setStatus('Processing plain text...', 'loading');
        markdown = textContent; // Plain text doesn't need conversion
      } else {
        throw new Error('No text or HTML content found in clipboard');
      }

      // Clean up the markdown
      markdown = cleanupMarkdown(markdown);

      if (!markdown.trim()) {
        throw new Error('No content could be converted to Markdown');
      }

      // Display the result
      output.value = markdown;
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

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(output.value);
        setStatus('Copied to clipboard!', 'success');
      } else {
        // Fallback for older browsers
        output.select();
        document.execCommand('copy');
        setStatus('Copied to clipboard!', 'success');
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
    output.placeholder = 'Converted Markdown will appear here...';
    updateUI();
    setStatus('', '');
    
    // Reset any manual paste mode
    pasteBtn.textContent = '📋 Paste & Convert';
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

})();
