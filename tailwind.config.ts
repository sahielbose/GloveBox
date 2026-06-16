import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0C0B0A",
        surface: "#161412",
        chalk: "#F4F1EB",
        ash: "#8F8B83",
        bone: "#F1EDE4",
        paper: "#FBFAF6",
        "cream-ink": "#1A1714",
        sage: { DEFAULT: "#8E9B79", hover: "#7F8C6A" },
        ok: "#6FA873",
        warn: "#D8A24A",
        alert: "#CE5B52",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { container: "1240px" },
      borderColor: {
        hairline: "rgba(244,241,235,0.10)",
        "hairline-l": "rgba(26,23,20,0.12)",
      },
      borderRadius: {
        chip: "6px",
        btn: "8px",
        card: "12px",
        media: "16px",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "card-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        "card-in": "card-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
