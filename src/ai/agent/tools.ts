export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentToolResult {
  toolCallId: string;
  name: string;
  output: string;
}

export interface AgentTool {
  definition: AgentToolDefinition;
  execute(arguments_: Record<string, unknown>): Promise<string>;
}

export const currentTimeAgentTool: AgentTool = {
  definition: {
    name: 'get_current_time',
    description: 'Get the current local device time. Use this when the user asks what time it is.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  async execute() {
    return new Date().toLocaleString();
  },
};
