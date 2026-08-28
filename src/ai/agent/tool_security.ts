export interface ToolSecurityPolicy {
  allowedTools: ReadonlySet<string>;
  maxArgumentBytes: number;
  maxOutputBytes: number;
  maxCallsPerRun: number;
}

export const DEFAULT_TOOL_SECURITY_POLICY: ToolSecurityPolicy = {
  allowedTools: new Set(['get_current_time', 'knowledge_search']),
  maxArgumentBytes: 8_192,
  maxOutputBytes: 16_384,
  maxCallsPerRun: 8,
};

export function validateToolCall(
  name: string,
  arguments_: Record<string, unknown>,
  policy: ToolSecurityPolicy,
  callsSoFar: number,
): void {
  if (!policy.allowedTools.has(name)) throw new Error(`Tool '${name}' is not allowed.`);
  if (callsSoFar >= policy.maxCallsPerRun) throw new Error('Tool call limit exceeded.');
  const bytes = new TextEncoder().encode(JSON.stringify(arguments_)).byteLength;
  if (bytes > policy.maxArgumentBytes) throw new Error('Tool arguments exceed the safety limit.');
}

export function sanitizeToolOutput(output: string, maxBytes: number): string {
  const bytes = new TextEncoder().encode(output);
  if (bytes.byteLength <= maxBytes) return output;
  return new TextDecoder().decode(bytes.slice(0, maxBytes)) + '\n[tool output truncated]';
}
