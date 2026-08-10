/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Ensure Tailwind scans all relevant files
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // ✅ Enable class-based dark mode for future flexibility
  darkMode: 'class', // OR 'media' if you prefer auto-switching based on OS

  theme: {
    extend: {
      // ✅ Your custom Inter font (kept exactly as before)
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },

      // ✅ Add modern color palette aligned with your brand
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8',   // blue-700
          light: '#60a5fa',   // blue-400
          dark: '#1e40af',    // blue-800
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0a',
        },
      },

      // ✅ Add smooth box shadows and glow effects
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md-soft': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg-soft': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.35)', // matches primary color
      },

      // ✅ Consistent animation keyframes (matches your globals.css)
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },

      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },

      // ✅ Add container padding for consistent layout
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
    },
  },

  // ✅ Keep typography plugin (used for AI answer formatting)
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
