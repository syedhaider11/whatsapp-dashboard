"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Icon, Input } from "@/components/ui";

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ? "Invalid email or password." : "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Invalid email or password.");
      setPending(false);
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-lg">
      <Input
        id="email"
        label="Work email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        leadingIcon="mail"
        placeholder="you@meta-waba.internal"
        autoComplete="email"
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        leadingIcon="lock"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error ? (
        <p className="flex items-center gap-space-xs rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">
          <Icon name="error" className="text-[18px]" />
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        block
        disabled={pending}
        className="mt-space-xs"
      >
        {pending ? (
          <>
            <Icon name="progress_activity" className="text-[18px] animate-spin" />
            Authenticating…
          </>
        ) : (
          <>
            <Icon name="login" className="text-[18px]" />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
