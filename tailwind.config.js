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
                    DEFAULT: '#4f46e5', // Tailwind Indigo-600
                    hover: '#4338ca',   // Tailwind Indigo-700
                    light: '#e0e7ff',   // Tailwind Indigo-100
                    subtle: '#6366f1',  // Tailwind Indigo-500
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 4px 24px -6px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 12px 32px -8px rgba(79, 70, 229, 0.12)',
            }
        },
    },
    plugins: [],
}
