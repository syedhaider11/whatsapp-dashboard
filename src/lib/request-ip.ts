import { headers } from "next/headers";
import { parseClientIp } from "@/lib/rate-limit";

export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const parsed = parseClientIp(forwarded);
  if (parsed !== "unknown") return parsed;
  return store.get("x-real-ip")?.trim() || "unknown";
}
