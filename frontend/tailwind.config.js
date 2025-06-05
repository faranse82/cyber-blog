/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#222222",
        "dark-card": "#303030",
        "dark-article": "#353535",
        "dark-nav": "#111111",
        "dark-footer": "#1A1A1A",
        "accent-red": "#C83C28",
        "text-muted": "#B5B5B5",
      },
      fontFamily: {
        ubuntu: ["Ubuntu", "sans-serif"],
      },
    },
  },
  plugins: [],
};
