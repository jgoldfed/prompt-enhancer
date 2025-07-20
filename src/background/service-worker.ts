import { PromptEnhancer } from '../shared/prompt-enhancer';
import { StorageManager } from '../shared/storage';
import { Message, PromptEnhancementRequest } from '../shared/types';

class BackgroundService {
  private promptEnhancer: PromptEnhancer;
  private storageManager: StorageManager;

  constructor() {
    this.promptEnhancer = PromptEnhancer.getInstance();
    this.storageManager = StorageManager.getInstance();
    this.setupMessageListeners();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      }
    );
  }

  private async handleMessage(
    message: Message, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'ENHANCE_PROMPT':
          await this.handleEnhancePrompt(message.payload, sendResponse);
          break;
        case 'GET_SETTINGS':
          await this.handleGetSettings(sendResponse);
          break;
        case 'UPDATE_SETTINGS':
          await this.handleUpdateSettings(message.payload, sendResponse);
          break;
        case 'GET_HISTORY':
          await this.handleGetHistory(sendResponse);
          break;
        case 'GET_API_KEY':
          await this.handleGetApiKey(sendResponse);
          break;
        case 'SET_API_KEY':
          await this.handleSetApiKey(message.payload, sendResponse);
          break;
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async handleEnhancePrompt(
    request: PromptEnhancementRequest, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const apiKey = await this.storageManager.getApiKey();
      
      if (!apiKey) {
        sendResponse({ 
          success: false, 
          error: 'Groq API key is required. Please set your API key in the extension popup.' 
        });
        return;
      }

      const result = await this.promptEnhancer.enhancePrompt(request, apiKey);
      const settings = await this.storageManager.getSettings();
      
      if (settings.saveHistory) {
        await this.storageManager.saveToHistory(result);
      }
      
      sendResponse({ success: true, result });
    } catch (error) {
      console.error('Enhancement error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to enhance prompt' 
      });
    }
  }

  private async handleGetSettings(sendResponse: (response: any) => void): Promise<void> {
    const settings = await this.storageManager.getSettings();
    sendResponse({ success: true, settings });
  }

  private async handleUpdateSettings(
    settings: any, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    await this.storageManager.saveSettings(settings);
    sendResponse({ success: true });
  }

  private async handleGetHistory(sendResponse: (response: any) => void): Promise<void> {
    const history = await this.storageManager.getHistory();
    sendResponse({ success: true, history });
  }

  private async handleGetApiKey(sendResponse: (response: any) => void): Promise<void> {
    try {
      const apiKey = await this.storageManager.getApiKey();
      sendResponse({ success: true, apiKey: apiKey || '' });
    } catch (error) {
      console.error('Get API key error:', error);
      sendResponse({ success: false, error: 'Failed to retrieve API key' });
    }
  }

  private async handleSetApiKey(
    apiKey: string, 
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      if (!apiKey || apiKey.trim() === '') {
        await this.storageManager.removeApiKey();
        sendResponse({ success: true, message: 'API key removed' });
        return;
      }

      await this.storageManager.saveApiKey(apiKey.trim());
      sendResponse({ success: true, message: 'API key saved successfully' });
    } catch (error) {
      console.error('Set API key error:', error);
      sendResponse({ success: false, error: 'Failed to save API key' });
    }
  }
}

// Initialize the background service
new BackgroundService();