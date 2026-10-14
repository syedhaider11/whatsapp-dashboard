import { describe, expect, it } from "vitest";
import { chunkPages, chunkText } from "@/lib/rag/chunker";

describe("chunker", () => {
  it("splits long text into overlapping chunks", () => {
    const text = "a ".repeat(5000).trim();
    const chunks = chunkText(text, 1800, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeGreaterThan(0);
  });

  it("chunks by pages", () => {
    const pages = ["p1 line1 line2", "p2 content"];
    const chunks = chunkPages(pages, 100, 10);
    expect(chunks[0].page).toBe(1);
    expect(chunks.at(-1)?.page).toBe(2);
  });
});
