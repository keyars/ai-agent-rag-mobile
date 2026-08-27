import { AIProvider, ChatOptions } from './types';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  constructor(private readonly apiKey: string, private readonly model = 'gemini-2.5-flash', private readonly embeddingModel = 'gemini-embedding-2') {}
  private url(model: string, method: string) { return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${this.apiKey}`; }
  async embed(text: string): Promise<number[]> {
    const response = await fetch(this.url(this.embeddingModel, 'embedContent'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: { parts: [{ text }] } }) });
    if (!response.ok) throw new Error(`Gemini embeddings failed (${response.status}).`);
    const data = await response.json() as { embedding?: { values?: number[] } };
    if (!data.embedding?.values) throw new Error('Gemini returned no embedding.');
    return data.embedding.values;
  }
  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const response = await fetch(this.url(this.model, 'generateContent'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: options.system ? { parts: [{ text: options.system }] } : undefined, contents: [{ role: 'user', parts: [{ text: prompt }] }] }) });
    if (!response.ok) throw new Error(`Gemini response failed (${response.status}).`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
    if (!text) throw new Error('Gemini returned no text.');
    return text;
  }
}
