import { AIProvider, ChatOptions } from './types';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  constructor(private readonly apiKey: string, private readonly model = 'claude-sonnet-4-6') {}
  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(64).fill(0);
    for (let i = 0; i < text.length; i += 1) vector[text.charCodeAt(i) % 64] += 1;
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / norm);
  }
  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: this.model, max_tokens: 1200, system: options.system, messages: [{ role: 'user', content: prompt }] }) });
    if (!response.ok) throw new Error(`Claude response failed (${response.status}).`);
    const data = await response.json() as { content?: Array<{ type?: string; text?: string }> };
    const text = data.content?.filter((item) => item.type === 'text').map((item) => item.text ?? '').join('');
    if (!text) throw new Error('Claude returned no text.');
    return text;
  }
}
