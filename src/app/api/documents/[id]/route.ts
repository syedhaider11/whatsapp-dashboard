import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/documents/storage";

export const instant = false;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!session.user.permissions.includes("documents:upload")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return new NextResponse("Not found", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(document.filePath);
  } catch {
    return new NextResponse("File unavailable", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.fileType || "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
