/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-active': 'var(--color-primary-active)',
          'primary-light': 'var(--color-primary-light)',
          'primary-muted': 'var(--color-primary-muted)',
          'primary-dark': 'var(--color-primary-dark)',

          secondary: 'var(--color-secondary)',
          'secondary-hover': 'var(--color-secondary-hover)',
          'secondary-active': 'var(--color-secondary-active)',
          'secondary-light': 'var(--color-secondary-light)',
          'secondary-muted': 'var(--color-secondary-muted)',
          'secondary-dark': 'var(--color-secondary-dark)',

          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          'accent-active': 'var(--color-accent-active)',
          'accent-light': 'var(--color-accent-light)',
          'accent-muted': 'var(--color-accent-muted)',
        },
        app: {
          white: 'var(--color-white)',
          bg: 'var(--color-bg-body)',
          surface: 'var(--color-surface-card)',
          border: 'var(--color-border-subtle)',
          black: 'var(--color-black)',
          dark: 'var(--color-dark-bg)',
          sidebar: 'var(--color-dark-sidebar)',
          'dark-surface': 'var(--color-dark-surface)',
          'dark-border': 'var(--color-dark-border)',
          text: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
        }
      }
    },
  },
  plugins: [],
}
