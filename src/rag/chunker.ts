export interface ChunkOptions { maxCharacters?: number; overlapCharacters?: number; }

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
  if (!normalized) return [];
  const max = Math.max(200, options.maxCharacters ?? 900);
  const overlap = Math.min(Math.max(0, options.overlapCharacters ?? 120), max - 1);
  if (normalized.length <= max) return [normalized];
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (paragraph.length > max) {
      if (current) { chunks.push(current); current = ''; }
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(paragraph.length, start + max);
        chunks.push(paragraph.slice(start, end).trim());
        if (end === paragraph.length) break;
        start = end - overlap;
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= max) current = candidate;
    else { chunks.push(current); current = `${current.slice(Math.max(0, current.length - overlap))}\n\n${paragraph}`.trim(); }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}
