// to-markdown.js - HTML to Markdown converter for Chrome Extension
// Simplified version adapted from the original to-markdown library

window.toMarkdown = (function() {
  'use strict';

  // Block-level elements
  var blocks = ['address', 'article', 'aside', 'audio', 'blockquote', 'body',
    'canvas', 'center', 'dd', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'header', 'hgroup', 'hr', 'html', 'isindex', 'li', 'main', 'menu', 'nav',
    'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
    'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
  ];

  // Void elements
  var voids = [
    'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
    'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];

  function isBlock(node) {
    return blocks.indexOf(node.nodeName.toLowerCase()) !== -1;
  }

  function isVoid(node) {
    return voids.indexOf(node.nodeName.toLowerCase()) !== -1;
  }

  // Basic converters for common HTML elements
  var converters = [
    // Paragraphs
    {
      filter: 'p',
      replacement: function(content, node) {
        // Check if this paragraph is inside a list item
        var parent = node.parentNode;
        while (parent) {
          if (parent.nodeName === 'LI') {
            // Inside a list item - don't add extra spacing
            return content;
          }
          parent = parent.parentNode;
        }
        // Regular paragraph - add normal spacing
        return '\n\n' + content + '\n\n';
      }
    },

    // Line breaks
    {
      filter: 'br',
      replacement: function() {
        return '  \n';
      }
    },

    // Headings
    {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      replacement: function(content, node) {
        var hLevel = node.nodeName.charAt(1);
        var hPrefix = '';
        for (var i = 0; i < hLevel; i++) {
          hPrefix += '#';
        }
        return '\n\n' + hPrefix + ' ' + content + '\n\n';
      }
    },

    // Horizontal rules
    {
      filter: 'hr',
      replacement: function() {
        return '\n\n* * *\n\n';
      }
    },

    // Emphasis
    {
      filter: ['em', 'i'],
      replacement: function(content) {
        return '_' + content + '_';
      }
    },

    // Strong
    {
      filter: ['strong', 'b'],
      replacement: function(content) {
        return '**' + content + '**';
      }
    },

    // Strikethrough (GitHub Flavored Markdown)
    {
      filter: ['del', 's', 'strike'],
      replacement: function(content) {
        return '~~' + content + '~~';
      }
    },

    // Inline code
    {
      filter: function(node) {
        var hasSiblings = node.previousSibling || node.nextSibling;
        var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
        return node.nodeName === 'CODE' && !isCodeBlock;
      },
      replacement: function(content) {
        return '`' + content + '`';
      }
    },

    // Links
    {
      filter: function(node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function(content, node) {
        var href = node.getAttribute('href');
        var title = node.title ? ' "' + node.title + '"' : '';
        if (content === href) {
          return '<' + href + '>';
        } else if (href === ('mailto:' + content)) {
          return '<' + content + '>';
        } else {
          return '[' + content + '](' + href + title + ')';
        }
      }
    },

    // Images
    {
      filter: 'img',
      replacement: function(content, node) {
        var alt = node.alt || '';
        var src = node.getAttribute('src') || '';
        var title = node.title || '';
        var titlePart = title ? ' "' + title + '"' : '';
        return src ? '![' + alt + '](' + src + titlePart + ')' : '';
      }
    },

    // Code blocks
    {
      filter: function(node) {
        return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
      },
      replacement: function(content, node) {
        return '\n\n```\n' + node.firstChild.textContent + '\n```\n\n';
      }
    },

    // Blockquotes
    {
      filter: 'blockquote',
      replacement: function(content) {
        content = content.trim();
        content = content.replace(/\n{3,}/g, '\n\n');
        content = content.replace(/^/gm, '> ');
        return '\n\n' + content + '\n\n';
      }
    },

    // List items
    {
      filter: 'li',
      replacement: function(content, node) {
        // Clean up content - remove extra whitespace and newlines
        content = content.replace(/^\s+/, '').replace(/\s+$/, '');
        // Remove excessive newlines that might come from paragraph processing
        content = content.replace(/\n\n+/g, '\n');
        // Indent nested content properly
        content = content.replace(/\n/gm, '\n    ');

        var prefix = '*   ';
        var parent = node.parentNode;
        var index = Array.prototype.indexOf.call(parent.children, node) + 1;
        prefix = /ol/i.test(parent.nodeName) ? index + '.  ' : '*   ';
        return prefix + content;
      }
    },

    // Lists
    {
      filter: ['ul', 'ol'],
      replacement: function(content, node) {
        var strings = [];
        for (var i = 0; i < node.childNodes.length; i++) {
          if (node.childNodes[i]._replacement) {
            // Clean up any extra whitespace from list items
            var item = node.childNodes[i]._replacement.trim();
            if (item) {
              strings.push(item);
            }
          }
        }

        // Join list items with single newlines (no extra spacing)
        var listContent = strings.join('\n');

        if (/li/i.test(node.parentNode.nodeName)) {
          // Nested list
          return '\n' + listContent;
        }
        // Top-level list - add spacing before and after
        return '\n\n' + listContent + '\n\n';
      }
    },

    // Tables
    {
      filter: 'table',
      replacement: function(content) {
        return '\n\n' + content + '\n\n';
      }
    },

    {
      filter: ['thead', 'tbody', 'tfoot'],
      replacement: function(content) {
        return content;
      }
    },

    {
      filter: 'tr',
      replacement: function(content, node) {
        var borderCells = '';
        if (node.parentNode.nodeName === 'THEAD') {
          for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName === 'TH' || node.childNodes[i].nodeName === 'TD') {
              borderCells += '| --- ';
            }
          }
          borderCells += '|';
        }
        return '\n' + content + (borderCells ? '\n' + borderCells : '');
      }
    },

    {
      filter: ['th', 'td'],
      replacement: function(content, node) {
        var index = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
        var prefix = ' ';
        if (index === 0) prefix = '| ';
        return prefix + content + ' |';
      }
    },

    // Block elements
    {
      filter: function(node) {
        return isBlock(node);
      },
      replacement: function(content) {
        return '\n\n' + content + '\n\n';
      }
    },

    // Default fallback
    {
      filter: function() {
        return true;
      },
      replacement: function(content) {
        return content;
      }
    }
  ];

  // Helper functions
  function getContent(node) {
    var text = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType === 1) {
        text += node.childNodes[i]._replacement || '';
      } else if (node.childNodes[i].nodeType === 3) {
        text += node.childNodes[i].data;
      }
    }
    return text;
  }

  function canConvert(node, filter) {
    if (typeof filter === 'string') {
      return filter === node.nodeName.toLowerCase();
    }
    if (Array.isArray(filter)) {
      return filter.indexOf(node.nodeName.toLowerCase()) !== -1;
    } else if (typeof filter === 'function') {
      return filter.call(null, node);
    }
    return false;
  }

  function process(node) {
    var replacement = '';
    var content = getContent(node);

    // Remove blank nodes
    if (!isVoid(node) && !/A|TH|TD/.test(node.nodeName) && /^\s*$/i.test(content)) {
      node._replacement = '';
      return;
    }

    for (var i = 0; i < converters.length; i++) {
      var converter = converters[i];
      if (canConvert(node, converter.filter)) {
        replacement = converter.replacement.call(null, content, node);
        break;
      }
    }

    node._replacement = replacement;
  }

  function bfsOrder(node) {
    var inqueue = [node];
    var outqueue = [];
    var elem, children, i;

    while (inqueue.length > 0) {
      elem = inqueue.shift();
      outqueue.push(elem);
      children = elem.childNodes;
      for (i = 0; i < children.length; i++) {
        if (children[i].nodeType === 1) inqueue.push(children[i]);
      }
    }
    outqueue.shift();
    return outqueue;
  }

  function htmlToDom(string) {
    var doc = document.implementation.createHTMLDocument('');
    doc.open();
    doc.write(string);
    doc.close();
    return doc;
  }

  // Main conversion function
  function toMarkdown(input, options) {
    options = options || {};

    if (typeof input !== 'string') {
      throw new TypeError(input + ' is not a string');
    }

    // Escape potential ol triggers
    input = input.replace(/(>[\r\n\s]*)(\d+)\.(&nbsp;| )/g, '$1$2\\.$3');

    var clone = htmlToDom(input).body;
    var nodes = bfsOrder(clone);

    // Process through nodes in reverse (so deepest child elements are first)
    for (var i = nodes.length - 1; i >= 0; i--) {
      process(nodes[i]);
    }

    var output = getContent(clone);

    return output.replace(/^[\t\r\n]+|[\t\r\n\s]+$/g, '')
      .replace(/\n\s+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      // Fix list spacing - remove extra newlines between list items
      .replace(/(\n[*\-+].*)\n\n(\n[*\-+])/g, '$1\n$2')
      .replace(/(\n\d+\..*)\n\n(\n\d+\.)/g, '$1\n$2');
  }

  return toMarkdown;
})();
