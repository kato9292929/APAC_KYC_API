import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E6C97A",
          dark: "#A07830",
        },
        dark: {
          DEFAULT: "#0A0A0A",
          card: "#111111",
          border: "#222222",
          hover: "#1A1A1A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
