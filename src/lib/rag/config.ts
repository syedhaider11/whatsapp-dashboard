const DEFAULT_LLM_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_LLM_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CHROMA_URL = "http://localhost:8000";
const DEFAULT_COLLECTION = "waba_documents";

function trimmed(value: string | undefined): string {
  return value?.trim() ?? "";
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export type ChromaConnection = {
  host: string;
  port: number;
  ssl: boolean;
  collection: string;
};

export function llmApiKey(): string {
  return trimmed(process.env.LLM_API_KEY);
}

export function llmBaseUrl(): string {
  return withoutTrailingSlash(trimmed(process.env.LLM_BASE_URL) || DEFAULT_LLM_BASE_URL);
}

export function llmModel(): string {
  return trimmed(process.env.LLM_MODEL) || DEFAULT_LLM_MODEL;
}

export function embeddingModel(): string {
  return trimmed(process.env.EMBEDDING_MODEL) || DEFAULT_EMBEDDING_MODEL;
}

export function chromaCollectionName(): string {
  return trimmed(process.env.CHROMA_COLLECTION) || DEFAULT_COLLECTION;
}

export function chromaConnection(): ChromaConnection {
  const raw = trimmed(process.env.CHROMA_URL) || DEFAULT_CHROMA_URL;
  try {
    const url = new URL(raw);
    const ssl = url.protocol === "https:";
    const port = url.port ? Number(url.port) : ssl ? 443 : 8000;
    return { host: url.hostname, port, ssl, collection: chromaCollectionName() };
  } catch {
    return { host: "localhost", port: 8000, ssl: false, collection: chromaCollectionName() };
  }
}

export function isEmbeddingConfigured(): boolean {
  return llmApiKey().length > 0;
}

export function isLlmConfigured(): boolean {
  return llmApiKey().length > 0;
}

export const RAG_DEFAULTS = {
  llmBaseUrl: DEFAULT_LLM_BASE_URL,
  llmModel: DEFAULT_LLM_MODEL,
  embeddingModel: DEFAULT_EMBEDDING_MODEL,
  chromaUrl: DEFAULT_CHROMA_URL,
  collection: DEFAULT_COLLECTION,
};
