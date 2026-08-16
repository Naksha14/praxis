import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101826",
        ink2: "#1B2532",
        blueprint: "#2B4C7E",
        paper: "#EEF1F0",
        amber: "#E8A33D",
        amberdark: "#C97F1E",
        steel: "#5B6472",
        steellight: "#8A93A1",
        line: "#DBE0E3",
        danger: "#C2483B",
        dangerbg: "#FBEBE9",
        success: "#3F8F5F",
        successbg: "#EAF4EE",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
