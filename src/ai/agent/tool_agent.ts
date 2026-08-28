import { AgentTool, AgentToolResult } from './tools';
import { ToolAwareAIProvider, ToolOutput } from '../providers/tool_types';

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
    let toolOutputs: ToolOutput[] | undefined;

    for (let iteration = 1; iteration <= this.maxIterations; iteration += 1) {
      const result = await this.provider.chatWithTools(nextPrompt, {
        system,
        tools: this.tools.map((tool) => tool.definition),
        toolChoice: 'auto',
        previousResponseId: responseId,
        toolOutputs,
      });

      responseId = result.responseId;
      nextPrompt = '';
      toolOutputs = undefined;

      if (result.toolCalls.length === 0) {
        return {
          text: result.text ?? 'The model did not return a final answer.',
          calls,
          iterations: iteration,
        };
      }

      toolOutputs = [];
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
          const output =
            error instanceof Error ? `Tool failed: ${error.message}` : 'Tool failed.';
          calls.push({ toolCallId: call.id, name: call.name, output });
          toolOutputs.push({ toolCallId: call.id, output });
        }
      }

      if (iteration === this.maxIterations) {
        return {
          text: 'The agent stopped after reaching its tool-call safety limit.',
          calls,
          iterations: iteration,
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
