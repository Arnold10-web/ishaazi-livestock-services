// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // Extra small devices
        'sm': '640px',    // Small devices
        'md': '768px',    // Medium devices
        'lg': '1024px',   // Large devices
        'xl': '1280px',   // Extra large devices
        '2xl': '1536px',  // 2X Extra large devices
      },
      spacing: {
        '18': '4.5rem',   // Custom spacing if needed
        '22': '5.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'), // For text truncation
    require('@tailwindcss/typography'),
  ],
}