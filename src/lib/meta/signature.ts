import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined,
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const [scheme, value] = signatureHeader.split("=");
  if (scheme !== "sha256" || !value) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = Buffer.from(value, "hex");
  const computed = Buffer.from(expected, "hex");

  return provided.length === computed.length && timingSafeEqual(provided, computed);
}
