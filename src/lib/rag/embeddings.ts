import { embeddingModel, isEmbeddingConfigured, llmApiKey, llmBaseUrl } from "./config";
import type { RagResult } from "./result";

const MAX_BATCH = 64;

type EmbeddingResponse = {
  data?: { embedding?: number[]; index?: number }[];
  error?: { message?: string };
};

async function embedBatch(texts: string[]): Promise<RagResult<number[][]>> {
  try {
    const response = await fetch(`${llmBaseUrl()}/embeddings`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${llmApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: embeddingModel(), input: texts }),
    });

    const payload = (await response.json()) as EmbeddingResponse;

    if (!response.ok || payload.error) {
      return {
        ok: false,
        error: payload.error?.message ?? `Embedding provider returned ${response.status}.`,
      };
    }

    const ordered = [...(payload.data ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );
    const embeddings = ordered.map((item) => item.embedding ?? []);

    if (embeddings.length !== texts.length || embeddings.some((vector) => vector.length === 0)) {
      return { ok: false, error: "Embedding provider returned an unexpected vector count." };
    }

    return { ok: true, data: embeddings };
  } catch {
    return { ok: false, error: "Network error contacting the embedding provider." };
  }
}

export async function embedTexts(texts: string[]): Promise<RagResult<number[][]>> {
  if (!isEmbeddingConfigured()) {
    return { ok: false, error: "Embedding provider is not configured (LLM_API_KEY is empty)." };
  }
  if (texts.length === 0) return { ok: true, data: [] };

  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += MAX_BATCH) {
    const batch = texts.slice(start, start + MAX_BATCH);
    const result = await embedBatch(batch);
    if (!result.ok) return result;
    vectors.push(...result.data);
  }

  return { ok: true, data: vectors };
}

export async function embedQuery(text: string): Promise<RagResult<number[]>> {
  const result = await embedTexts([text]);
  if (!result.ok) return result;
  const [vector] = result.data;
  if (!vector) return { ok: false, error: "Embedding provider returned no vector." };
  return { ok: true, data: vector };
}
