import { AIProvider, ChatOptions } from './types';

function localEmbedding(text: string): number[] {
  const vector = new Array<number>(64).fill(0);
  for (let i = 0; i < text.length; i += 1) vector[text.charCodeAt(i) % 64] += 1;
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

export class DemoProvider implements AIProvider {
  readonly name = 'demo';
  async embed(text: string) { return localEmbedding(text.toLowerCase()); }
  async chat(_prompt: string, options?: ChatOptions): Promise<string> {
    const context = options?.context ?? [];
    if (context.length === 0) return 'I could not find relevant information in the knowledge base.';
    return `Demo mode found relevant knowledge.\n\n${context.map((item) => item.chunk.text).join('\n\n')}`;
  }
}
