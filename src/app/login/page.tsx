import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth-guard";
import { LoginForm } from "./login-form";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  await connection();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-space-md py-space-2xl">
      <div className="w-full max-w-sm">
        <div className="mb-space-xl flex flex-col items-center gap-space-sm text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
            <Icon name="forum" className="text-[28px]" filled />
          </span>
          <div className="flex flex-col">
            <h1 className="text-headline-md text-on-surface">WABA Ops Portal</h1>
            <p className="tnum text-label-sm text-on-surface-variant">v20.0 Core</p>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-space-xl shadow-sm">
          <div className="mb-space-lg flex flex-col gap-1">
            <h2 className="text-headline-md text-on-surface">Sign in</h2>
            <p className="text-body-sm text-on-surface-variant">
              Authorized personnel only. Access is gated by role-based permissions.
            </p>
          </div>
          <LoginForm callbackUrl={callbackUrl} initialError={params.error} />
        </div>

        <p className="mt-space-lg text-center text-[10px] font-medium text-on-surface-variant">
          Internal Business Portal · Meta Cloud API v20.0 · PostgreSQL &amp; ChromaDB Integrated
        </p>
      </div>
    </main>
  );
}
