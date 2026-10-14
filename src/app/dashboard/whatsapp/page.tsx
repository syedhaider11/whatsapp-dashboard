import { WhatsAppConsole, type WhatsAppAccountView } from "@/components/screens/whatsapp-console";
import { prisma } from "@/lib/prisma";
import { hasPermission, requireUser } from "@/lib/auth-guard";

export const instant = false;

export default async function WhatsAppPage() {
  const user = await requireUser();

  const account = await prisma.whatsAppAccount.findFirst({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  const view: WhatsAppAccountView | null = account
    ? {
        id: account.id,
        name: account.name,
        phoneNumber: account.phoneNumber,
        phoneNumberId: account.phoneNumberId,
        wabaId: account.wabaId,
        status: account.status,
        qualityRating: account.qualityRating,
        messagingTier: account.messagingTier,
        processedEvents: account.processedEvents,
        lastError: account.lastError,
      }
    : null;

  return (
    <WhatsAppConsole
      account={view}
      canConnect={hasPermission(user, "whatsapp:connect")}
      canDisconnect={hasPermission(user, "whatsapp:disconnect")}
    />
  );
}
