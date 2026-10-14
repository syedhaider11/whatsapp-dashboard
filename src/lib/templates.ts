export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*(\d+)\s*\}\}/g);
  const found = new Set<string>();
  for (const match of matches) found.add(match[1]);
  return [...found].sort((a, b) => Number(a) - Number(b));
}

export const TEMPLATE_STATUS_META: Record<
  "DRAFT" | "PENDING" | "APPROVED" | "REJECTED",
  { label: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};
