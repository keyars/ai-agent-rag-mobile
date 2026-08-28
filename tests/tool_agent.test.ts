import { describe, expect, it } from 'vitest';
import { ToolAgent } from '../src/ai/agent/tool_agent';
import { AgentTool } from '../src/ai/agent/tools';
import { ToolAwareAIProvider } from '../src/ai/providers/tool_types';

const clock: AgentTool = {
  definition: {
    name: 'get_current_time',
    description: 'Returns time',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  async execute() {
    return '21:30';
  },
};

class FakeToolProvider implements ToolAwareAIProvider {
  private count = 0;
  private lastOptions: Parameters<ToolAwareAIProvider['chatWithTools']>[1] | undefined;

  async chatWithTools(_prompt: string, options = {}) {
    this.count += 1;
    this.lastOptions = options;

    if (this.count === 1) {
      return {
        responseId: 'resp-1',
        toolCalls: [{ id: 'call-1', name: 'get_current_time', arguments: {} }],
      };
    }

    expect(this.lastOptions?.previousResponseId).toBe('resp-1');
    expect(this.lastOptions?.toolOutputs).toEqual([
      { toolCallId: 'call-1', output: '21:30' },
    ]);

    return {
      responseId: 'resp-2',
      text: 'The current time is 21:30.',
      toolCalls: [],
    };
  }
}

describe('bounded tool agent', () => {
  it('executes a model-selected tool and submits its output to the continuation', async () => {
    const result = await new ToolAgent(new FakeToolProvider(), [clock]).run(
      'What time is it?',
      'Use tools when appropriate.',
    );

    expect(result.text).toContain('21:30');
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]?.name).toBe('get_current_time');
    expect(result.iterations).toBe(2);
  });

  it('stops safely at the configured iteration limit', async () => {
    const loopingTool: AgentTool = {
      definition: {
        name: 'loop',
        description: 'Always requests another iteration',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
      async execute() {
        return 'looped';
      },
    };

    const provider: ToolAwareAIProvider = {
      async chatWithTools() {
        return {
          responseId: 'loop-response',
          toolCalls: [{ id: 'loop-call', name: 'loop', arguments: {} }],
        };
      },
    };

    const result = await new ToolAgent(provider, [loopingTool], 2).run(
      'Keep going',
      'Use tools.',
    );

    expect(result.iterations).toBe(2);
    expect(result.text).toContain('safety limit');
    expect(result.calls).toHaveLength(2);
  });
});
