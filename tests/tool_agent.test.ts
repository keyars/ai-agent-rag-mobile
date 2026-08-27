import { describe, expect, it } from 'vitest';
import { ToolAgent } from '../src/ai/agent/tool_agent';
import { AgentTool } from '../src/ai/agent/tools';
import { ToolAwareAIProvider } from '../src/ai/providers/tool_types';

const clock: AgentTool = { definition: { name: 'get_current_time', description: 'Returns time', parameters: { type: 'object', properties: {} } }, async execute() { return '21:30'; } };

class FakeToolProvider implements ToolAwareAIProvider {
  private count = 0;
  async chatWithTools() {
    this.count += 1;
    if (this.count === 1) return { toolCalls: [{ id: 'call-1', name: 'get_current_time', arguments: {} }] };
    return { text: 'The current time is 21:30.', toolCalls: [] };
  }
}

describe('bounded tool agent', () => {
  it('executes a model-selected tool and then returns the final answer', async () => {
    const result = await new ToolAgent(new FakeToolProvider(), [clock]).run('What time is it?', 'Use tools when appropriate.');
    expect(result.text).toContain('21:30');
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]?.name).toBe('get_current_time');
    expect(result.iterations).toBe(2);
  });
});
