import { AgentTool, AgentToolResult } from './tools';
import { ToolAwareAIProvider, ToolOutput } from '../providers/tool_types';
import {
  DEFAULT_TOOL_SECURITY_POLICY,
  ToolSecurityPolicy,
  sanitizeToolOutput,
  validateToolCall,
} from './tool_security';

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
    private readonly securityPolicy: ToolSecurityPolicy = DEFAULT_TOOL_SECURITY_POLICY,
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
        let output: string;
        try {
          validateToolCall(
            call.name,
            call.arguments,
            this.securityPolicy,
            calls.length,
          );

          const tool = this.tools.find(
            (candidate) => candidate.definition.name === call.name,
          );
          if (!tool) throw new Error(`Tool '${call.name}' is not registered.`);

          output = await tool.execute(call.arguments);
          output = sanitizeToolOutput(output, this.securityPolicy.maxOutputBytes);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown tool error.';
          output = sanitizeToolOutput(`Tool failed: ${message}`, this.securityPolicy.maxOutputBytes);
        }

        calls.push({ toolCallId: call.id, name: call.name, output });
        toolOutputs.push({ toolCallId: call.id, output });
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
