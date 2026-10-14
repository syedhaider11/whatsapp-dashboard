import { prisma } from "@/lib/prisma";
import { requirePermissionPage } from "@/lib/auth-guard";
import { GRAPH_VERSION } from "@/lib/meta/client";
import {
  SettingsConsole,
  type AccountSettings,
  type ConfigRow,
} from "@/components/screens/settings-console";

function maskDatabaseUrl(url: string | undefined): { value: string; configured: boolean } {
  if (!url) return { value: "Not configured", configured: false };
  try {
    const parsed = new URL(url);
    return { value: `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`, configured: true };
  } catch {
    return { value: "Configured", configured: true };
  }
}

export const instant = false;

export default async function SettingsPage() {
  await requirePermissionPage("settings:manage");

  const account = await prisma.whatsAppAccount.findFirst({
    where: { isActive: true },
    include: { connectedBy: true },
    orderBy: { updatedAt: "desc" },
  });

  const accountSettings: AccountSettings | null = account
    ? {
        id: account.id,
        name: account.name,
        phoneNumber: account.phoneNumber,
        status: account.status,
        qualityRating: account.qualityRating,
        messagingTier: account.messagingTier,
        webhookUrl: account.webhookUrl,
        graphVersion: GRAPH_VERSION,
        processedEvents: account.processedEvents,
        connectedByLabel: account.connectedBy?.name ?? null,
      }
    : null;

  const database = maskDatabaseUrl(process.env.DATABASE_URL);

  const serverConfig: ConfigRow[] = [
    { label: "PostgreSQL", value: database.value, icon: "database", configured: database.configured },
    {
      label: "Auth session secret",
      value: process.env.AUTH_SESSION_SECRET ? "Configured" : "Missing",
      icon: "key",
      configured: Boolean(process.env.AUTH_SESSION_SECRET),
    },
    {
      label: "Meta app secret",
      value: process.env.META_APP_SECRET ? "Configured" : "Missing",
      icon: "shield_lock",
      configured: Boolean(process.env.META_APP_SECRET),
    },
    {
      label: "Webhook verify token",
      value: process.env.META_WEBHOOK_VERIFY_TOKEN ? "Configured" : "Missing",
      icon: "verified",
      configured: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
    },
    { label: "Meta Graph API", value: GRAPH_VERSION, icon: "graph_2", configured: true },
    {
      label: "ChromaDB endpoint",
      value: process.env.CHROMA_URL ?? "Not configured",
      icon: "hub",
      configured: Boolean(process.env.CHROMA_URL),
    },
    {
      label: "LLM API key",
      value: process.env.LLM_API_KEY ? "Configured" : "Missing",
      icon: "key",
      configured: Boolean(process.env.LLM_API_KEY),
    },
    {
      label: "Embedding model",
      value: process.env.EMBEDDING_MODEL ?? "Not configured",
      icon: "model_training",
      configured: Boolean(process.env.EMBEDDING_MODEL),
    },
  ];

  return <SettingsConsole account={accountSettings} serverConfig={serverConfig} />;
}
