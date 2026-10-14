"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guard";
import { RATE_LIMITS, consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
  deleteStoredFile,
  saveDocumentFile,
} from "@/lib/documents/storage";
import type {
  DocumentActionResult,
  RagQueryResult,
  UploadResult,
} from "@/lib/documents/types";
import { embedQuery } from "@/lib/rag/embeddings";
import { synthesizeAnswer } from "@/lib/rag/llm";
import { processDocument } from "@/lib/rag/pipeline";
import { deleteDocumentChunks, queryChunks } from "@/lib/rag/vector-store";

const PDF_MAGIC = "%PDF-";
const TOP_K = 5;

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const user = await requirePermission("documents:upload");

  const limit = await consumeRateLimit(`document:${user.id}`, RATE_LIMITS.documentUpload);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "uploads") };
  }

  const entry = formData.get("file");
  if (!entry || typeof entry === "string") {
    return { ok: false, message: "Select a PDF file to upload." };
  }
  const file = entry as File;

  if (file.type && file.type !== ALLOWED_DOCUMENT_MIME) {
    return { ok: false, message: "Only PDF documents are supported." };
  }
  if (file.size === 0) {
    return { ok: false, message: "The selected file is empty." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, message: `File exceeds the ${humanSize(MAX_DOCUMENT_BYTES)} limit.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    return { ok: false, message: "The file does not appear to be a valid PDF." };
  }

  const saved = await saveDocumentFile({ buffer, fileName: file.name });

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      filePath: saved.relativePath,
      fileSize: buffer.byteLength,
      fileType: ALLOWED_DOCUMENT_MIME,
      status: "PENDING",
      uploadedById: user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DOCUMENT_UPLOADED",
      targetType: "document",
      targetId: document.id,
      metadata: { fileName: file.name, fileSize: buffer.byteLength },
    },
  });

  const result = await processDocument({
    documentId: document.id,
    relativePath: saved.relativePath,
    fileName: file.name,
  });

  if (!result.ok) {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DOCUMENT_FAILED",
        targetType: "document",
        targetId: document.id,
        metadata: { fileName: file.name, error: result.error },
      },
    });
    revalidatePath("/dashboard/documents");
    return { ok: false, message: `Stored, but indexing failed: ${result.error}` };
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DOCUMENT_INDEXED",
      targetType: "document",
      targetId: document.id,
      metadata: {
        fileName: file.name,
        chunks: result.chunkCount,
        pages: result.pageCount,
      },
    },
  });

  revalidatePath("/dashboard/documents");
  return {
    ok: true,
    documentId: document.id,
    message: `${file.name} indexed with ${result.chunkCount} chunks.`,
  };
}

export async function deleteDocument(documentId: string): Promise<DocumentActionResult> {
  const user = await requirePermission("documents:delete");

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, message: "Document not found." };

  const vectorResult = await deleteDocumentChunks(documentId);
  await deleteStoredFile(document.filePath);
  await prisma.document.delete({ where: { id: documentId } });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DOCUMENT_DELETED",
      targetType: "document",
      targetId: documentId,
      metadata: { fileName: document.fileName, vectorsPruned: vectorResult.ok },
    },
  });

  revalidatePath("/dashboard/documents");
  return {
    ok: true,
    message: vectorResult.ok
      ? `${document.fileName} and its vectors were deleted.`
      : `${document.fileName} was deleted (vector store unavailable).`,
  };
}

export async function reprocessDocument(documentId: string): Promise<DocumentActionResult> {
  const user = await requirePermission("documents:upload");

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, message: "Document not found." };

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PENDING", error: null },
  });

  const result = await processDocument({
    documentId: document.id,
    relativePath: document.filePath,
    fileName: document.fileName,
  });

  if (!result.ok) {
    revalidatePath("/dashboard/documents");
    return { ok: false, message: `Re-indexing failed: ${result.error}` };
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "DOCUMENT_INDEXED",
      targetType: "document",
      targetId: document.id,
      metadata: {
        fileName: document.fileName,
        chunks: result.chunkCount,
        pages: result.pageCount,
        reprocessed: true,
      },
    },
  });

  revalidatePath("/dashboard/documents");
  return { ok: true, message: `${document.fileName} re-indexed with ${result.chunkCount} chunks.` };
}

export async function ragQuery(question: string): Promise<RagQueryResult> {
  await requirePermission("documents:upload");

  const limit = await consumeRateLimit(`rag:query`, RATE_LIMITS.ragQuery);
  if (!limit.allowed) {
    return { ok: false, message: rateLimitMessage(limit, "queries") };
  }

  const trimmed = question.trim();
  if (trimmed.length < 3) {
    return { ok: false, message: "Enter a question with at least 3 characters." };
  }

  const embedded = await embedQuery(trimmed);
  if (!embedded.ok) return { ok: false, message: embedded.error };

  const matches = await queryChunks(embedded.data, TOP_K);
  if (!matches.ok) return { ok: false, message: matches.error };
  if (matches.data.length === 0) {
    return { ok: false, message: "No indexed documents matched your question." };
  }

  const answer = await synthesizeAnswer(
    trimmed,
    matches.data.map((match) => ({
      fileName: match.fileName,
      page: match.page,
      content: match.content,
    })),
  );
  if (!answer.ok) return { ok: false, message: answer.error };

  return {
    ok: true,
    answer: answer.data,
    citations: matches.data.map((match) => ({
      documentId: match.documentId,
      fileName: match.fileName,
      page: match.page,
      chunkIndex: match.index,
      snippet: match.content.slice(0, 200),
      score: Math.max(0, 1 - match.distance),
    })),
  };
}
