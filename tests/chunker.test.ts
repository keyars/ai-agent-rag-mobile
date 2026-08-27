import { describe, expect, it } from 'vitest';
import { chunkText } from '../src/rag/chunker';

describe('chunkText', () => {
  it('returns no chunks for empty input', () => expect(chunkText('   ')).toEqual([]));
  it('keeps short documents intact', () => expect(chunkText('hello world')).toEqual(['hello world']));
  it('splits long documents within the configured limit', () => {
    const input = Array.from({ length: 20 }, (_, i) => `Paragraph ${i}: ${'alpha beta gamma '.repeat(20)}`).join('\n\n');
    const chunks = chunkText(input, { maxCharacters: 500, overlapCharacters: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 500)).toBe(true);
    expect(chunks.join('\n')).toContain('Paragraph 0:');
    expect(chunks.join('\n')).toContain('Paragraph 19:');
  });
});
