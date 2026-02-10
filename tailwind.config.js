const defaultTheme = require("tailwindcss/defaultTheme");
const windmill = require("@roketid/windmill-react-ui/config");

module.exports = windmill({
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./containers/**/*.{js,ts,jsx,tsx}",
    "./example/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0D5C63", // Deep Teal
        secondary: "#78909C",
        "background-light": "#F8FAFC",
        "background-dark": "#0F172A",
      },
      fontFamily: {
        display: ["Tajawal", "sans-serif"],
        sans: ["Tajawal", "sans-serif"],
      },
      fontFamily: {
        sans: ["Tajawal", "sans-serif"],
        serif: ["Tajawal", "serif"],
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide"), require("daisyui")],
});
