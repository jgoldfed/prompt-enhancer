import { TextInputInfo, Message, PromptEnhancementRequest } from '../shared/types';

// Immediate debug log to verify script loading
console.log('PPE: Content script file loaded!', window.location.href);

class ContentScript {
  private enhancementButton: HTMLElement | null = null;
  private currentInput: HTMLElement | null = null;
  private isEnhancing: boolean = false;

  constructor() {
    console.log('PPE: ContentScript constructor called');
    this.enhancementButton = null;
    this.currentInput = null;
    this.isEnhancing = false;
    
    // Only initialize on supported LLM domains
    if (this.isSupportedDomain()) {
      this.init();
    } else {
      console.log('PPE: Not a supported LLM domain, skipping initialization');
    }
  }

  private isSupportedDomain(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    const supportedDomains = [
      'chat.openai.com',
      'chatgpt.com',
      'perplexity.ai',
      'claude.ai',
      'gemini.google.com',
      'bard.google.com',
      'notebooklm.google.com',
      'chat.deepseek.com',
      'deepseek.com',
      'poe.com',
      'abacus.ai',
      'manus.chat',
      'you.com',
      'character.ai',
      'huggingface.co',
      'chat.mistral.ai',
      'mistral.ai',
      'replicate.com'
    ];
    
    return supportedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  private init(): void {
    console.log('PPE: Initializing content script. Document ready state:', document.readyState);
    console.log('PPE: Current URL:', window.location.href);
    
    // Wait for page to load
    if (document.readyState === 'loading') {
      console.log('PPE: Document still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.setupContentScript());
    } else {
      console.log('PPE: Document ready, setting up immediately');
      this.setupContentScript();
    }
  }

  private setupContentScript(): void {
    console.log('PPE: Setting up content script on:', window.location.href);
    this.createEnhancementButton();
    this.setupInputDetection();
    
    // Force show button after a delay for debugging
    setTimeout(() => {
      console.log('PPE: Force showing button for debugging...');
      const anyTextarea = document.querySelector('textarea');
      if (anyTextarea) {
        console.log('PPE: Found textarea, showing button:', anyTextarea);
        this.showEnhancementButton(anyTextarea as HTMLElement);
      } else {
        console.log('PPE: No textarea found, creating test button anyway');
        this.forceShowButton();
      }
    }, 2000);
    
    // Periodic check to ensure button stays visible (for ChatGPT's aggressive DOM changes)
    setInterval(() => {
      if (this.enhancementButton) {
        const isVisible = this.enhancementButton.style.display !== 'none' && 
                         this.enhancementButton.style.visibility !== 'hidden' &&
                         document.body.contains(this.enhancementButton);
        
        if (!isVisible) {
          console.log('PPE: Button became invisible, forcing it back');
          this.forceShowButton();
        }
      }
    }, 3000);
    
    console.log('PPE: Content script setup complete');
  }

  private createEnhancementButton(): void {
    console.log('PPE: Creating enhancement button');
    this.enhancementButton = document.createElement('div');
    this.enhancementButton.id = 'perplexity-prompt-enhancer-btn';
    
    // Create a subtle, professional button
    this.enhancementButton.style.cssText = `
      background: rgba(16, 163, 127, 0.9);
      color: white;
      border: 1px solid rgba(16, 163, 127, 1);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      cursor: pointer;
      position: fixed;
      z-index: 999999;
      display: none;
      user-select: none;
    `;
    
    this.enhancementButton.innerHTML = `
      <div class="ppe-button" style="
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        min-width: 80px;
        white-space: nowrap;
      ">
        <span class="ppe-icon" style="font-size: 12px;">✨</span>
        <span class="ppe-text" style="font-size: 11px;">Enhance</span>
      </div>
    `;
    
    // Add hover effects
    const button = this.enhancementButton.querySelector('.ppe-button') as HTMLElement;
    if (button) {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(16, 163, 127, 1)';
        button.style.transform = 'scale(1.05)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(16, 163, 127, 0.9)';
        button.style.transform = 'scale(1)';
      });
    }
    
    this.enhancementButton.style.display = 'none';
    this.enhancementButton.addEventListener('click', () => this.handleEnhanceClick());
    
    if (document.body) {
      document.body.appendChild(this.enhancementButton);
      console.log('PPE: Enhancement button created and added to body');
    } else {
      console.log('PPE: Document body not available, waiting...');
      setTimeout(() => this.createEnhancementButton(), 100);
    }
  }

  private setupInputDetection(): void {
    // Use MutationObserver to detect new input elements
    const observer = new MutationObserver((mutations) => {
      // Only run if there are actual DOM changes with added nodes
      const hasAddedNodes = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasAddedNodes) {
        this.detectTextInputs();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial detection
    this.detectTextInputs();
  }

  private detectTextInputs(): void {
    console.log('PPE: Detecting text inputs on', window.location.href);
    
    // Enhanced selectors for Perplexity Comet, ChatGPT and general input detection
    const inputSelectors = [
      // Perplexity Comet specific selectors - more comprehensive
      'textarea',
      'div[contenteditable="true"]',
      'input[type="text"]',
      '[role="textbox"]',
      // Specific Perplexity selectors
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Follow up"]',
      'textarea[data-testid="search-input"]',
      'textarea[class*="search"]',
      'textarea[class*="input"]',
      // ChatGPT specific selectors
      'textarea[placeholder*="Message ChatGPT"]',
      'textarea[data-id="root"]',
      'textarea[id="prompt-textarea"]',
      'div[contenteditable="true"][data-id="root"]',
      'textarea[class*="text-base"]',
      
      // General input selectors
      'textarea[placeholder*="question"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="ask"]',
      'textarea[placeholder*="message"]',
      'input[type="text"][placeholder*="search"]'
    ];
    
    console.log('PPE: Scanning for inputs with selectors...');
    
    let foundInputs = 0;
    inputSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`PPE: Found ${elements.length} elements for selector: ${selector}`);
      
      elements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.dataset.ppeProcessed) {
          htmlElement.dataset.ppeProcessed = 'true';
          this.attachInputListeners(htmlElement);
          foundInputs++;
          console.log('PPE: Attached listeners to input:', htmlElement.tagName, htmlElement.className);
        }
      });
    });
    
    console.log(`PPE: Total inputs processed: ${foundInputs}`);
    
    // If no inputs found, try a more aggressive approach
    if (foundInputs === 0) {
      console.log('PPE: No inputs found with selectors, trying all textareas');
      const allTextareas = document.querySelectorAll('textarea');
      console.log('PPE: Found', allTextareas.length, 'textareas with aggressive search');
      
      allTextareas.forEach((textarea: HTMLElement) => {
        if (!textarea.dataset.ppeProcessed) {
          textarea.dataset.ppeProcessed = 'true';
          this.attachInputListeners(textarea);
          foundInputs++;
          console.log('PPE: Attached listeners to textarea:', textarea);
        }
      });
    }
    
    // Force show button on first textarea for debugging
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length > 0) {
      console.log('PPE: Found textareas, forcing button display for debugging');
      const firstTextarea = allTextareas[0] as HTMLElement;
      this.showEnhancementButton(firstTextarea);
    }
  }

  private attachInputListeners(input: HTMLElement): void {
    console.log('PPE: Attaching listeners to input:', input);
    input.addEventListener('focus', () => this.handleInputFocus(input));
    input.addEventListener('blur', () => this.handleInputBlur());
    input.addEventListener('input', () => this.handleInputChange(input));
  }

  private handleInputFocus(input: HTMLElement): void {
    console.log('PPE: Input focused:', input);
    this.currentInput = input;
    this.showEnhancementButton(input);
  }

  private handleInputBlur(): void {
    // Delay hiding to allow button clicks
    setTimeout(() => {
      if (!this.isEnhancing) {
        this.hideEnhancementButton();
      }
    }, 200);
  }

  private handleInputChange(input: HTMLElement): void {
    const text = this.getInputText(input);
    if (text.length > 10) {
      this.showEnhancementButton(input);
    } else {
      this.hideEnhancementButton();
    }
  }

  private findValidInputElement(): HTMLElement | null {
    // Try to find an input element with valid dimensions
    const allInputs = document.querySelectorAll('textarea, div[contenteditable="true"], input[type="text"]');
    
    for (const input of allInputs) {
      const rect = (input as HTMLElement).getBoundingClientRect();
      const hasValidDimensions = rect.width > 0 && rect.height > 0 && 
                                (rect.top > 0 || rect.left > 0 || rect.right > 0 || rect.bottom > 0);
      
      if (hasValidDimensions) {
        console.log('PPE: Found valid input element:', input);
        return input as HTMLElement;
      }
    }
    
    console.log('PPE: No valid input element found');
    return null;
  }

  private showEnhancementButton(input: HTMLElement): void {
    if (!this.enhancementButton) {
      console.log('PPE: Enhancement button not found!');
      return;
    }

    const rect = input.getBoundingClientRect();
    console.log('PPE: Showing button near input. Input rect:', rect);
    
    // Check if input has valid dimensions
    const hasValidDimensions = rect.width > 0 && rect.height > 0 && 
                              (rect.top > 0 || rect.left > 0 || rect.right > 0 || rect.bottom > 0);
    
    let top: number;
    let left: number;
    
    if (hasValidDimensions) {
      // Position button underneath the input textbox, centered
      top = rect.bottom + 8; // Always position below the input
      left = rect.left + (rect.width / 2) - 40; // Center horizontally (assuming button width ~80px)
      
      // Ensure button stays within viewport horizontally
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 10) {
        left = 10; // Keep minimum distance from left edge
      }
      if (left + 80 > viewportWidth) {
        left = viewportWidth - 90; // Keep within right edge
      }
      
      // If button would be below viewport, position above input instead
      if (top + 30 > viewportHeight) {
        top = rect.top - 35; // Position above input
      }
      
      console.log('PPE: Using input-relative positioning (underneath)');
    } else {
      // For invalid dimensions, try to find a valid input element or use smart fallback
      const validInput = this.findValidInputElement();
      if (validInput && validInput !== input) {
        // Recursively call with valid input
        this.showEnhancementButton(validInput);
        return;
      }
      
      // Final fallback: position at bottom-right of screen
      top = window.innerHeight - 60;
      left = window.innerWidth - 120;
      console.log('PPE: Using fallback positioning at bottom-right');
    }
    
    this.enhancementButton.style.display = 'block';
    this.enhancementButton.style.position = 'fixed';
    this.enhancementButton.style.top = `${top}px`;
    this.enhancementButton.style.left = `${left}px`;
    this.enhancementButton.style.zIndex = '999999';
    this.enhancementButton.style.pointerEvents = 'auto';
    
    console.log('PPE: Button positioned at:', {
      top: this.enhancementButton.style.top,
      left: this.enhancementButton.style.left,
      display: this.enhancementButton.style.display,
      zIndex: this.enhancementButton.style.zIndex,
      inputRect: rect,
      hasValidDimensions,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
  }

  private hideEnhancementButton(): void {
    if (this.enhancementButton) {
      this.enhancementButton.style.display = 'none';
    }
  }

  private forceShowButton(): void {
    console.log('PPE: Force showing button with consistent positioning');
    if (this.enhancementButton) {
      // Try to find a valid input element for consistent positioning
      const validInput = this.findValidInputElement();
      if (validInput) {
        console.log('PPE: Found valid input for force show, using consistent positioning');
        this.showEnhancementButton(validInput);
        return;
      }
      
      // Fallback: position at bottom-right consistently
      const top = window.innerHeight - 60;
      const left = window.innerWidth - 120;
      
      this.enhancementButton.style.cssText = `
        position: fixed !important;
        top: ${top}px !important;
        left: ${left}px !important;
        z-index: 999999 !important;
        display: block !important;
        background: rgba(16, 163, 127, 0.9) !important;
        color: white !important;
        border: 1px solid rgba(16, 163, 127, 1) !important;
        border-radius: 3px !important;
        padding: 2px 6px !important;
        font-size: 10px !important;
        font-weight: 500 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        cursor: pointer !important;
        min-width: auto !important;
        width: auto !important;
        height: auto !important;
        line-height: 1.2 !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      `;
      
      // Ensure button stays in DOM and visible
      if (!document.body.contains(this.enhancementButton)) {
        document.body.appendChild(this.enhancementButton);
        console.log('PPE: Re-added button to DOM');
      }
      
      console.log('PPE: Button forced to show at bottom-right corner');
    }
  }

  private async handleEnhanceClick(): Promise<void> {
    if (!this.currentInput || this.isEnhancing) return;

    this.isEnhancing = true;
    const text = this.getInputText(this.currentInput);
    
    if (!text.trim()) {
      this.isEnhancing = false;
      return;
    }

    // Show loading state
    this.updateButtonState('loading');

    try {
      const request: PromptEnhancementRequest = {
        text: text.trim(),
        mode: 'clarity', // Default mode, can be made configurable
        context: this.getPageContext()
      };

      const response = await this.sendMessage({
        type: 'ENHANCE_PROMPT',
        payload: request
      });

      if (response.success) {
        this.setInputText(this.currentInput, response.result.enhanced);
        this.updateButtonState('success');
      } else {
        console.error('Enhancement failed:', response.error);
        this.updateButtonState('error');
        
        // Show user-friendly error message
        if (response.error && response.error.includes('API key')) {
          this.showErrorMessage('Please set your Groq API key in the extension popup.');
        } else if (response.error && response.error.includes('Rate limit')) {
          this.showErrorMessage('Rate limit exceeded. Please try again in a moment.');
        } else {
          this.showErrorMessage('Enhancement failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      this.updateButtonState('error');
    }

    setTimeout(() => {
      this.updateButtonState('default');
      this.isEnhancing = false;
      this.hideErrorMessage();
    }, 3000);
  }

  private getInputText(input: HTMLElement): string {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      return (input as HTMLInputElement).value;
    } else if (input.contentEditable === 'true') {
      return input.textContent || '';
    }
    return '';
  }

  private setInputText(input: HTMLElement, text: string): void {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      (input as HTMLInputElement).value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (input.contentEditable === 'true') {
      input.textContent = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private getPageContext(): string {
    // Extract context from the current page
    const title = document.title;
    const url = window.location.href;
    return `Page: ${title} (${url})`;
  }

  private updateButtonState(state: 'default' | 'loading' | 'success' | 'error'): void {
    if (!this.enhancementButton) return;

    const button = this.enhancementButton.querySelector('.ppe-button') as HTMLElement;
    const icon = this.enhancementButton.querySelector('.ppe-icon');
    const text = this.enhancementButton.querySelector('.ppe-text');

    if (!button || !icon || !text) return;

    // Update button background color based on state
    switch (state) {
      case 'loading':
        button.style.background = 'rgba(59, 130, 246, 0.9)';
        button.style.borderColor = 'rgba(59, 130, 246, 1)';
        icon.textContent = '⏳';
        text.textContent = 'Enhancing...';
        break;
      case 'success':
        button.style.background = 'rgba(34, 197, 94, 0.9)';
        button.style.borderColor = 'rgba(34, 197, 94, 1)';
        icon.textContent = '✅';
        text.textContent = 'Enhanced!';
        break;
      case 'error':
        button.style.background = 'rgba(239, 68, 68, 0.9)';
        button.style.borderColor = 'rgba(239, 68, 68, 1)';
        icon.textContent = '❌';
        text.textContent = 'Error';
        break;
      default:
        button.style.background = 'rgba(16, 163, 127, 0.9)';
        button.style.borderColor = 'rgba(16, 163, 127, 1)';
        icon.textContent = '✨';
        text.textContent = 'Enhance';
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+E to enhance current input
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        if (this.currentInput) {
          this.handleEnhanceClick();
        }
      }
    });
  }

  private showErrorMessage(message: string): void {
    // Create or update error message element
    let errorElement = document.getElementById('ppe-error-message');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'ppe-error-message';
      errorElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(239, 68, 68, 1);
        animation: slideIn 0.3s ease-out;
      `;
      
      // Add slide-in animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  private hideErrorMessage(): void {
    const errorElement = document.getElementById('ppe-error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  private sendMessage(message: Message): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            console.log('PPE: Runtime error:', error);
            
            // Handle extension context invalidated error gracefully
            if (error && error.includes('Extension context invalidated')) {
              reject(new Error('Extension was reloaded. Please refresh the page and try again.'));
            } else {
              reject(new Error(error || 'Unknown runtime error'));
            }
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        console.log('PPE: Send message error:', error);
        reject(new Error('Extension communication failed. Please refresh the page and try again.'));
      }
    });
  }
}

// Initialize the content script
new ContentScript();
