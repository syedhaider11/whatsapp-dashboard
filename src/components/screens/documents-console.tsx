"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Icon,
  Modal,
  ProgressBar,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  deleteDocument,
  ragQuery,
  reprocessDocument,
  uploadDocument,
} from "@/app/dashboard/documents/actions";

export type DocumentItem = {
  id: string;
  fileName: string;
  fileSizeLabel: string;
  status: string;
  ownerName: string;
  chunkCount: number;
  pageCount: number | null;
  collectionId: string | null;
  error: string | null;
  createdAtLabel: string;
  hasFile: boolean;
};

export type RagStatus = {
  embeddingConfigured: boolean;
  llmConfigured: boolean;
  chromaOnline: boolean;
  chromaUrl: string;
  collection: string;
  embeddingModel: string;
};

type Props = {
  documents: DocumentItem[];
  canUpload: boolean;
  canDelete: boolean;
  rag: RagStatus;
};

type Citation = {
  documentId: string;
  fileName: string;
  page: number;
  chunkIndex: number;
  snippet: string;
  score: number;
};

type Phase = "ready" | "processing" | "indexing" | "pending" | "failed";

const STAGES = [
  { label: "Validate", hint: "Format & size" },
  { label: "Storage", hint: "Local secure fs" },
  { label: "Metadata", hint: "PostgreSQL" },
  { label: "Extract", hint: "PDF text" },
  { label: "Embed", hint: "Chunking (500t)" },
  { label: "ChromaDB", hint: "Vector index" },
];

const STATUS_STAGE_LABEL: Record<string, string> = {
  PENDING: "Queued for ingestion",
  VALIDATING: "Validating format & size",
  STORING: "Storing on local filesystem",
  EXTRACTING: "Extracting PDF text",
  EMBEDDING: "Creating embeddings",
  INDEXING: "Indexing into ChromaDB",
  READY: "Indexed and ready",
  FAILED: "Ingestion failed",
};

const STATUS_PROGRESS: Record<string, number> = {
  PENDING: 5,
  VALIDATING: 15,
  STORING: 30,
  EXTRACTING: 50,
  EMBEDDING: 75,
  INDEXING: 90,
  READY: 100,
  FAILED: 0,
};

function phaseOf(status: string): Phase {
  switch (status) {
    case "READY":
      return "ready";
    case "FAILED":
      return "failed";
    case "INDEXING":
      return "indexing";
    case "PENDING":
      return "pending";
    default:
      return "processing";
  }
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function DocumentsConsole({ documents, canUpload, canDelete, rag }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailsFor, setDetailsFor] = useState<DocumentItem | null>(null);
  const [deleteFor, setDeleteFor] = useState<DocumentItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ragReady = rag.embeddingConfigured && rag.llmConfigured && rag.chromaOnline;
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);

  async function handleUpload(file: File) {
    if (!canUpload) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const result = await uploadDocument(formData);
      toast(result.message, result.ok ? "success" : "error");
    } catch {
      toast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function runQuery(value?: string) {
    const question = (value ?? query).trim();
    if (value !== undefined) setQuery(value);
    if (question.length < 3) return;
    setSearching(true);
    setAnswer(null);
    setCitations([]);
    try {
      const result = await ragQuery(question);
      if (result.ok) {
        setAnswer(result.answer);
        setCitations(result.citations);
      } else {
        toast(result.message, "error");
      }
    } catch {
      toast("Semantic query failed.", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleDelete() {
    if (!deleteFor) return;
    const target = deleteFor;
    setDeleteFor(null);
    setBusyId(target.id);
    try {
      const result = await deleteDocument(target.id);
      toast(result.message, result.ok ? "success" : "error");
    } catch {
      toast("Delete failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReprocess(document: DocumentItem) {
    setBusyId(document.id);
    try {
      const result = await reprocessDocument(document.id);
      toast(result.message, result.ok ? "success" : "error");
    } catch {
      toast("Re-index failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  function inspect(citation: Citation) {
    const document = documents.find((item) => item.id === citation.documentId);
    if (document) setDetailsFor(document);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-md">
      <div className="rounded-xl bg-surface-container-high p-space-md shadow-sm">
        <div className="flex items-start gap-space-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="account_tree" className="text-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <div className="mb-1 flex items-center gap-space-xs">
              <span className="text-headline-sm text-on-surface">Storage &amp; Vector Architecture</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  ragReady ? "bg-primary/15 text-primary" : "bg-error-container/50 text-error",
                )}
              >
                {ragReady ? "Active" : "Offline"}
              </span>
            </div>
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              PostgreSQL manages relational metadata. Uploaded PDFs reside at{" "}
              <span className="font-medium text-on-surface">storage/documents/</span>. ChromaDB stores embeddings and
              vector chunks for RAG semantic search. Complete PDFs are never stored in databases.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-space-xs text-[10px] text-on-surface-variant">
              <span className="flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5">
                <Icon name="hub" className="text-[12px]" /> {rag.chromaUrl}
              </span>
              <span className="flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5">
                <Icon name="database" className="text-[12px]" /> {rag.collection}
              </span>
              <span className="flex items-center gap-1 rounded bg-surface-container px-1.5 py-0.5">
                <Icon name="blur_on" className="text-[12px]" /> {rag.embeddingModel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-space-xs">
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
          <div className="mb-1 flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-semibold uppercase text-outline">Docs</span>
            <Icon name="picture_as_pdf" className="text-[16px] text-primary" />
          </div>
          <span className="text-headline-lg font-bold text-on-surface">{formatCount(documents.length)}</span>
          <span className="text-[10px] text-on-surface-variant">Indexed library</span>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
          <div className="mb-1 flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-semibold uppercase text-outline">Chunks</span>
            <Icon name="scatter_plot" className="text-[16px] text-secondary" />
          </div>
          <span className="text-headline-lg font-bold text-on-surface">{formatCount(totalChunks)}</span>
          <span className="text-[10px] font-medium text-secondary">{rag.embeddingModel}</span>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
          <div className="mb-1 flex items-center justify-between text-on-surface-variant">
            <span className="text-[10px] font-semibold uppercase text-outline">HNSW</span>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                rag.chromaOnline ? "animate-pulse bg-tertiary-fixed-dim" : "bg-error",
              )}
            />
          </div>
          <span className={cn("mt-1 text-headline-sm font-bold", rag.chromaOnline ? "text-primary" : "text-error")}>
            {rag.chromaOnline ? "Ready" : "Offline"}
          </span>
          <span className="text-[10px] text-on-surface-variant">Cosine Dist</span>
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="upload_file" className="text-[20px] text-primary" />
              <h2 className="text-headline-sm text-on-surface">Ingest &amp; Embed PDF</h2>
            </div>
            <span className="text-[11px] text-outline">Max 25 MB</span>
          </div>

          <div
            onClick={() => canUpload && !uploading && fileRef.current?.click()}
            className={cn(
              "group flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-space-lg text-center transition-all",
              canUpload && !uploading ? "cursor-pointer hover:bg-surface-container" : "cursor-not-allowed opacity-60",
            )}
          >
            <div className="mb-space-xs flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <Icon name={uploading ? "autorenew" : "cloud_upload"} className={cn("text-[28px]", uploading && "animate-spin")} />
            </div>
            <span className="text-headline-sm font-semibold text-on-surface">
              {uploading ? "Running ingestion pipeline…" : "Tap to upload PDF document"}
            </span>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              {canUpload
                ? "Drag files or click to parse into vector pipeline"
                : "You do not have permission to upload documents"}
            </p>
            <div className="mt-space-sm flex items-center gap-space-xs">
              <span className="flex items-center gap-1 rounded-lg bg-primary px-space-md py-1.5 text-label-md font-semibold text-on-primary shadow-sm">
                <Icon name="add" className="text-[16px]" /> Upload PDF
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              aria-label="Upload PDF Document"
              disabled={!canUpload || uploading}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
          </div>

          <div className="flex flex-col gap-space-xs pt-space-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                Ingestion Pipeline Workflow
              </span>
              <span className="text-[11px] font-medium text-primary">ChromaDB + {rag.embeddingModel}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {STAGES.map((stage, index) => (
                <div
                  key={stage.label}
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-2",
                    stage.label === "Embed" ? "bg-secondary-container/40" : "bg-surface-container-low",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      stage.label === "Embed" ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold leading-tight text-on-surface">{stage.label}</p>
                    <p
                      className={cn(
                        "truncate text-[9px]",
                        stage.label === "Embed" ? "font-medium text-secondary" : "text-on-surface-variant",
                      )}
                    >
                      {stage.hint}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="psychology" className="text-[22px] text-secondary" />
              <div>
                <h2 className="text-headline-sm text-on-surface">RAG Semantic Query</h2>
                <p className="text-[10px] text-on-surface-variant">
                  {rag.collection} + {rag.llmConfigured ? "LLM synthesis" : "LLM not configured"}
                </p>
              </div>
            </div>
            <Badge tone="secondary">KNN Top 5</Badge>
          </div>

          {!ragReady ? (
            <div className="flex items-start gap-2 rounded-xl bg-error-container/30 p-space-sm text-[12px] text-on-surface">
              <Icon name="warning" className="text-[18px] text-error" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Semantic search is unavailable.</span>
                <span className="text-on-surface-variant">
                  {!rag.embeddingConfigured
                    ? "Set LLM_API_KEY to enable embeddings and LLM synthesis."
                    : !rag.chromaOnline
                      ? `ChromaDB is unreachable at ${rag.chromaUrl}.`
                      : "The language model is not configured."}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-space-xs">
            <div className="relative flex items-center">
              <Icon name="search" className="pointer-events-none absolute left-3 text-[18px] text-outline" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!ragReady || searching}
                placeholder="Ask a question across indexed PDF documents (ChromaDB + LLM)..."
                className="w-full rounded-lg bg-surface-container-low py-2 pl-9 pr-10 text-[13px] text-on-surface placeholder:text-outline focus:bg-surface-container focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                aria-label="Submit semantic search"
                disabled={!ragReady || searching}
                onClick={() => void runQuery()}
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50"
              >
                <Icon name={searching ? "autorenew" : "arrow_forward"} className={cn("text-[16px]", searching && "animate-spin")} />
              </button>
            </div>
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="shrink-0 text-[10px] font-semibold uppercase text-outline">Try:</span>
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={!ragReady || searching}
                  onClick={() => void runQuery(prompt)}
                  className="shrink-0 whitespace-nowrap rounded bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {answer ? (
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-center gap-1.5">
                <Icon name="verified" className="text-[18px] text-primary" />
                <span className="text-label-md font-semibold text-primary">Generated RAG Context</span>
              </div>
              <p className="whitespace-pre-line text-body-md leading-relaxed text-on-surface">{answer}</p>
              {citations.length > 0 ? (
                <div className="flex flex-col gap-1.5 pt-space-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    Verified Source Citations
                  </span>
                  {citations.map((citation, index) => (
                    <div
                      key={`${citation.documentId}-${citation.chunkIndex}`}
                      className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-2 text-on-surface shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon name="bookmark" className="shrink-0 text-[18px] text-primary" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-label-md font-semibold">
                            [{index + 1}] {citation.fileName}
                          </span>
                          <span className="truncate text-[10px] text-on-surface-variant">
                            Page {citation.page} • Chunk #{citation.chunkIndex} • Similarity{" "}
                            {(citation.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="shrink-0" onClick={() => inspect(citation)}>
                        Inspect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-space-xs">
            <Icon name="folder_special" className="text-[20px] text-on-surface" />
            <h2 className="text-headline-sm text-on-surface">Indexed Documents</h2>
          </div>
          <span className="text-body-sm text-on-surface-variant">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </span>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-2 py-space-lg text-center">
              <Icon name="folder_off" className="text-[32px] text-outline" />
              <p className="text-body-md font-semibold text-on-surface">No documents indexed yet</p>
              <p className="text-body-sm text-on-surface-variant">
                Upload a PDF to build your RAG knowledge base.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-space-xs">
            {documents.map((document) => {
              const phase = phaseOf(document.status);
              const busy = busyId === document.id;
              const progress = STATUS_PROGRESS[document.status] ?? 0;
              const stageLabel = STATUS_STAGE_LABEL[document.status] ?? document.status;
              return (
                <Card key={document.id}>
                  <CardBody className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-space-sm">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            phase === "ready" && "bg-primary/10 text-primary",
                            phase === "processing" && "bg-surface-container-high text-on-surface",
                            phase === "indexing" && "bg-secondary-container/40 text-secondary",
                            phase === "pending" && "bg-surface-container-high text-on-surface",
                            phase === "failed" && "bg-error-container/40 text-error",
                          )}
                        >
                          <Icon
                            name={
                              phase === "processing"
                                ? "pending_actions"
                                : phase === "indexing"
                                  ? "autorenew"
                                  : phase === "failed"
                                    ? "error"
                                    : phase === "pending"
                                      ? "hourglass_top"
                                      : "description"
                            }
                            className={cn("text-[22px]", phase === "indexing" && "animate-spin")}
                          />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-headline-sm font-semibold text-on-surface">{document.fileName}</h3>
                          <p className="text-[11px] text-on-surface-variant">
                            {document.fileSizeLabel} • {document.ownerName}
                            {document.chunkCount > 0 ? ` • ${formatCount(document.chunkCount)} chunks` : ""}
                          </p>
                        </div>
                      </div>
                      {phase === "ready" ? (
                        <Badge tone="secondary" pill>
                          Ready
                        </Badge>
                      ) : phase === "failed" ? (
                        <span className="shrink-0 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase text-error">
                          Failed
                        </span>
                      ) : phase === "indexing" ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" /> Indexing
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface">
                          {phase === "pending" ? "Queued" : "Processing"}
                        </span>
                      )}
                    </div>

                    {phase === "processing" || phase === "indexing" || phase === "pending" ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" /> {stageLabel}
                          </span>
                          <span className="text-[10px] text-outline">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                    ) : null}

                    {phase === "failed" && document.error ? (
                      <div className="flex items-start gap-2 rounded-lg bg-error-container/30 p-2">
                        <Icon name="error" className="shrink-0 text-[16px] text-error" />
                        <span className="text-[11px] text-on-surface">{document.error}</span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between pt-1 text-on-surface-variant">
                      <span className="text-[10px] text-outline">PostgreSQL ID: {document.id}</span>
                      <div className="flex items-center gap-1">
                        {phase === "failed" && canUpload ? (
                          <button
                            type="button"
                            aria-label="Re-index document"
                            disabled={busy}
                            onClick={() => void handleReprocess(document)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40"
                          >
                            <Icon name={busy ? "autorenew" : "refresh"} className={cn("text-[16px]", busy && "animate-spin")} />
                          </button>
                        ) : null}
                        {phase === "ready" && document.hasFile ? (
                          <a
                            href={`/api/documents/${document.id}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open PDF"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container"
                          >
                            <Icon name="open_in_new" className="text-[16px]" />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          aria-label="View details"
                          onClick={() => setDetailsFor(document)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container"
                        >
                          <Icon name="info" className="text-[16px]" />
                        </button>
                        {canDelete ? (
                          <button
                            type="button"
                            aria-label="Delete document"
                            disabled={busy}
                            onClick={() => setDeleteFor(document)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-error-container/40 text-error hover:bg-error-container disabled:opacity-40"
                          >
                            <Icon name="delete" className="text-[16px]" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={deleteFor !== null} onClose={() => setDeleteFor(null)} className="max-w-sm">
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-start gap-space-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container/40 text-error">
              <Icon name="warning" className="text-[24px]" />
            </span>
            <div>
              <h3 className="text-headline-sm font-bold text-on-surface">Delete Document?</h3>
              <p className="mt-1 text-body-sm leading-snug text-on-surface-variant">
                This will remove the file from local filesystem, delete metadata in PostgreSQL, and prune all vectors
                from ChromaDB.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-surface-container-low p-2.5">
            <p className="truncate text-label-md font-semibold text-on-surface">{deleteFor?.fileName}</p>
            <p className="text-[10px] text-outline">{formatCount(deleteFor?.chunkCount ?? 0)} chunks</p>
          </div>
          <div className="flex items-center justify-end gap-space-xs pt-1">
            <Button variant="secondary" size="sm" onClick={() => setDeleteFor(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => void handleDelete()}>
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailsFor !== null} onClose={() => setDetailsFor(null)} align="bottom" className="max-w-md">
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center justify-between pb-space-xs">
            <div className="flex items-center gap-space-xs">
              <Icon name="snippet_folder" className="text-[22px] text-primary" />
              <h3 className="text-headline-sm font-bold text-on-surface">Metadata &amp; Vector Info</h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setDetailsFor(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
          <div className="flex flex-col gap-space-xs text-[12px]">
            {(
              [
                ["File Name", detailsFor?.fileName],
                ["File Size", detailsFor?.fileSizeLabel],
                ["Pages", detailsFor?.pageCount ? String(detailsFor.pageCount) : "—"],
                ["ChromaDB Chunks", formatCount(detailsFor?.chunkCount ?? 0)],
                ["Collection", detailsFor?.collectionId ?? rag.collection],
                ["Status", detailsFor ? STATUS_STAGE_LABEL[detailsFor.status] : undefined],
                ["Uploaded By", detailsFor?.ownerName],
                ["Uploaded On", detailsFor?.createdAtLabel],
                ["Physical Storage", "storage/documents/"],
              ] as [string, string | undefined][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 rounded bg-surface-container-low px-2 py-1.5">
                <span className="shrink-0 text-label-sm text-on-surface-variant">{label}</span>
                <span className="truncate font-semibold text-on-surface">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-space-xs">
            {detailsFor?.status === "READY" && detailsFor.hasFile ? (
              <a
                href={`/api/documents/${detailsFor.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary text-label-sm font-semibold text-on-primary hover:bg-primary-container"
              >
                <Icon name="open_in_new" className="text-[16px]" /> Open PDF
              </a>
            ) : null}
            <Button variant="secondary" size="sm" block onClick={() => setDetailsFor(null)}>
              Close Inspector
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const PROMPTS = [
  "What is our guaranteed uptime for Meta Cloud API webhooks?",
  "What are the vendor data retention terms under section 4.2?",
  "Summarize MFA requirements for tier-3 admin access.",
];
