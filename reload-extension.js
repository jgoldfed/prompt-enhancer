// Development helper script to reload extension and refresh test pages
// Run this in the browser console on chrome://extensions/ page

// This script helps with the "Extension context invalidated" error
// by automatically refreshing relevant tabs after extension reload

console.log('Extension reload helper loaded');

// Function to reload extension and refresh ChatGPT tabs
function reloadExtensionAndRefreshTabs() {
  // Find the extension reload button (you'll need to click this manually)
  console.log('1. Click the reload button for your extension');
  console.log('2. Then run refreshChatGPTTabs() to refresh all ChatGPT tabs');
}

// Function to refresh all ChatGPT tabs
function refreshChatGPTTabs() {
  chrome.tabs.query({}, (tabs) => {
    const chatGPTTabs = tabs.filter(tab => 
      tab.url && (
        tab.url.includes('chat.openai.com') || 
        tab.url.includes('chatgpt.com')
      )
    );
    
    console.log(`Found ${chatGPTTabs.length} ChatGPT tabs to refresh`);
    
    chatGPTTabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
      console.log(`Refreshed tab: ${tab.url}`);
    });
  });
}

// Make functions available globally
window.reloadExtensionAndRefreshTabs = reloadExtensionAndRefreshTabs;
window.refreshChatGPTTabs = refreshChatGPTTabs;

console.log('Available functions:');
console.log('- reloadExtensionAndRefreshTabs()');
console.log('- refreshChatGPTTabs()');
