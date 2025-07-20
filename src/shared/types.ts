export interface EnhancementMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface EnhancementResult {
  original: string;
  enhanced: string;
  mode: string;
  timestamp: number;
}

export interface UserSettings {
  defaultMode: string;
  autoEnhance: boolean;
  showPreview: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
  groqApiKey?: string;
}

export interface Message {
  type: 'ENHANCE_PROMPT' | 'GET_SETTINGS' | 'UPDATE_SETTINGS' | 'GET_HISTORY' | 'GET_API_KEY' | 'SET_API_KEY';
  payload?: any;
}

export interface PromptEnhancementRequest {
  text: string;
  mode: string;
  context?: string;
}

export interface TextInputInfo {
  element: HTMLElement;
  text: string;
  position: { x: number; y: number };
  type: 'textarea' | 'input' | 'contenteditable';
}

export interface GroqApiRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqApiResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const ENHANCEMENT_MODES: EnhancementMode[] = [
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Add specificity and remove ambiguity',
    icon: '🔍'
  },
  {
    id: 'detail',
    name: 'Detail',
    description: 'Expand with examples and constraints',
    icon: '📝'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Format as structured, formal prompt',
    icon: '💼'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Add creative context and inspiration',
    icon: '🎨'
  }
];