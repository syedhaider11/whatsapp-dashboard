import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("hashes and verifies passwords", async () => {
    const hashed = await hashPassword("SuperAdmin#2026");
    expect(hashed).toMatch(/^scrypt\$/);
    expect(await verifyPassword("SuperAdmin#2026", hashed)).toBe(true);
    expect(await verifyPassword("wrong", hashed)).toBe(false);
  });
});
