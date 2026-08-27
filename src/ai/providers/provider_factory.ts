import { ProviderName } from '../../types';
import { AIProvider } from './types';
import { ClaudeProvider } from './claude_provider';
import { DemoProvider } from './demo_provider';
import { GeminiProvider } from './gemini_provider';
import { OpenAIProvider } from './openai_provider';

export interface ProviderConfig { provider: ProviderName; openaiApiKey: string; geminiApiKey: string; claudeApiKey: string; }

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case 'openai': if (!config.openaiApiKey.trim()) throw new Error('Add an OpenAI API key in Settings.'); return new OpenAIProvider(config.openaiApiKey.trim());
    case 'gemini': if (!config.geminiApiKey.trim()) throw new Error('Add a Gemini API key in Settings.'); return new GeminiProvider(config.geminiApiKey.trim());
    case 'claude': if (!config.claudeApiKey.trim()) throw new Error('Add a Claude API key in Settings.'); return new ClaudeProvider(config.claudeApiKey.trim());
    default: return new DemoProvider();
  }
}
