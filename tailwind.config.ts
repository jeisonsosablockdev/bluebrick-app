import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./apps/web/src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#04060F",
        panel: "#0E1324",
        soft: "#1A2140",
        accentFrom: "#2FC6FF",
        accentTo: "#7C3AED"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 12px 30px rgba(80, 56, 255, 0.35)"
      },
      backgroundImage: {
        gradientPrimary: "linear-gradient(135deg, #2FC6FF 0%, #7C3AED 100%)",
        gradientHero: "radial-gradient(circle at 15% 10%, rgba(66,188,255,0.23), transparent 38%), radial-gradient(circle at 82% 82%, rgba(140,68,255,0.3), transparent 45%), linear-gradient(165deg, #090E1E, #111936 68%, #1D2154)",
        gradientPanel: "linear-gradient(145deg, rgba(47,198,255,0.18), rgba(124,58,237,0.2))"
      }
    }
  },
  plugins: []
};

export default config;
