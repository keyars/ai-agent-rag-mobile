import { describe, expect, it } from 'vitest';
import { DEFAULT_TOOL_SECURITY_POLICY, sanitizeToolOutput, validateToolCall } from '../src/ai/agent/tool_security';

describe('tool execution security', () => {
  it('rejects tools outside the allow-list', () => {
    expect(() => validateToolCall('shell', {}, DEFAULT_TOOL_SECURITY_POLICY, 0)).toThrow(/not allowed/);
  });

  it('rejects calls after the per-run limit', () => {
    expect(() => validateToolCall('get_current_time', {}, DEFAULT_TOOL_SECURITY_POLICY, 8)).toThrow(/limit/);
  });

  it('rejects oversized arguments', () => {
    const args = { value: 'x'.repeat(DEFAULT_TOOL_SECURITY_POLICY.maxArgumentBytes) };
    expect(() => validateToolCall('get_current_time', args, DEFAULT_TOOL_SECURITY_POLICY, 0)).toThrow(/arguments/);
  });

  it('bounds tool output', () => {
    const output = sanitizeToolOutput('abcdef', 3);
    expect(output).toContain('[tool output truncated]');
  });
});
