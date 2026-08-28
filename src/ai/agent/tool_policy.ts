import { AgentTool } from './tools';
import { DEFAULT_TOOL_SECURITY_POLICY, ToolSecurityPolicy, sanitizeToolOutput, validateToolCall } from './tool_security';

export async function executeSecureTool(
  tool: AgentTool,
  arguments_: Record<string, unknown>,
  policy: ToolSecurityPolicy = DEFAULT_TOOL_SECURITY_POLICY,
  callsSoFar = 0,
): Promise<string> {
  validateToolCall(tool.definition.name, arguments_, policy, callsSoFar);
  const output = await tool.execute(arguments_);
  return sanitizeToolOutput(output, policy.maxOutputBytes);
}
