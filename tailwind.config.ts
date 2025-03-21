import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        green: {
          primary: "var(--theme-color)",
        },
        theme: {
          DEFAULT: "var(--theme-color)",
          green: "#39e991",
          blue: "#3B82F6",
          red: "#EF4444",
          yellow: "#F59E0B",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
