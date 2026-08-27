import { AgentTool, AgentToolCall, AgentToolResult } from './tools';
import { ToolAwareAIProvider } from '../providers/tool_types';

export interface ToolAgentResult { text: string; calls: AgentToolResult[]; iterations: number; }

export class ToolAgent {
  constructor(private readonly provider: ToolAwareAIProvider, private readonly tools: AgentTool[], private readonly maxIterations = 4) {}

  async run(prompt: string, system: string): Promise<ToolAgentResult> {
    const calls: AgentToolResult[] = [];
    let messages: Array<{ role: 'user' | 'assistant' | 'tool'; content: string; toolCallId?: string; toolName?: string }> = [{ role: 'user', content: prompt }];
    for (let iteration = 1; iteration <= this.maxIterations; iteration += 1) {
      const result = await this.provider.chatWithTools(prompt, {
        system,
        tools: this.tools.map((tool) => tool.definition),
        toolChoice: 'auto',
        messages,
      });
      if (result.toolCalls.length === 0) return { text: result.text ?? 'The model did not return a final answer.', calls, iterations: iteration };
      messages = [...messages, { role: 'assistant', content: result.text ?? '', }];
      for (const call of result.toolCalls) {
        const tool = this.tools.find((candidate) => candidate.definition.name === call.name);
        if (!tool) {
          calls.push({ toolCallId: call.id, name: call.name, output: `Unknown tool: ${call.name}` });
          messages.push({ role: 'tool', content: `Unknown tool: ${call.name}`, toolCallId: call.id, toolName: call.name });
          continue;
        }
        const output = await tool.execute(call.arguments);
        calls.push({ toolCallId: call.id, name: call.name, output });
        messages.push({ role: 'tool', content: output, toolCallId: call.id, toolName: call.name });
      }
    }
    return { text: 'The agent stopped after reaching its tool-call safety limit.', calls, iterations: this.maxIterations };
  }
}
