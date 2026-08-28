import { describe, expect, it } from 'vitest';
import { ToolAgent } from '../src/ai/agent/tool_agent';
import { AgentTool } from '../src/ai/agent/tools';
import { ToolAwareAIProvider } from '../src/ai/providers/tool_types';
import { ToolSecurityPolicy } from '../src/ai/agent/tool_security';

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

  it('rejects a tool that is not in the security allow-list', async () => {
    const provider: ToolAwareAIProvider = {
      async chatWithTools() {
        return {
          responseId: 'resp-1',
          toolCalls: [{ id: 'call-1', name: 'shell', arguments: {} }],
        };
      },
    };

    const result = await new ToolAgent(provider, [clock]).run('Run shell', 'Use tools.');

    expect(result.calls[0]?.output).toContain('not allowed');
  });

  it('bounds tool output before returning it to the model', async () => {
    const noisyTool: AgentTool = {
      definition: {
        name: 'get_current_time',
        description: 'Returns a large value',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
      async execute() {
        return 'x'.repeat(100);
      },
    };

    const provider: ToolAwareAIProvider = {
      async chatWithTools() {
        return {
          responseId: 'resp-1',
          toolCalls: [{ id: 'call-1', name: 'get_current_time', arguments: {} }],
        };
      },
    };
    const policy: ToolSecurityPolicy = {
      allowedTools: new Set(['get_current_time']),
      maxArgumentBytes: 8192,
      maxOutputBytes: 16,
      maxCallsPerRun: 8,
    };

    const result = await new ToolAgent(provider, [noisyTool], 1, policy).run('time', 'Use tools.');

    expect(result.calls[0]?.output).toContain('[tool output truncated]');
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

    const policy: ToolSecurityPolicy = {
      allowedTools: new Set(['loop']),
      maxArgumentBytes: 8192,
      maxOutputBytes: 16384,
      maxCallsPerRun: 8,
    };
    const result = await new ToolAgent(provider, [loopingTool], 2, policy).run(
      'Keep going',
      'Use tools.',
    );

    expect(result.iterations).toBe(2);
    expect(result.text).toContain('safety limit');
    expect(result.calls).toHaveLength(2);
  });
});
