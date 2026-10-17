import { describe, expect, it } from "vitest";
import { toE164 } from "@/lib/phone";

describe("phone normalisation", () => {
  it("adds the country code to local seven-digit numbers", () => {
    expect(toE164("440 1234", "+1473")).toBe("+14734401234");
    expect(toE164("456-1234", "+1784")).toBe("+17844561234");
  });
  it("accepts numbers with an area code or international prefix", () => {
    expect(toE164("(473) 440-1234", "+1784")).toBe("+14734401234");
    expect(toE164("1 784 456 1234", "+1473")).toBe("+17844561234");
    expect(toE164("+44 7700 900123", "+1473")).toBe("+447700900123");
  });
  it("treats an empty field as no number", () => {
    expect(toE164("  ", "+1473")).toBeNull();
  });
  it("rejects text that isn't a phone number", () => {
    expect(() => toE164("call me", "+1473")).toThrow(/doesn’t look like a phone number/);
  });
});
