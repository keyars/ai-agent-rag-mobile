import { AgentToolCall, AgentToolDefinition } from '../agent/tools';

export interface ToolAwareChatOptions {
  system?: string;
  tools?: AgentToolDefinition[];
  toolChoice?: 'auto' | 'none';
  messages?: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolCallId?: string;
    toolName?: string;
  }>;
}

export interface ToolAwareChatResult {
  text?: string;
  toolCalls: AgentToolCall[];
}

export interface ToolAwareAIProvider {
  chatWithTools(prompt: string, options?: ToolAwareChatOptions): Promise<ToolAwareChatResult>;
}
