/*
 * WhatsApp alerts through the WhatsApp Business Platform (Meta Cloud API).
 *
 * Messages that start a conversation must use a template Meta has approved. Set:
 *   WHATSAPP_TOKEN            secret: a permanent System User access token
 *   WHATSAPP_PHONE_NUMBER_ID  the ID of your WhatsApp Business phone number
 *   WHATSAPP_TEMPLATE_NEW_TRIP (optional) template name, default "new_trip_request"
 *   WHATSAPP_TEMPLATE_LANG     (optional) template language, default "en"
 * The template needs four body variables: {{1}} trip type, {{2}} route, {{3}} when, {{4}} price,
 * and a URL button whose dynamic part {{1}} is the dashboard path.
 * Without these settings nothing is sent; email and phone alerts carry on as before.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendTripTemplate(to: string[], vars: { kind: string; route: string; when: string; price: string; path: string }) {
  if (!whatsappConfigured() || !to.length) return;
  const template = process.env.WHATSAPP_TEMPLATE_NEW_TRIP || "new_trip_request";
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  const text = (v: string) => ({ type: "text", text: v.replace(/\s+/g, " ").slice(0, 200) });
  await Promise.all([...new Set(to)].map(async (number) => {
    try {
      const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: number.replace(/^\+/, ""),
          type: "template",
          template: {
            name: template,
            language: { code: lang },
            components: [
              { type: "body", parameters: [text(vars.kind), text(vars.route), text(vars.when), text(vars.price)] },
              { type: "button", sub_type: "url", index: "0", parameters: [text(vars.path.replace(/^\//, ""))] },
            ],
          },
        }),
      });
      if (!res.ok) console.error("WhatsApp send failed:", res.status, (await res.text()).slice(0, 300));
    } catch (e) {
      console.error("WhatsApp error:", e);
    }
  }));
}
