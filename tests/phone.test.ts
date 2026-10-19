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

import { toE164International } from "@/lib/phone";

describe("international contact numbers", () => {
  it("accepts visitors' numbers from abroad", () => {
    expect(toE164International("07835 028032", "+44")).toBe("+447835028032");
    expect(toE164International("+44 7835 028032", "+1473")).toBe("+447835028032");
    expect(toE164International("0044 7835 028032", "+1473")).toBe("+447835028032");
    expect(toE164International("(212) 555-0147", "+1")).toBe("+12125550147");
    expect(toE164International("050 123 4567", "+966")).toBe("+966501234567");
  });
  it("still handles local Caribbean numbers", () => {
    expect(toE164International("440 1234", "+1473")).toBe("+14734401234");
    expect(toE164International("455 1234", "+1784")).toBe("+17844551234");
    expect(toE164International("868 555 0147", "+1868")).toBe("+18685550147");
  });
  it("rejects nonsense with a helpful message", () => {
    expect(() => toE164International("123", "+44")).toThrow(/doesn’t look like/);
    expect(() => toE164International("7835028032", "other")).toThrow(/starting with \+/);
  });
});
