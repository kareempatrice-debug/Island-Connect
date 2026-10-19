"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

/* The favourite country: when set, the site (and sign-in) opens straight into it. */
export async function setHomeCountryAction(form: FormData) {
  const code = z.enum(["gd", "vc", "none"]).catch("none").parse(form.get("country"));
  const jar = await cookies();
  if (code === "none") jar.delete("ic_home");
  else jar.set("ic_home", code, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect("/?choose=1");
}
