import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/permissions";

describe("permissions", () => {
  it("respects all permissions", () => {
    expect(hasPermission({ permissions: ["dashboard:view"] }, "dashboard:view")).toBe(true);
    expect(hasPermission({ permissions: [] }, "documents:upload")).toBe(false);
    expect(hasPermission(null, "messages:send")).toBe(false);
  });
});
