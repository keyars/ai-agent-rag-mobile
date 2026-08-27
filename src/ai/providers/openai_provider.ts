import { AIProvider, ChatOptions } from './types';

export class OpenAIProvider implements AIProvider {
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
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: this.model, instructions: options.system, input: prompt }) });
    if (!response.ok) throw new Error(`OpenAI response failed (${response.status}).`);
    const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    if (data.output_text) return data.output_text;
    const text = data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('');
    if (!text) throw new Error('OpenAI returned no text.');
    return text;
  }
}
