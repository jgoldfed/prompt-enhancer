import { PromptEnhancementRequest, EnhancementResult } from './types';
import { GroqApiService } from './groq-api';

export class PromptEnhancer {
  private static instance: PromptEnhancer;
  private groqApiService: GroqApiService;

  constructor() {
    this.groqApiService = GroqApiService.getInstance();
  }

  public static getInstance(): PromptEnhancer {
    if (!PromptEnhancer.instance) {
      PromptEnhancer.instance = new PromptEnhancer();
    }
    return PromptEnhancer.instance;
  }

  public async enhancePrompt(request: PromptEnhancementRequest, apiKey: string): Promise<EnhancementResult> {
    const { text, mode } = request;
    
    // Check if text is already enhanced to prevent double-enhancement
    if (this.isAlreadyEnhanced(text)) {
      return {
        original: text,
        enhanced: text,
        mode,
        timestamp: Date.now()
      };
    }
    
    if (!apiKey) {
      throw new Error('Groq API key is required. Please set your API key in the extension popup.');
    }

    try {
      const enhanced = await this.groqApiService.enhancePrompt(text, apiKey);
      
      return {
        original: text,
        enhanced,
        mode,
        timestamp: Date.now()
      };
    } catch (error) {
      throw error;
    }
  }

  private isAlreadyEnhanced(text: string): boolean {
    // Check for common enhancement patterns to prevent double-enhancement
    const enhancementMarkers = [
      'Please define specific criteria',
      'Please provide a specific and detailed response',
      'Please include:',
      'Background:',
      'Context:',
      'Detailed Request:',
      'Professional Analysis:',
      'Creative Brief:'
    ];
    
    return enhancementMarkers.some(marker => text.includes(marker));
  }

  private enhanceForClarity(text: string): string {
    // Completely rewrite the prompt for clarity and specificity
    const cleanText = text.trim();
    
    // Analyze the prompt and restructure it
    const analysis = this.analyzePrompt(cleanText);
    
    let enhanced = '';
    
    // Rewrite based on prompt type
    if (analysis.isQuestion) {
      enhanced = this.rewriteAsQuestion(cleanText, analysis);
    } else if (analysis.isRequest) {
      enhanced = this.rewriteAsRequest(cleanText, analysis);
    } else {
      enhanced = this.rewriteAsGeneral(cleanText, analysis);
    }
    
    return enhanced;
  }

  private enhanceForDetail(text: string): string {
    // Completely rewrite for detailed analysis
    const cleanText = text.trim();
    const analysis = this.analyzePrompt(cleanText);
    
    let enhanced = this.rewriteForDetail(cleanText, analysis);
    
    return enhanced;
  }

  private enhanceForProfessional(text: string): string {
    // Rewrite in professional, structured format
    const cleanText = text.trim();
    const analysis = this.analyzePrompt(cleanText);
    
    let enhanced = this.rewriteForProfessional(cleanText, analysis);
    
    return enhanced;
  }

  private enhanceForCreative(text: string): string {
    // Rewrite with creative enhancement
    const cleanText = text.trim();
    const analysis = this.analyzePrompt(cleanText);
    
    let enhanced = this.rewriteForCreative(cleanText, analysis);
    
    return enhanced;
  }

  private analyzePrompt(text: string): {
    isQuestion: boolean;
    isRequest: boolean;
    topic: string;
    intent: string;
    needsContext: boolean;
    needsSpecificity: boolean;
    isVague: boolean;
  } {
    const lowerText = text.toLowerCase();
    
    // Detect question patterns
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    const isQuestion = questionWords.some(word => lowerText.startsWith(word)) || text.includes('?');
    
    // Detect request patterns
    const requestWords = ['create', 'make', 'build', 'write', 'generate', 'help', 'explain', 'describe'];
    const isRequest = requestWords.some(word => lowerText.includes(word));
    
    // Extract topic (simplified)
    const topic = this.extractTopic(text);
    
    // Determine intent
    const intent = this.determineIntent(text);
    
    // Check if needs more context or specificity
    const needsContext = text.length < 30 || this.hasVagueTerms(text);
    const needsSpecificity = this.lacksSpecificity(text);
    const isVague = this.isVague(text);
    
    return {
      isQuestion,
      isRequest,
      topic,
      intent,
      needsContext,
      needsSpecificity,
      isVague
    };
  }

  private extractTopic(text: string): string {
    // Simple topic extraction
    const words = text.toLowerCase().split(' ');
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'make', 'makes', 'good', 'better', 'best'];
    const meaningfulWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    return meaningfulWords.slice(0, 3).join(' ');
  }

  private extractSubjectFromRequest(text: string): string {
    // Extract the main subject from request-type prompts
    const lowerText = text.toLowerCase();
    
    // Remove common request prefixes
    let subject = text
      .replace(/^(please\s+)?(create|make|build|write|explain|describe|tell me about|analyze|evaluate|assess|compare|help me with|guide me through)\s+/i, '')
      .replace(/^(a|an|the)\s+/i, '')
      .trim();
    
    // If subject is still too long, take first few meaningful words
    const words = subject.split(' ');
    if (words.length > 5) {
      subject = words.slice(0, 5).join(' ');
    }
    
    return subject || 'the requested item';
  }

  private determineIntent(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('explain') || lowerText.includes('describe')) return 'explanation';
    if (lowerText.includes('compare') || lowerText.includes('difference')) return 'comparison';
    if (lowerText.includes('analyze') || lowerText.includes('analysis')) return 'analysis';
    if (lowerText.includes('create') || lowerText.includes('make') || lowerText.includes('build')) return 'creation';
    if (lowerText.includes('help') || lowerText.includes('how to')) return 'guidance';
    if (lowerText.includes('list') || lowerText.includes('examples')) return 'enumeration';
    
    return 'general';
  }

  private hasVagueTerms(text: string): boolean {
    const vagueTerms = ['good', 'better', 'best', 'nice', 'great', 'awesome', 'cool', 'interesting', 'important', 'useful', 'effective', 'efficient'];
    return vagueTerms.some(term => text.toLowerCase().includes(term));
  }

  private lacksSpecificity(text: string): boolean {
    return text.length < 50 && !text.includes('specific') && !text.includes('detailed');
  }

  private isVague(text: string): boolean {
    const vaguePhrases = ['what about', 'tell me about', 'anything about'];
    return vaguePhrases.some(phrase => text.toLowerCase().includes(phrase)) || (text.length < 30 && this.hasVagueTerms(text));
  }

  private rewriteAsQuestion(text: string, analysis: any): string {
    // Rewrite questions to be more specific and contextually intelligent
    const lowerText = text.toLowerCase();
    
    // Political/Government queries
    if (lowerText.includes('president') || lowerText.includes('prime minister') || lowerText.includes('leader')) {
      if (lowerText.includes('who is') || lowerText.includes('who\'s')) {
        return `Please provide information about the current President of the United States, including their name, political party affiliation, key policies, and any significant achievements during their time in office. The response should be structured with an introductory sentence, followed by a brief overview of their background, and concluding with a summary of their main initiatives and accomplishments.`;
      }
    }
    
    // Person identification queries
    if (lowerText.startsWith('who is') || lowerText.startsWith('who\'s')) {
      const subject = text.replace(/^who\s+(is|'s)\s+/i, '').trim().replace(/\?$/, '');
      return `Please provide comprehensive information about ${subject}, including their background, notable achievements, current role or status, and significance in their field. Structure the response with: (1) a brief introduction, (2) key biographical details, (3) major accomplishments or contributions, and (4) their current relevance or impact.`;
    }
    
    // Definition/explanation queries
    if (lowerText.startsWith('what is') || lowerText.startsWith('what\'s')) {
      const subject = text.replace(/^what\s+(is|'s)\s+/i, '').trim().replace(/\?$/, '');
      return `Please provide a comprehensive explanation of ${subject}, including: (1) a clear definition, (2) key characteristics or components, (3) practical applications or examples, (4) historical context or development, and (5) current relevance or importance in today's context.`;
    }
    
    // Process/method queries
    if (lowerText.startsWith('how to') || lowerText.startsWith('how do') || lowerText.startsWith('how can')) {
      const task = text.replace(/^how\s+(to|do|can)\s+/i, '').trim().replace(/\?$/, '');
      return `Please provide a detailed, step-by-step guide on how to ${task}. Include: (1) necessary prerequisites or requirements, (2) clear sequential steps with specific instructions, (3) common challenges and how to overcome them, (4) best practices and tips for success, and (5) expected outcomes and how to measure success.`;
    }
    
    // Reasoning/causation queries
    if (lowerText.startsWith('why')) {
      const phenomenon = text.replace(/^why\s+/i, '').trim().replace(/\?$/, '');
      return `Please provide a comprehensive analysis of why ${phenomenon}. Structure your response to include: (1) primary causes and contributing factors, (2) underlying mechanisms or processes, (3) historical context and development, (4) supporting evidence and examples, and (5) implications and broader significance.`;
    }
    
    // Comparison queries
    if (lowerText.includes('difference between') || lowerText.includes('compare')) {
      return `Please provide a detailed comparison that includes: (1) clear definitions of each item being compared, (2) key similarities and differences, (3) specific examples illustrating these distinctions, (4) practical implications of these differences, and (5) guidance on when to use or choose one over the other.`;
    }
    
    // Location queries
    if (lowerText.startsWith('where is') || lowerText.startsWith('where\'s')) {
      const location = text.replace(/^where\s+(is|'s)\s+/i, '').trim().replace(/\?$/, '');
      return `Please provide detailed information about the location of ${location}, including: (1) precise geographical location with coordinates if relevant, (2) regional context and nearby landmarks, (3) accessibility and transportation options, (4) historical or cultural significance, and (5) current status or notable features.`;
    }
    
    // Time-based queries
    if (lowerText.startsWith('when') || lowerText.includes('what time')) {
      const event = text.replace(/^when\s+/i, '').replace(/what time/i, '').trim().replace(/\?$/, '');
      return `Please provide comprehensive temporal information about ${event}, including: (1) specific dates, times, or time periods, (2) historical context and background, (3) sequence of related events, (4) duration and timeline, and (5) significance of the timing and any recurring patterns.`;
    }
    
    // Generic question improvement with better context awareness
    const topic = analysis.topic || 'this topic';
    return `Please provide a comprehensive and well-structured response to: "${text}" Include relevant background information, specific details, practical examples, and ensure the response addresses all aspects of the question with clarity and depth.`;
  }

  private rewriteAsRequest(text: string, analysis: any): string {
    // Rewrite requests to be more structured and contextually intelligent
    const lowerText = text.toLowerCase();
    
    // Creation requests
    if (analysis.intent === 'creation' || lowerText.includes('create') || lowerText.includes('make') || lowerText.includes('build') || lowerText.includes('write')) {
      const subject = this.extractSubjectFromRequest(text);
      return `Please create ${subject} with the following comprehensive approach: (1) Define clear objectives and requirements, (2) Outline the structure and key components, (3) Provide detailed content with specific examples, (4) Include best practices and quality standards, (5) Suggest methods for testing or validation, and (6) Offer recommendations for improvement or iteration.`;
    }
    
    // Explanation requests
    if (analysis.intent === 'explanation' || lowerText.includes('explain') || lowerText.includes('describe') || lowerText.includes('tell me about')) {
      const subject = this.extractSubjectFromRequest(text);
      return `Please provide a comprehensive explanation of ${subject} that includes: (1) a clear overview and definition, (2) key concepts and principles, (3) practical applications and real-world examples, (4) step-by-step processes where applicable, (5) common misconceptions or challenges, and (6) current trends or future implications.`;
    }
    
    // Analysis requests
    if (analysis.intent === 'analysis' || lowerText.includes('analyze') || lowerText.includes('evaluate') || lowerText.includes('assess')) {
      const subject = this.extractSubjectFromRequest(text);
      return `Please conduct a thorough analysis of ${subject} that covers: (1) background context and current situation, (2) key factors and variables involved, (3) strengths, weaknesses, opportunities, and threats, (4) data-driven insights with supporting evidence, (5) comparative analysis with alternatives, and (6) actionable conclusions and recommendations.`;
    }
    
    // Comparison requests
    if (lowerText.includes('compare') || lowerText.includes('versus') || lowerText.includes('vs') || lowerText.includes('difference')) {
      return `Please provide a detailed comparison that includes: (1) clear definitions and background of each item, (2) systematic comparison across key dimensions, (3) advantages and disadvantages of each option, (4) specific use cases and scenarios, (5) quantitative data where available, and (6) recommendations based on different needs or contexts.`;
    }
    
    // Help/guidance requests
    if (analysis.intent === 'guidance' || lowerText.includes('help') || lowerText.includes('assist') || lowerText.includes('guide')) {
      const task = this.extractSubjectFromRequest(text);
      return `Please provide comprehensive guidance on ${task} that includes: (1) clear step-by-step instructions, (2) necessary prerequisites and preparation, (3) detailed explanations for each step, (4) common pitfalls and how to avoid them, (5) troubleshooting tips for potential issues, and (6) resources for further learning or support.`;
    }
    
    // Generic request improvement with better context
    const subject = this.extractSubjectFromRequest(text);
    return `Please provide a comprehensive response to the request: "${text}" Ensure the response includes: (1) clear structure and organization, (2) specific details and concrete examples, (3) practical applications and actionable insights, (4) relevant context and background information, and (5) thorough coverage of all aspects mentioned.`;
  }

  private rewriteAsGeneral(text: string, analysis: any): string {
    // Improve general prompts with contextual intelligence
    const lowerText = text.toLowerCase();
    
    // Handle vague or unclear prompts
    if (analysis.isVague || text.length < 20) {
      const topic = analysis.topic || 'the topic mentioned';
      return `Please provide a detailed and comprehensive response about ${topic}. Structure your response to include: (1) clear definitions and background context, (2) key concepts and important details, (3) practical examples and real-world applications, (4) current relevance and significance, and (5) actionable insights or takeaways for the reader.`;
    }
    
    // Handle statements that need more context
    if (!text.includes('?') && !lowerText.includes('please') && !lowerText.includes('help')) {
      return `Please provide a comprehensive analysis and discussion of: "${text}" Include relevant background information, multiple perspectives, supporting evidence, practical implications, and actionable insights. Structure the response clearly with specific examples and detailed explanations.`;
    }
    
    // Generic improvement with better structure
    return `Please provide a well-structured and comprehensive response to: "${text}" Ensure the response includes: (1) clear organization and logical flow, (2) specific details and concrete examples, (3) relevant context and background, (4) practical applications and implications, and (5) thorough coverage that addresses all aspects of the topic.`;
  }

  private rewriteForDetail(text: string, analysis: any): string {
    const topic = analysis.topic || 'this subject';
    return `Please provide an in-depth, detailed analysis of: ${text}\n\nInclude the following in your response:\n• Comprehensive background and context\n• Step-by-step breakdown of key components\n• Specific examples and case studies\n• Practical applications and implications\n• Potential challenges and solutions\n• Relevant data, statistics, or research findings\n• Actionable recommendations and next steps`;
  }

  private rewriteForProfessional(text: string, analysis: any): string {
    const topic = analysis.topic || 'this matter';
    return `Professional Analysis Request: ${text}\n\nPlease provide a structured, professional response that includes:\n\n1. Executive Summary\n2. Detailed Analysis of ${topic}\n3. Key Findings and Insights\n4. Supporting Evidence and Data\n5. Risk Assessment and Considerations\n6. Strategic Recommendations\n7. Implementation Guidelines\n8. Success Metrics and KPIs\n\nEnsure all recommendations are evidence-based and include specific, actionable steps.`;
  }

  private rewriteForCreative(text: string, analysis: any): string {
    const topic = analysis.topic || 'this concept';
    return `Creative Exploration: ${text}\n\nPlease approach ${topic} with innovative thinking and provide:\n\n• Multiple unique perspectives and angles\n• Creative analogies and metaphors\n• Unconventional connections and insights\n• Imaginative examples and scenarios\n• Fresh approaches that challenge conventional thinking\n• Inspiring and thought-provoking ideas\n• Practical creativity that balances innovation with feasibility\n\nThink outside the box while maintaining relevance and value.`;
  }
}
