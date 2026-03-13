/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0047FF', // ForgeWeb Blue
                    hover: '#0038CC',   // Darker Blue
                    light: '#E6EFFF',   // Lightest Blue
                    subtle: '#336CFF',  // Lighter Blue
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'serif'], // Serif font for elegant ForgeWeb italic accents
            },
            boxShadow: {
                'card': '0 4px 24px -6px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 12px 32px -8px rgba(0, 71, 255, 0.12)',
            }
        },
    },
    plugins: [],
}
