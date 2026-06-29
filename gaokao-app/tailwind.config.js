/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-bg': '#F7F0E8',
        'primary': '#C04A1A',
        'primary-light': '#D4764A',
        'primary-bg': '#F5E6DD',
        'navy': '#1A2B4A',
        'navy-light': '#2E4568',
        'sage': '#5A7D5A',
        'sage-bg': '#E8F0E8',
        'text-main': '#2A2A2A',
        'text-secondary': '#4A4A4A',
        'text-muted': '#7A7A7A',
        'border-custom': '#D8D0C6',
        'card': '#FFFFFF',
        'danger': '#B84040',
        'danger-bg': '#F8E8E8',
        'warn': '#C08020',
        'warn-bg': '#F8F0E0',
        'info': '#2E6B9A',
        'info-bg': '#E8F0F8',
      },
      fontFamily: {
        'sans': ['"Geist"', 'system-ui', 'sans-serif'],
        'mono': ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
}
