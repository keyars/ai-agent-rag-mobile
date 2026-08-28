# Tool Execution Security

The mobile agent uses an explicit tool allow-list, bounded arguments and outputs, and a per-run call budget. Unknown tools are never executed. Tool failures are converted into bounded tool results so the model cannot turn an exception into an uncontrolled execution path.

## Design rules

- Only registered tools may execute.
- Each run has a maximum number of tool calls.
- Tool arguments have a byte-size limit.
- Tool outputs have a byte-size limit and are truncated before being returned to the model.
- Tool implementations must validate their own business-specific inputs.
- Never expose API keys, credentials, filesystem paths, or private application state through a tool result.
- Treat retrieved documents as untrusted data; document text must never be interpreted as executable instructions or tool authorization.

This is defense-in-depth, not a replacement for backend authorization when deploying tools that can mutate external systems.
