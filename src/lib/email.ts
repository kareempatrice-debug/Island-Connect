/*
 * Email content for enquiry alerts. Pure functions, so they can be tested.
 * Messages are escaped: anything a customer or business types is shown as text.
 */
export type AlertKind = "new_enquiry" | "reply_to_customer" | "reply_to_business";

export interface AlertInput {
  kind: AlertKind;
  businessName: string;
  subject: string;
  preview: string;
  link: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function buildAlert({ kind, businessName, subject, preview, link }: AlertInput) {
  const clipped = preview.length > 280 ? `${preview.slice(0, 277).trimEnd()}…` : preview;
  const heading = {
    new_enquiry: `New enquiry for ${businessName}`,
    reply_to_customer: `${businessName} replied to your enquiry`,
    reply_to_business: `New message about “${subject}”`,
  }[kind];
  const lead = {
    new_enquiry: "A customer has sent an enquiry through Island Connect. Reply from your dashboard so the conversation stays in one place.",
    reply_to_customer: "You have a new reply on Island Connect.",
    reply_to_business: `The customer has sent another message to ${businessName}.`,
  }[kind];
  const emailSubject = kind === "new_enquiry" ? `New enquiry: ${subject}` : kind === "reply_to_customer" ? `${businessName} replied: ${subject}` : `New message: ${subject}`;

  const text = `${heading}\n\n${lead}\n\nSubject: ${subject}\n\n“${clipped}”\n\nOpen the conversation: ${link}\n\nIsland Connect · islandconnect.cc`;
  const html = `<!doctype html><html><body style="margin:0;background:#F8F8F5;font-family:Arial,Helvetica,sans-serif;color:#172B32">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #E6EBE8" cellpadding="0" cellspacing="0">
<tr><td style="background:#063E44;border-radius:16px 16px 0 0;padding:18px 24px;color:#ffffff;font-weight:bold;font-size:18px">Island Connect</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${esc(heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#56666B">${esc(lead)}</p>
<p style="margin:0 0 6px;font-size:13px;color:#56666B">Subject</p>
<p style="margin:0 0 16px;font-size:15px;font-weight:bold">${esc(subject)}</p>
<blockquote style="margin:0 0 20px;padding:12px 16px;background:#F0F3F1;border-radius:10px;font-size:15px;line-height:1.5">${esc(clipped)}</blockquote>
<a href="${esc(link)}" style="display:inline-block;background:#07565A;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">Open the conversation</a>
</td></tr>
<tr><td style="padding:0 24px 20px;font-size:12px;color:#56666B">You’re receiving this because of an enquiry on islandconnect.cc. Please reply on Island Connect rather than to this email.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: emailSubject, html, text };
}

/* General notice used by trip alerts: heading, a sentence, a few detail lines and a button. */
export function buildNotice({ heading, lead, lines, link, cta, subject }: { heading: string; lead: string; lines: [string, string][]; link: string; cta: string; subject: string }) {
  const text = `${heading}\n\n${lead}\n\n${lines.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${cta}: ${link}\n\nIsland Connect · islandconnect.cc`;
  const rows = lines.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#56666B;font-size:14px;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-size:14px;font-weight:bold">${esc(v)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#F8F8F5;font-family:Arial,Helvetica,sans-serif;color:#172B32">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #E6EBE8" cellpadding="0" cellspacing="0">
<tr><td style="background:#063E44;border-radius:16px 16px 0 0;padding:18px 24px;color:#ffffff;font-weight:bold;font-size:18px">Island Connect</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${esc(heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#56666B">${esc(lead)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px">${rows}</table>
<a href="${esc(link)}" style="display:inline-block;background:#07565A;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${esc(cta)}</a>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
