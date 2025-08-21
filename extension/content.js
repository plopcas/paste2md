// Content script for Paste to Markdown extension
// This script runs on all web pages and can interact with page content

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    const selectedHTML = getSelectedHTML();
    
    sendResponse({
      text: selectedText,
      html: selectedHTML
    });
  }
  
  return true;
});

// Helper function to get selected HTML content
function getSelectedHTML() {
  let html = '';
  const selection = window.getSelection();
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const clonedSelection = range.cloneContents();
    const div = document.createElement('div');
    div.appendChild(clonedSelection);
    html = div.innerHTML;
  }
  
  return html;
}

// Fallback keyboard shortcut listener (in case commands API doesn't work)
document.addEventListener('keydown', (event) => {
  // Use platform-specific modifier keys:
  // - Mac: Cmd+Shift+M (metaKey + shiftKey + M)
  // - Windows/Linux: Ctrl+Shift+M (ctrlKey + shiftKey + M)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const correctModifier = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;

  if (correctModifier && event.shiftKey && event.key === 'M') {
    event.preventDefault();

    // Send message to background script to open popup
    chrome.runtime.sendMessage({
      action: 'openPopup'
    });
  }
});

console.log('Paste to Markdown content script loaded');
