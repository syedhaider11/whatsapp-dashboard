import { prisma } from "@/lib/prisma";
import { hasPermission, requireUser } from "@/lib/auth-guard";
import { TemplatesConsole, type TemplateItem } from "@/components/screens/templates-console";

function relativeLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const instant = false;

export default async function TemplatesPage() {
  const user = await requireUser();

  const templates = await prisma.messageTemplate.findMany({
    include: { createdBy: true, _count: { select: { messages: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const items: TemplateItem[] = templates.map((template) => ({
    id: template.id,
    name: template.name,
    body: template.body,
    language: template.language,
    category: template.category,
    status: template.status,
    variables: template.variables,
    createdByLabel: template.createdBy?.name ?? "System",
    updatedLabel: relativeLabel(template.updatedAt),
  }));

  return <TemplatesConsole templates={items} canManage={hasPermission(user, "templates:manage")} />;
}
