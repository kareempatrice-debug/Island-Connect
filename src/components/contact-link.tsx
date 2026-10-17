"use client";

/* A normal link that also tells Island Connect a customer was sent to this business. */
export function ContactLink({
  slug,
  channel,
  country,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { slug: string; channel: "whatsapp" | "phone" | "email" | "website" | "booking" | "maps"; country: string }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        try {
          fetch("/api/contact-click", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, channel, country }) });
        } catch {
          // Tracking must never block the visitor.
        }
        props.onClick?.(e);
      }}
    />
  );
}
