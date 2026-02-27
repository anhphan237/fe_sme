import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        surface: "#ffffff",
        ink: "#0f172a",
        muted: "#64748b",
        stroke: "#e2e8f0",
        brand: "#1d4ed8",
        brandDark: "#1e40af",
      },
    },
  },
  plugins: [],
} satisfies Config;
