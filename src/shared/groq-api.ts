import { GroqApiRequest, GroqApiResponse, GroqMessage } from './types';

export class GroqApiService {
  private static instance: GroqApiService;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama3-8b-8192'; // Fast and efficient model for prompt enhancement

  public static getInstance(): GroqApiService {
    if (!GroqApiService.instance) {
      GroqApiService.instance = new GroqApiService();
    }
    return GroqApiService.instance;
  }

  public async enhancePrompt(originalPrompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('Groq API key is required. Please set your API key in the extension popup.');
    }

    const systemPrompt = `You are an LLM prompt generation expert. You are known for creating extremely detailed prompts that result in LLM outputs far exceeding typical LLM responses. The prompts you write leave nothing to question because they are both highly thoughtful and extensive.

Your task is to transform the user's basic prompt into an exceptional ChatGPT prompt using the C.R.A.F.T. methodology (Context, Role, Action, Format, Target Audience) for maximum LLM performance.

For organizational purposes, you will use an acronym called "C.R.A.F.T." where each letter represents a section of the prompt:

**Context**: Describes the current context that outlines the situation for which the prompt is needed. It helps the LLM understand what knowledge and expertise it should reference.

**Role**: Defines the type of experience the LLM has, its skill set, and its level of expertise relative to the prompt requested. The role should be an industry-leading expert with more than two decades of relevant experience and thought leadership.

**Action**: The action that the prompt will ask the LLM to take. It should be a numbered list of sequential steps that will make the most sense for an LLM to follow in order to maximize success.

**Format**: The structural arrangement or presentation style of the LLM's generated content. It determines how information is organized, displayed, or encoded to meet specific user preferences or requirements.

**Target Audience**: The ultimate consumer of the output that your prompt creates. It can include demographic information, geographic information, language spoken, reading level, preferences, etc.

Rules:
- Transform the basic prompt into a comprehensive C.R.A.F.T. structured prompt
- Make it detailed and thorough
- Include all five C.R.A.F.T. sections with clear headings
- NO explanations, prefixes, or meta-commentary about the transformation
- Return ONLY the enhanced C.R.A.F.T. prompt`;

    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Transform this basic prompt into a comprehensive C.R.A.F.T. structured prompt:

"${originalPrompt}"

Create an exceptional ChatGPT prompt with Context, Role, Action, Format, and Target Audience sections. Make it detailed and thorough.`
      }
    ];

    const requestBody: GroqApiRequest = {
      model: this.model,
      messages,
      temperature: 0.3, // Lower temperature for more consistent enhancement
      max_tokens: 1000
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid Groq API key. Please check your API key in the extension popup.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. The prompt might be too long or contain unsupported content.');
        } else {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
      }

      const data: GroqApiResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from Groq API');
      }

      let enhancedPrompt = data.choices[0].message.content.trim();
      
      if (!enhancedPrompt) {
        throw new Error('Empty response received from Groq API');
      }

      // Clean up the response
      // Remove surrounding quotes if present
      if ((enhancedPrompt.startsWith('"') && enhancedPrompt.endsWith('"')) ||
          (enhancedPrompt.startsWith("'") && enhancedPrompt.endsWith("'"))) {
        enhancedPrompt = enhancedPrompt.slice(1, -1);
      }
      
      // Remove common prefixes that the AI might add despite instructions
      const prefixesToRemove = [
        'Here is the enhanced prompt:',
        'Enhanced prompt:',
        'Here\'s the enhanced prompt:',
        'The enhanced prompt is:',
        'Enhanced version:',
        'Improved prompt:'
      ];
      
      for (const prefix of prefixesToRemove) {
        if (enhancedPrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
          enhancedPrompt = enhancedPrompt.substring(prefix.length).trim();
          break;
        }
      }
      
      // Remove CRAFT headers and other noise while preserving structure
      const noisePatternsToRemove = [
        /^\*\*\s*CRAFT\s*Prompt\s*\*\*/i,
        /^\*\*\s*C\.R\.A\.F\.T\.?\s*Prompt\s*\*\*/i,
        /^\*\*\s*Enhanced\s*C\.R\.A\.F\.T\.?\s*Prompt\s*\*\*/i,
        /^\*\*\s*C\.R\.A\.F\.T\.?\s*\*\*/i,
        /^\*\*\s*Enhanced\s*Prompt\s*\*\*/i,
        /^\*\*\s*Prompt\s*Enhancement\s*\*\*/i
      ];
      
      // Remove noise patterns from the beginning of lines
      const lines = enhancedPrompt.split('\n');
      const cleanedLines = lines.filter((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip empty lines at the beginning
        if (index === 0 && trimmedLine === '') return false;
        
        // Check if line matches any noise pattern
        for (const pattern of noisePatternsToRemove) {
          if (pattern.test(trimmedLine)) {
            return false; // Remove this line
          }
        }
        
        return true; // Keep this line
      });
      
      enhancedPrompt = cleanedLines.join('\n').trim();

      return enhancedPrompt;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to enhance prompt. Please check your internet connection and try again.');
      }
    }
  }

  public async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      const testMessages: GroqMessage[] = [
        {
          role: 'user',
          content: 'Hello'
        }
      ];

      const requestBody: GroqApiRequest = {
        model: this.model,
        messages: testMessages,
        max_tokens: 5
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
