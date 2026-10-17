import type { Config } from "tailwindcss";

/* Design tokens live in src/app/globals.css as CSS variables; Tailwind maps names onto them. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: token("surface"),
        raised: token("raised"),
        sunken: token("sunken"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        deep: token("deep"),
        "deep-ink": token("deep-ink"),
        primary: token("primary"),
        "primary-ink": token("primary-ink"),
        link: token("link"),
        gold: token("gold"),
        coral: token("coral"),
        success: token("success"),
        danger: token("danger"),
        // Legacy aliases kept so older class names keep working.
        leaf: token("success"),
        sky: token("primary"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "76rem" },
      borderRadius: { card: "1.25rem", panel: "1.75rem" },
      boxShadow: {
        card: "0 1px 2px rgb(16 40 43 / 0.06), 0 10px 28px -14px rgb(16 40 43 / 0.22)",
        lift: "0 2px 4px rgb(16 40 43 / 0.08), 0 22px 44px -18px rgb(16 40 43 / 0.32)",
        dock: "0 18px 50px -12px rgb(4 30 34 / 0.45)",
      },
      transitionTimingFunction: { out: "cubic-bezier(.2,.7,.2,1)" },
    },
  },
  plugins: [],
};

export default config;
