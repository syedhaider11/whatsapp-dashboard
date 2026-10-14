import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "@/lib/meta/signature";
import { createHmac } from "node:crypto";

describe("signature", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ test: 1 });

  it("validates correct signature", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyMetaSignature(body, sig, secret)).toBe(true);
  });

  it("rejects tampered body", () => {
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyMetaSignature(body + "x", sig, secret)).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
  });
});
