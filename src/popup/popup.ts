import { ENHANCEMENT_MODES, UserSettings, Message } from '../shared/types';

class PopupManager {
  private settings: UserSettings | null = null;
  private apiKey: string = '';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    await this.loadApiKey();
    this.setupUI();
    this.setupEventListeners();
  }

  private async loadSettings(): Promise<void> {
    try {
      const response = await this.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        this.settings = response.settings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings
      this.settings = {
        defaultMode: 'clarity',
        autoEnhance: false,
        showPreview: true,
        saveHistory: true,
        maxHistoryItems: 50
      };
    }
  }

  private setupUI(): void {
    this.updateApiKeyUI();
  }

  private renderModeSelector(): void {
    const modeGrid = document.getElementById('modeGrid');
    if (!modeGrid || !this.settings) return;

    modeGrid.innerHTML = '';

    ENHANCEMENT_MODES.forEach(mode => {
      const modeElement = document.createElement('div');
      modeElement.className = `mode-option ${mode.id === this.settings?.defaultMode ? 'selected' : ''}`;
      modeElement.dataset.mode = mode.id;
      
      modeElement.innerHTML = `
        <div class="mode-icon">${mode.icon}</div>
        <div class="mode-name">${mode.name}</div>
      `;

      modeElement.addEventListener('click', () => this.selectMode(mode.id));
      modeGrid.appendChild(modeElement);
    });
  }

  private updateSettingsToggles(): void {
    if (!this.settings) return;

    this.updateToggle('autoEnhanceToggle', this.settings.autoEnhance);
    this.updateToggle('showPreviewToggle', this.settings.showPreview);
    this.updateToggle('saveHistoryToggle', this.settings.saveHistory);
  }

  private updateToggle(toggleId: string, isActive: boolean): void {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.classList.toggle('active', isActive);
    }
  }

  private setupEventListeners(): void {
    // API key management
    this.setupApiKeyEventListeners();
  }

  private setupToggle(toggleId: string, settingKey: keyof UserSettings): void {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (this.settings) {
          (this.settings as any)[settingKey] = !(this.settings as any)[settingKey];
          this.updateToggle(toggleId, (this.settings as any)[settingKey]);
          this.saveSettings();
        }
      });
    }
  }

  private selectMode(modeId: string): void {
    if (!this.settings) return;

    // Update UI
    document.querySelectorAll('.mode-option').forEach(element => {
      element.classList.remove('selected');
    });
    
    const selectedElement = document.querySelector(`[data-mode="${modeId}"]`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }

    // Update settings
    this.settings.defaultMode = modeId;
    this.saveSettings();
  }

  private async saveSettings(): Promise<void> {
    if (!this.settings) return;

    try {
      await this.sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: this.settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private async loadApiKey(): Promise<void> {
    try {
      const response = await this.sendMessage({ type: 'GET_API_KEY' });
      if (response.success) {
        this.apiKey = response.apiKey || '';
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
      this.apiKey = '';
    }
  }

  private updateApiKeyUI(): void {
    const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    
    if (apiKeyInput) {
      apiKeyInput.value = this.apiKey ? '••••••••••••••••' : '';
    }
    
    if (apiKeyStatus) {
      if (this.apiKey) {
        apiKeyStatus.textContent = '✓ API key saved';
        apiKeyStatus.className = 'api-key-status success';
      } else {
        apiKeyStatus.textContent = 'No API key set';
        apiKeyStatus.className = 'api-key-status error';
      }
    }
  }

  private setupApiKeyEventListeners(): void {
    const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn') as HTMLButtonElement;
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    if (apiKeyInput && saveApiKeyBtn) {
      // Clear placeholder when focused
      apiKeyInput.addEventListener('focus', () => {
        if (apiKeyInput.value === '••••••••••••••••') {
          apiKeyInput.value = '';
        }
      });

      // Save API key on button click
      saveApiKeyBtn.addEventListener('click', async () => {
        const newApiKey = apiKeyInput.value.trim();
        
        if (newApiKey === '••••••••••••••••') {
          return; // Don't save placeholder
        }

        saveApiKeyBtn.disabled = true;
        saveApiKeyBtn.textContent = 'Saving...';
        
        if (apiKeyStatus) {
          apiKeyStatus.textContent = 'Saving API key...';
          apiKeyStatus.className = 'api-key-status';
        }

        try {
          const response = await this.sendMessage({
            type: 'SET_API_KEY',
            payload: newApiKey
          });

          if (response.success) {
            this.apiKey = newApiKey;
            this.updateApiKeyUI();
            
            if (apiKeyStatus) {
              apiKeyStatus.textContent = response.message || '✓ API key saved';
              apiKeyStatus.className = 'api-key-status success';
            }
          } else {
            if (apiKeyStatus) {
              apiKeyStatus.textContent = response.error || 'Failed to save API key';
              apiKeyStatus.className = 'api-key-status error';
            }
          }
        } catch (error) {
          console.error('Failed to save API key:', error);
          if (apiKeyStatus) {
            apiKeyStatus.textContent = 'Failed to save API key';
            apiKeyStatus.className = 'api-key-status error';
          }
        } finally {
          saveApiKeyBtn.disabled = false;
          saveApiKeyBtn.textContent = 'Save';
        }
      });

      // Save on Enter key
      apiKeyInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          saveApiKeyBtn.click();
        }
      });
    }
  }

  private sendMessage(message: Message): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
