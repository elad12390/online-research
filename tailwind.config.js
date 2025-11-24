/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'notion-bg-primary': 'var(--notion-bg-primary)',
        'notion-bg-secondary': 'var(--notion-bg-secondary)',
        'notion-bg-tertiary': 'var(--notion-bg-tertiary)',
        'notion-bg-hover': 'var(--notion-bg-hover)',
        'notion-text-primary': 'var(--notion-text-primary)',
        'notion-text-secondary': 'var(--notion-text-secondary)',
        'notion-text-tertiary': 'var(--notion-text-tertiary)',
        'notion-border': 'var(--notion-border)',
        'notion-blue': 'var(--notion-blue)',
        'notion-blue-light': 'var(--notion-blue-light)',
      },
      boxShadow: {
        'notion-sm': 'var(--shadow-sm)',
        'notion-md': 'var(--shadow-md)',
        'notion-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}
