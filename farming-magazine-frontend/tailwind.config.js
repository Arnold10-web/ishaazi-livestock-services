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
        // Clean, professional color palette
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e3',
          200: '#bbe5ca',
          300: '#8dd1a7',
          400: '#5bb67d',
          500: '#1B4332', // Main primary - Deep Forest Green
          600: '#166b2d',
          700: '#145a27',
          800: '#134a22',
          900: '#11401e',
        },
        secondary: {
          50: '#f8f6f0',
          100: '#f0ebd8',
          200: '#e1d5b1',
          300: '#d0bc84',
          400: '#c1a55f',
          500: '#2D5016', // Dark Olive
          600: '#a89042',
          700: '#8b7538',
          800: '#745f32',
          900: '#5f4f2e',
        },
        accent: {
          50: '#fefbf0',
          100: '#fef7e0',
          200: '#fdecc4',
          300: '#fbdc9c',
          400: '#f8c572',
          500: '#B7950B', // Muted Gold
          600: '#e6a817',
          700: '#c08a0e',
          800: '#9d6f10',
          900: '#805b11',
        },
        neutral: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#1a1d20',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.4s ease-out forwards',
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
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.7',
            h1: {
              fontSize: '2.25rem',
              fontWeight: '700',
              color: '#1B4332',
            },
            h2: {
              fontSize: '1.875rem',
              fontWeight: '600',
              color: '#1B4332',
            },
            h3: {
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1B4332',
            },
            h4: {
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1B4332',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}