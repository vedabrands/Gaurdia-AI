import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0f0f11",
        surface: "#18181b",
        elevated: "#1f1f23",
        "border-subtle": "rgba(255,255,255,0.06)",
        "border-medium": "rgba(255,255,255,0.10)",
        "text-primary": "#e8e5e0",
        "text-secondary": "#9b9590",
        "text-tertiary": "#6b6560",
        "accent-normal": "#3b9a6d",
        "accent-warning": "#c48830",
        "accent-critical": "#c0392b",
        "accent-info": "#5a7d9a",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        settle: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
        enter: "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
