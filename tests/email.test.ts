import { describe, expect, it } from "vitest";
import { buildAlert } from "@/lib/email";

describe("enquiry alert emails", () => {
  const base = { businessName: "Harbourline Electrical", subject: "Rewire a kitchen", link: "https://islandconnect.cc/gd/messages/abc" };

  it("words each kind of alert for its reader", () => {
    expect(buildAlert({ ...base, kind: "new_enquiry", preview: "Hello" }).subject).toBe("New enquiry: Rewire a kitchen");
    expect(buildAlert({ ...base, kind: "reply_to_customer", preview: "Hello" }).subject).toBe("Harbourline Electrical replied: Rewire a kitchen");
    expect(buildAlert({ ...base, kind: "reply_to_business", preview: "Hello" }).subject).toBe("New message: Rewire a kitchen");
  });

  it("escapes what people type, so it can't inject links or markup", () => {
    const mail = buildAlert({ ...base, kind: "new_enquiry", preview: `<a href="https://evil.example">click</a>` });
    expect(mail.html).not.toContain(`<a href="https://evil.example">`);
    expect(mail.html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
  });

  it("shortens long messages and always links to the conversation", () => {
    const mail = buildAlert({ ...base, kind: "reply_to_customer", preview: "x".repeat(1000) });
    expect(mail.text).toContain("…");
    expect(mail.text).toContain(base.link);
    expect(mail.html).toContain(`href="${base.link}"`);
  });
});
