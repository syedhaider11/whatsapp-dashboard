import { ChromaClient, type Collection } from "chromadb";
import { chromaCollectionName, chromaConnection } from "./config";
import type { RagResult } from "./result";

const COLLECTION_METADATA = { "hnsw:space": "cosine" };
const UPSERT_BATCH = 256;

export type StoredChunk = {
  index: number;
  page: number;
  text: string;
};

export type MatchedChunk = {
  documentId: string;
  fileName: string;
  page: number;
  index: number;
  content: string;
  distance: number;
};

let client: ChromaClient | null = null;
let collectionPromise: Promise<Collection> | null = null;

function getClient(): ChromaClient {
  if (!client) {
    const { host, port, ssl } = chromaConnection();
    client = new ChromaClient({ host, port, ssl });
  }
  return client;
}

async function getCollection(): Promise<Collection> {
  if (!collectionPromise) {
    collectionPromise = getClient()
      .getOrCreateCollection({
        name: chromaCollectionName(),
        metadata: COLLECTION_METADATA,
        embeddingFunction: null,
      })
      .catch((error: unknown) => {
        collectionPromise = null;
        throw error;
      });
  }
  return collectionPromise;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "ChromaDB request failed.";
}

export async function chromaHeartbeat(): Promise<RagResult<number>> {
  try {
    const beat = await getClient().heartbeat();
    return { ok: true, data: beat };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function indexChunks(
  documentId: string,
  fileName: string,
  chunks: StoredChunk[],
  embeddings: number[][],
): Promise<RagResult<number>> {
  if (chunks.length !== embeddings.length) {
    return { ok: false, error: "Chunk and embedding counts do not match." };
  }

  try {
    const collection = await getCollection();

    for (let start = 0; start < chunks.length; start += UPSERT_BATCH) {
      const batch = chunks.slice(start, start + UPSERT_BATCH);
      const vectors = embeddings.slice(start, start + UPSERT_BATCH);
      await collection.upsert({
        ids: batch.map((chunk) => `${documentId}:${chunk.index}`),
        embeddings: vectors,
        documents: batch.map((chunk) => chunk.text),
        metadatas: batch.map((chunk) => ({
          documentId,
          fileName,
          page: chunk.page,
          index: chunk.index,
        })),
      });
    }

    return { ok: true, data: chunks.length };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function queryChunks(
  embedding: number[],
  nResults: number,
): Promise<RagResult<MatchedChunk[]>> {
  try {
    const collection = await getCollection();
    const result = await collection.query({
      queryEmbeddings: [embedding],
      nResults,
      include: ["documents", "metadatas", "distances"],
    });

    const metadatas = result.metadatas[0] ?? [];
    const documents = result.documents[0] ?? [];
    const distances = result.distances[0] ?? [];

    const matches: MatchedChunk[] = [];
    for (let index = 0; index < documents.length; index += 1) {
      const content = documents[index];
      const metadata = metadatas[index];
      if (content === null || !metadata) continue;
      matches.push({
        documentId: String(metadata.documentId ?? ""),
        fileName: String(metadata.fileName ?? "Unknown document"),
        page: Number(metadata.page ?? 1),
        index: Number(metadata.index ?? index),
        content,
        distance: distances[index] ?? 1,
      });
    }

    return { ok: true, data: matches };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function deleteDocumentChunks(documentId: string): Promise<RagResult<number>> {
  try {
    const collection = await getCollection();
    const result = await collection.delete({ where: { documentId } });
    return { ok: true, data: result.deleted ?? 0 };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function collectionCount(): Promise<RagResult<number>> {
  try {
    const collection = await getCollection();
    const count = await collection.count();
    return { ok: true, data: count };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}
