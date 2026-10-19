import { describe, expect, it } from "vitest";
import { pathBelongsTo } from "@/lib/media";

describe("photo paths", () => {
  const id = "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90";
  it("accepts files in the business's own folder", () => {
    expect(pathBelongsTo(id, `${id}/cover-123-ab12c.webp`)).toBe(true);
  });
  it("rejects other folders and path tricks", () => {
    expect(pathBelongsTo(id, `00000000-0000-0000-0000-000000000000/cover.webp`)).toBe(false);
    expect(pathBelongsTo(id, `${id}/../other/cover.webp`)).toBe(false);
    expect(pathBelongsTo(id, `${id}/sub/cover.webp`)).toBe(false);
  });
});
