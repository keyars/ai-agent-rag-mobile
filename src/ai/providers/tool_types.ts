import { AgentToolCall, AgentToolDefinition } from '../agent/tools';

export interface ToolOutput {
  toolCallId: string;
  output: string;
}

export interface ToolAwareChatOptions {
  system?: string;
  tools?: AgentToolDefinition[];
  toolChoice?: 'auto' | 'none';
  prompt?: string;
  previousResponseId?: string;
  toolOutputs?: ToolOutput[];
}

export interface ToolAwareChatResult {
  responseId: string;
  text?: string;
  toolCalls: AgentToolCall[];
}

export interface ToolAwareAIProvider {
  chatWithTools(prompt: string, options?: ToolAwareChatOptions): Promise<ToolAwareChatResult>;
}
