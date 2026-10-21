"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function StripLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const path = usePathname();
  if (path === href.split("?")[0]) return null;
  return <Link href={href} className={className}>{children}</Link>;
}
