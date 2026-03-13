import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080a0f",
        bg2: "#0f1117",
        surface: "#14171f",
        surface2: "#1c2030",
        surface3: "#242840",
        border: "#1e2235",
        border2: "#2a2f4a",
        accent: "#ff3b3b",
        accent2: "#ff6b3b",
        muted: "#4a5068",
        subtle: "#6b7394",
        "text-primary": "#e8eaf2",
        "text-secondary": "#a0a8c0",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
export default config;
