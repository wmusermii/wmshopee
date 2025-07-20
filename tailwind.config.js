/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // ⛔️ WAJIB: agar PrimeNG tidak rusak
  },
  plugins: [],
}
