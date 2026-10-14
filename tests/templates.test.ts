import { describe, expect, it } from "vitest";
import { extractVariables } from "@/lib/templates";

describe("templates", () => {
  it("extracts sorted variables", () => {
    expect(extractVariables("Hi {{1}}, see {{3}} and {{2}}")).toEqual(["1", "2", "3"]);
    expect(extractVariables("No vars")).toEqual([]);
    expect(extractVariables("{{1}} {{1}} {{10}}")).toEqual(["1", "10"]);
  });
});
