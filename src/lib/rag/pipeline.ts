import { extractText } from "unpdf";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/documents/storage";
import { chunkPages } from "./chunker";
import { embedTexts } from "./embeddings";
import { deleteDocumentChunks, indexChunks } from "./vector-store";

export type PipelineResult =
  | { ok: true; chunkCount: number; pageCount: number }
  | { ok: false; error: string };

export type ProcessDocumentInput = {
  documentId: string;
  relativePath: string;
  fileName: string;
};

async function setStatus(
  documentId: string,
  status: "VALIDATING" | "STORING" | "EXTRACTING" | "EMBEDDING" | "INDEXING",
): Promise<void> {
  await prisma.document.update({ where: { id: documentId }, data: { status } });
}

export async function processDocument(input: ProcessDocumentInput): Promise<PipelineResult> {
  const { documentId, relativePath, fileName } = input;

  try {
    await setStatus(documentId, "VALIDATING");
    await readStoredFile(relativePath);

    await setStatus(documentId, "STORING");

    await setStatus(documentId, "EXTRACTING");
    const buffer = await readStoredFile(relativePath);
    const { totalPages, text } = await extractText(new Uint8Array(buffer), { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    await prisma.document.update({ where: { id: documentId }, data: { pageCount: totalPages } });

    await setStatus(documentId, "EMBEDDING");
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new Error("No extractable text found (scanned/image-only PDFs are not supported).");
    }
    const embeddingResult = await embedTexts(chunks.map((chunk) => chunk.text));
    if (!embeddingResult.ok) throw new Error(embeddingResult.error);
    await prisma.document.update({
      where: { id: documentId },
      data: { chunkCount: chunks.length },
    });

    await setStatus(documentId, "INDEXING");
    const stale = await deleteDocumentChunks(documentId);
    if (!stale.ok) throw new Error(stale.error);
    const indexResult = await indexChunks(documentId, fileName, chunks, embeddingResult.data);
    if (!indexResult.ok) throw new Error(indexResult.error);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY", error: null },
    });

    return { ok: true, chunkCount: chunks.length, pageCount: totalPages };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Document ingestion failed.";
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", error: errorMessage.slice(0, 500) },
    });
    return { ok: false, error: errorMessage };
  }
}
