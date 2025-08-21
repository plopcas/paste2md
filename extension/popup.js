// popup.js - Main logic for the Paste to Markdown Chrome extension

(function() {
  'use strict';

  // DOM elements
  let pasteBtn, copyBtn, clearBtn, output, outputSection, errorSection, errorText, charCount, status, instructions;

  // Initialize the popup
  document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    updateUI();
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
      instructions.classList.add('hidden');
    } else {
      outputSection.classList.add('hidden');
      instructions.classList.remove('hidden');
    }
    
    updateCharCount();
    hideError();
  }

  async function handlePaste() {
    try {
      setStatus('Reading clipboard...', 'loading');
      pasteBtn.disabled = true;

      // Check if we have clipboard read permission
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });
      
      if (permission.state === 'denied') {
        throw new Error('Clipboard access denied. Please allow clipboard permissions for this extension.');
      }

      // Read clipboard content
      let clipboardItems;
      let htmlContent = '';
      let textContent = '';

      try {
        clipboardItems = await navigator.clipboard.read();

        if (clipboardItems.length === 0) {
          throw new Error('Clipboard is empty');
        }

        // Try to get HTML content first, fall back to text
        for (const clipboardItem of clipboardItems) {
          if (clipboardItem.types.includes('text/html') && !htmlContent) {
            const blob = await clipboardItem.getType('text/html');
            htmlContent = await blob.text();
          }
          if (clipboardItem.types.includes('text/plain') && !textContent) {
            const blob = await clipboardItem.getType('text/plain');
            textContent = await blob.text();
          }

          // If we have both, we can break early
          if (htmlContent && textContent) {
            break;
          }
        }
      } catch (clipboardError) {
        // Fallback to readText() for browsers that don't support read()
        console.log('clipboard.read() failed, trying readText():', clipboardError);
        try {
          textContent = await navigator.clipboard.readText();
        } catch (textError) {
          console.log('clipboard.readText() also failed:', textError);
          throw new Error('Unable to access clipboard. Please check browser permissions or try copying the content again.');
        }
      }

      // Debug logging
      console.log('Clipboard content found:', {
        hasHtml: !!htmlContent,
        hasText: !!textContent,
        htmlLength: htmlContent?.length || 0,
        textLength: textContent?.length || 0
      });

      // Convert to markdown
      let markdown = '';
      if (htmlContent && htmlContent.trim()) {
        setStatus('Converting HTML to Markdown...', 'loading');
        markdown = convertHtmlToMarkdown(htmlContent);
      } else if (textContent && textContent.trim()) {
        setStatus('Processing plain text...', 'loading');
        markdown = textContent; // Plain text doesn't need conversion
      } else {
        // More specific error message
        const clipboardInfo = [];
        if (clipboardItems) {
          for (const item of clipboardItems) {
            clipboardInfo.push(`Types: ${item.types.join(', ')}`);
          }
        }
        const debugInfo = clipboardInfo.length > 0 ? ` Available types: ${clipboardInfo.join('; ')}` : '';
        throw new Error(`No text or HTML content found in clipboard.${debugInfo} Try copying the content again.`);
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

    } catch (error) {
      console.error('Paste error:', error);

      // If it's a clipboard access issue, offer manual paste option
      if (error.message.includes('clipboard') || error.message.includes('permission')) {
        showManualPasteOption();
      } else {
        showError(error.message);
      }
      setStatus('', '');
    } finally {
      pasteBtn.disabled = false;
    }
  }

  async function handleCopy() {
    try {
      setStatus('Copying to clipboard...', 'loading');
      copyBtn.disabled = true;

      await navigator.clipboard.writeText(output.value);
      setStatus('Copied to clipboard!', 'success');

      // Reset status after a delay
      setTimeout(() => {
        setStatus('', '');
      }, 2000);

    } catch (error) {
      console.error('Copy error:', error);
      showError('Failed to copy to clipboard: ' + error.message);
    } finally {
      copyBtn.disabled = false;
    }
  }

  function handleClear() {
    output.value = '';
    updateUI();
    setStatus('', '');
  }

  function handleKeydown(event) {
    // Handle Ctrl+V / Cmd+V for paste and convert
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      // Only trigger if we're not already focused on the output textarea
      // (to allow normal pasting in the output area)
      if (document.activeElement !== output) {
        event.preventDefault();
        handlePaste();
      }
    }

    // Handle Ctrl+A / Cmd+A to select all text in output when it has content
    if ((event.ctrlKey || event.metaKey) && event.key === 'a' && output.value.trim()) {
      if (document.activeElement === output) {
        // Let the default behavior happen (select all in textarea)
        return;
      } else {
        // Focus the output and select all
        event.preventDefault();
        output.focus();
        output.select();
      }
    }

    // Handle Ctrl+C / Cmd+C to copy when output is focused and has content
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && output.value.trim()) {
      if (document.activeElement === output && window.getSelection().toString()) {
        // Let default copy behavior happen for selected text
        return;
      } else if (document.activeElement === output) {
        // Copy all content if nothing is selected
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
    }, 5000);
  }

  function hideError() {
    errorSection.classList.add('hidden');
  }

  function showManualPasteOption() {
    showError('Clipboard access failed. You can manually paste content into the text area below and click "Convert".');

    // Show the output section for manual input
    outputSection.classList.remove('hidden');
    instructions.classList.add('hidden');
    output.placeholder = 'Paste your content here (Ctrl+V / ⌘+V), then click "Convert"...';
    output.focus();

    // Change button text temporarily
    const originalText = pasteBtn.textContent;
    pasteBtn.textContent = '🔄 Convert';

    // Set up one-time manual conversion
    const handleManualConvert = () => {
      if (output.value.trim()) {
        try {
          setStatus('Converting...', 'loading');
          let markdown = output.value;

          // Try to detect if it's HTML
          if (output.value.includes('<') && output.value.includes('>')) {
            markdown = convertHtmlToMarkdown(output.value);
          }

          markdown = cleanupMarkdown(markdown);
          output.value = markdown;
          setStatus('Conversion complete!', 'success');

          // Restore button
          pasteBtn.textContent = originalText;
          pasteBtn.removeEventListener('click', handleManualConvert);
          pasteBtn.addEventListener('click', handlePaste);
          output.placeholder = '';
          hideError();

        } catch (error) {
          showError('Conversion failed: ' + error.message);
        }
      } else {
        showError('Please paste some content first.');
      }
    };

    // Replace the click handler temporarily
    pasteBtn.removeEventListener('click', handlePaste);
    pasteBtn.addEventListener('click', handleManualConvert);
  }

})();
