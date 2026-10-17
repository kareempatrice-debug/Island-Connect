import type { CSSProperties } from "react";
import {
  Briefcase, Car, GraduationCap, Hammer, PartyPopper, ShoppingBasket, Stethoscope, Store, TreePalm,
  UtensilsCrossed, Wrench, Zap, Droplets, HardHat, Sparkles, Scale, Plane, Ship, Home, BedDouble, Map, Building2,
  type LucideIcon,
} from "lucide-react";
import { categories as seedCategories } from "@/data/categories";

/*
 * Visual language for categories. Each top-level group has one icon and one
 * tone, and its subcategories inherit them, so the colour of a tile tells you
 * where you are without every element shouting.
 */
export type Tone = "teal" | "gold" | "coral" | "green";

const GROUP: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  transport: { Icon: Car, tone: "teal" },
  "home-construction": { Icon: Hammer, tone: "gold" },
  "professional-services": { Icon: Briefcase, tone: "teal" },
  "tourism-hospitality": { Icon: TreePalm, tone: "green" },
  "retail-everyday": { Icon: ShoppingBasket, tone: "coral" },
  health: { Icon: Stethoscope, tone: "green" },
  "education-childcare": { Icon: GraduationCap, tone: "gold" },
  "events-venues": { Icon: PartyPopper, tone: "coral" },
};

// A few subcategories get their own, more specific icon.
const SPECIFIC: Record<string, LucideIcon> = {
  electricians: Zap,
  plumbers: Droplets,
  "builders-contractors": HardHat,
  cleaning: Sparkles,
  mechanics: Wrench,
  lawyers: Scale,
  "airport-transfers": Plane,
  "water-taxis": Ship,
  restaurants: UtensilsCrossed,
  "bars-cafes": UtensilsCrossed,
  accommodation: BedDouble,
  tours: Map,
  "estate-agents": Home,
  "surveyors-valuers": Building2,
};

const parentOf = new globalThis.Map(seedCategories.map((c) => [c.slug, c.parentSlug]));

export function groupOf(slug: string): string {
  return parentOf.get(slug) ?? slug;
}

export function categoryVisual(slug: string): { Icon: LucideIcon; tone: Tone } {
  const group = GROUP[groupOf(slug)] ?? { Icon: Store, tone: "teal" as Tone };
  return { Icon: SPECIFIC[slug] ?? group.Icon, tone: group.tone };
}

/** Soft tinted surface plus a strong foreground, per tone. Contrast checked in both themes. */
export const toneClasses: Record<Tone, { soft: string; icon: string; solid: string }> = {
  teal: { soft: "bg-deep/10 dark:bg-link/10", icon: "text-deep dark:text-link", solid: "bg-deep text-white" },
  green: { soft: "bg-primary/10 dark:bg-primary/15", icon: "text-primary", solid: "bg-primary text-white dark:text-primary-ink" },
  gold: { soft: "bg-gold/20", icon: "text-[#8A5A00] dark:text-gold", solid: "bg-gold text-[#1E2933]" },
  coral: { soft: "bg-coral/15", icon: "text-[#B23A25] dark:text-coral", solid: "bg-coral text-white" },
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const { Icon } = categoryVisual(slug);
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}

/** Deep, quiet gradients with a soft wave texture, for covers when no photograph exists. */
const GRADIENT: Record<Tone, [string, string]> = {
  teal: ["#064F56", "#0B7480"],
  green: ["#06564F", "#0E8A70"],
  gold: ["#5B3F06", "#9A6A10"],
  coral: ["#6B2418", "#B2452F"],
};

export function coverStyle(tone: Tone): CSSProperties {
  const [a, b] = GRADIENT[tone];
  return {
    backgroundColor: a,
    backgroundImage: [
      "radial-gradient(120% 90% at 100% 0%, rgb(255 255 255 / 0.10) 0 40%, transparent 41%)",
      "radial-gradient(90% 70% at 0% 100%, rgb(0 0 0 / 0.14) 0 45%, transparent 46%)",
      `linear-gradient(135deg, ${a}, ${b})`,
    ].join(", "),
  };
}
