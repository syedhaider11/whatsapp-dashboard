import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const STORAGE_DIR = path.join(process.cwd(), "storage", "documents");

export function storageDir(): string {
  return STORAGE_DIR;
}

export async function ensureStorageDir(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
}

export async function saveDocumentFile(file: {
  buffer: Buffer | Uint8Array;
  fileName: string;
}): Promise<{ relativePath: string; absolutePath: string }> {
  await ensureStorageDir();
  const extension = path.extname(file.fileName).toLowerCase() === ".pdf" ? ".pdf" : ".bin";
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(STORAGE_DIR, storedName);
  await writeFile(absolutePath, file.buffer);
  return { relativePath: toRelativePath(absolutePath), absolutePath };
}

export function toRelativePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).split(path.sep).join("/");
}

export function resolveStoredFile(relativePath: string): string {
  const fileName = path.basename(relativePath);
  if (!fileName || fileName === "." || fileName === "..") {
    throw new Error("Invalid document path.");
  }
  return path.join(STORAGE_DIR, fileName);
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  return readFile(resolveStoredFile(relativePath));
}

export async function storedFileExists(relativePath: string): Promise<boolean> {
  try {
    const info = await stat(resolveStoredFile(relativePath));
    return info.isFile();
  } catch {
    return false;
  }
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  try {
    await unlink(resolveStoredFile(relativePath));
  } catch {
    // Missing files are treated as already deleted.
  }
}

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME = "application/pdf";
