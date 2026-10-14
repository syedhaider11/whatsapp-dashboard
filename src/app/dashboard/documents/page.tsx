import { prisma } from "@/lib/prisma";
import { hasPermission, requireUser } from "@/lib/auth-guard";
import {
  embeddingModel,
  chromaCollectionName,
  chromaConnection,
  isEmbeddingConfigured,
  isLlmConfigured,
} from "@/lib/rag/config";
import { chromaHeartbeat } from "@/lib/rag/vector-store";
import {
  DocumentsConsole,
  type DocumentItem,
} from "@/components/screens/documents-console";

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const instant = false;

export default async function DocumentsPage() {
  const user = await requireUser();

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
  });

  const heartbeat = await Promise.race([
    chromaHeartbeat(),
    new Promise<{ ok: false; error: string }>((resolve) =>
      setTimeout(() => resolve({ ok: false, error: "timeout" }), 1500),
    ),
  ]);

  const items: DocumentItem[] = documents.map((document) => ({
    id: document.id,
    fileName: document.fileName,
    fileSizeLabel: humanSize(document.fileSize),
    status: document.status,
    ownerName: document.uploadedBy?.name ?? "System",
    chunkCount: document.chunkCount,
    pageCount: document.pageCount,
    collectionId: document.collectionId,
    error: document.error,
    createdAtLabel: dateLabel(document.createdAt),
    hasFile: true,
  }));

  const connection = chromaConnection();

  return (
    <DocumentsConsole
      documents={items}
      canUpload={hasPermission(user, "documents:upload")}
      canDelete={hasPermission(user, "documents:delete")}
      rag={{
        embeddingConfigured: isEmbeddingConfigured(),
        llmConfigured: isLlmConfigured(),
        chromaOnline: heartbeat.ok,
        chromaUrl: `${connection.ssl ? "https" : "http"}://${connection.host}:${connection.port}`,
        collection: chromaCollectionName(),
        embeddingModel: embeddingModel(),
      }}
    />
  );
}
