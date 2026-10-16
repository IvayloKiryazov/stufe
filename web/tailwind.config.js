/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        soft: "var(--soft)",
        der: "var(--der)",
        die: "var(--die)",
        das: "var(--das)",
        good: "var(--good)",
        bad: "var(--bad)",
        primary: "var(--ink)",
        "primary-foreground": "var(--bg)",
      },
      fontFamily: {
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      borderRadius: { xl: "14px", lg: "10px", md: "8px" },
    },
  },
  plugins: [],
};
