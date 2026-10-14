import { describe, expect, it, beforeEach } from "vitest";
import { chromaCollectionName, embeddingModel, llmModel, llmBaseUrl } from "@/lib/rag/config";

describe("rag config", () => {
  beforeEach(() => {
    delete process.env.EMBEDDING_MODEL;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_BASE_URL;
    delete process.env.CHROMA_COLLECTION;
  });

  it("has defaults", () => {
    expect(embeddingModel()).toBe("text-embedding-3-small");
    expect(llmModel()).toBe("gpt-4o-mini");
    expect(llmBaseUrl()).toBe("https://api.openai.com/v1");
    expect(chromaCollectionName()).toBe("waba_documents");
  });
});
