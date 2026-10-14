export type DocumentActionResult = {
  ok: boolean;
  message: string;
};

export type UploadResult =
  | { ok: true; documentId: string; message: string }
  | { ok: false; message: string };

export type RagCitation = {
  documentId: string;
  fileName: string;
  page: number;
  chunkIndex: number;
  snippet: string;
  score: number;
};

export type RagQueryResult =
  | { ok: true; answer: string; citations: RagCitation[] }
  | { ok: false; message: string };
