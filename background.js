// Background service worker for Paste to Markdown extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Paste to Markdown extension installed');
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // Open the extension popup
    chrome.action.openPopup();
    sendResponse({ success: true });
  }

  return true; // Keep the message channel open for async response
});
