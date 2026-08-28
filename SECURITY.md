# Security Model

This reference application uses defense-in-depth controls around both tool execution and retrieved knowledge.

## Tool execution

- Only registered tools may execute.
- The default policy allows `get_current_time` and `knowledge_search` only.
- Each run has a maximum number of tool calls.
- Tool arguments have a byte-size limit.
- Tool outputs have a byte-size limit and are truncated before being returned to the model.
- Tool implementations must validate their own business-specific inputs.
- Unknown or disallowed model-selected tools are never executed.

## Retrieved knowledge

- Retrieved documents are treated as untrusted data, never as instructions.
- Retrieved text is isolated inside an explicit context boundary before being sent to the model.
- Document content must never become a system/developer message, tool authorization, credential source, or policy override.
- Prompt-injection text inside a document must be treated as document content, not an instruction to the agent.
- Source names are escaped before being inserted into the structured retrieval boundary.

## Sensitive data

Never expose API keys, credentials, filesystem paths, or private application state through a tool result or retrieved context.

## Production boundary

These controls are application-level defense-in-depth. They are not a replacement for backend authorization, tenant isolation, audit logging, rate limiting, or secret management when deploying tools that can mutate external systems.
