import { UserSettings, EnhancementResult } from './types';

export class StorageManager {
  private static instance: StorageManager;

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public async getSettings(): Promise<UserSettings> {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || this.getDefaultSettings();
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    await chrome.storage.sync.set({ settings });
  }

  public async getHistory(): Promise<EnhancementResult[]> {
    const result = await chrome.storage.local.get('history');
    return result.history || [];
  }

  public async saveToHistory(enhancement: EnhancementResult): Promise<void> {
    const history = await this.getHistory();
    const settings = await this.getSettings();
    
    history.unshift(enhancement);
    
    // Limit history size
    if (history.length > settings.maxHistoryItems) {
      history.splice(settings.maxHistoryItems);
    }
    
    await chrome.storage.local.set({ history });
  }

  public async getApiKey(): Promise<string | null> {
    const result = await chrome.storage.sync.get('groqApiKey');
    return result.groqApiKey || null;
  }

  public async saveApiKey(apiKey: string): Promise<void> {
    await chrome.storage.sync.set({ groqApiKey: apiKey });
  }

  public async removeApiKey(): Promise<void> {
    await chrome.storage.sync.remove('groqApiKey');
  }

  private getDefaultSettings(): UserSettings {
    return {
      defaultMode: 'clarity',
      autoEnhance: false,
      showPreview: true,
      saveHistory: true,
      maxHistoryItems: 50,
      groqApiKey: undefined
    };
  }
}