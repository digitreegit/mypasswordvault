/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./app/index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef1",
          200: "#d9d9df",
          300: "#b5b5c0",
          400: "#86868f",
          500: "#5e5e68",
          600: "#42424a",
          700: "#2f2f35",
          800: "#1f1f24",
          900: "#121216",
        },
        accent: {
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          '"Noto Sans KR"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        brand: ['"Outfit"', "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.25rem" }],
      },
    },
  },
  plugins: [],
};
