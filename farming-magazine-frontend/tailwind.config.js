/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        green: {
          700: '#4b774f', // Your secondary color
        },
        amber: {
          500: '#e2a800', // Your primary color
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-in-out forwards',
        'fade-in-down': 'fade-in-down 0.8s ease-out forwards',
        'expand': 'expand 1s ease-out forwards 0.3s'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        'expand': {
          '0%': {
            width: '0px'
          },
          '100%': {
            width: '6rem'
          },
        }
      },
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
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}