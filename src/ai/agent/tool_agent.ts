import { AgentTool, AgentToolResult } from './tools';
import { ToolAwareAIProvider } from '../providers/tool_types';

export interface ToolAgentResult {
  text: string;
  calls: AgentToolResult[];
  iterations: number;
}

export class ToolAgent {
  constructor(
    private readonly provider: ToolAwareAIProvider,
    private readonly tools: AgentTool[],
    private readonly maxIterations = 4,
  ) {}

  async run(prompt: string, system: string): Promise<ToolAgentResult> {
    const calls: AgentToolResult[] = [];
    let responseId: string | undefined;
    let nextPrompt = prompt;

    for (let iteration = 1; iteration <= this.maxIterations; iteration += 1) {
      const result = await this.provider.chatWithTools(nextPrompt, {
        system,
        tools: this.tools.map((tool) => tool.definition),
        toolChoice: 'auto',
        previousResponseId: responseId,
      });

      responseId = result.responseId;

      if (result.toolCalls.length === 0) {
        return {
          text: result.text ?? 'The model did not return a final answer.',
          calls,
          iterations: iteration,
        };
      }

      const toolOutputs = [];
      for (const call of result.toolCalls) {
        const tool = this.tools.find(
          (candidate) => candidate.definition.name === call.name,
        );

        if (!tool) {
          const output = `Unknown tool: ${call.name}`;
          calls.push({ toolCallId: call.id, name: call.name, output });
          toolOutputs.push({ toolCallId: call.id, output });
          continue;
        }

        try {
          const output = await tool.execute(call.arguments);
          calls.push({ toolCallId: call.id, name: call.name, output });
          toolOutputs.push({ toolCallId: call.id, output });
        } catch (error) {
          const output = error instanceof Error ? `Tool failed: ${error.message}` : 'Tool failed.';
          calls.push({ toolCallId: call.id, name: call.name, output });
          toolOutputs.push({ toolCallId: call.id, output });
        }
      }

      nextPrompt = '';
      const continuation = await this.provider.chatWithTools('', {
        system,
        tools: this.tools.map((tool) => tool.definition),
        toolChoice: 'auto',
        previousResponseId: responseId,
        toolOutputs,
      });

      responseId = continuation.responseId;

      if (continuation.toolCalls.length === 0) {
        return {
          text: continuation.text ?? 'The model did not return a final answer.',
          calls,
          iterations: iteration + 1,
        };
      }

      for (const call of continuation.toolCalls) {
        const tool = this.tools.find(
          (candidate) => candidate.definition.name === call.name,
        );
        const output = tool
          ? await tool.execute(call.arguments)
          : `Unknown tool: ${call.name}`;
        calls.push({ toolCallId: call.id, name: call.name, output });
        nextPrompt = '';
      }

      if (iteration === this.maxIterations) {
        return {
          text: 'The agent stopped after reaching its tool-call safety limit.',
          calls,
          iterations: this.maxIterations,
        };
      }
    }

    return {
      text: 'The agent stopped after reaching its tool-call safety limit.',
      calls,
      iterations: this.maxIterations,
    };
  }
}
