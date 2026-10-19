import { cookies } from "next/headers";

/** Which country the bottom tabs should point at on pages outside a country section. */
export async function navCountry(): Promise<string> {
  const jar = await cookies();
  const pick = jar.get("ic_home")?.value ?? jar.get("ic_country")?.value;
  return pick === "vc" || pick === "gd" ? pick : "gd";
}
