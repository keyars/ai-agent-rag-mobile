import { AIProvider, ChatOptions } from './types';
import { ToolAwareAIProvider, ToolAwareChatOptions, ToolAwareChatResult } from './tool_types';

export class OpenAIProvider implements AIProvider, ToolAwareAIProvider {
  readonly name = 'openai';
  constructor(private readonly apiKey: string, private readonly model = 'gpt-5.4', private readonly embeddingModel = 'text-embedding-3-small') {}
  async embed(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.embeddingModel, input: text }) });
    if (!response.ok) throw new Error(`OpenAI embeddings failed (${response.status}).`);
    const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
    const vector = data.data?.[0]?.embedding;
    if (!vector) throw new Error('OpenAI returned no embedding.');
    return vector;
  }
  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const result = await this.request(prompt, { system: options.system });
    if (result.text) return result.text;
    throw new Error('OpenAI returned no text.');
  }
  async chatWithTools(prompt: string, options: ToolAwareChatOptions = {}): Promise<ToolAwareChatResult> {
    return this.request(prompt, options);
  }
  private async request(prompt: string, options: ToolAwareChatOptions = {}): Promise<ToolAwareChatResult> {
    const tools = options.tools?.map((tool) => ({ type: 'function', name: tool.name, description: tool.description, parameters: tool.parameters }));
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.model, instructions: options.system, input: options.messages?.length ? options.messages : prompt, tools, tool_choice: options.toolChoice }) });
    if (!response.ok) throw new Error(`OpenAI response failed (${response.status}).`);
    const data = await response.json() as { output_text?: string; output?: Array<{ type?: string; id?: string; name?: string; arguments?: string }> };
    const toolCalls = (data.output ?? []).filter((item) => item.type === 'function_call' && item.name).map((item) => ({ id: item.id ?? `call_${Date.now()}`, name: item.name!, arguments: JSON.parse(item.arguments ?? '{}') }));
    return { text: data.output_text || undefined, toolCalls };
  }
}
