export type DocumentChunk = {
  index: number;
  page: number;
  text: string;
};

const DEFAULT_TARGET_CHARS = 1800;
const DEFAULT_OVERLAP_CHARS = 200;

export function chunkText(
  text: string,
  targetChars: number = DEFAULT_TARGET_CHARS,
  overlapChars: number = DEFAULT_OVERLAP_CHARS,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + targetChars, normalized.length);
    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const lastSpace = window.lastIndexOf(" ");
      if (lastSpace > targetChars * 0.6) {
        end = start + lastSpace;
      }
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}

export function chunkPages(
  pages: string[],
  targetChars?: number,
  overlapChars?: number,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;

  pages.forEach((pageText, pageIndex) => {
    for (const text of chunkText(pageText, targetChars, overlapChars)) {
      chunks.push({ index: index++, page: pageIndex + 1, text });
    }
  });

  return chunks;
}
