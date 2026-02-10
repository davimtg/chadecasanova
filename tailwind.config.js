/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-rose': '#ffe4e6', // rose-100
                'brand-rose-dark': '#fda4af', // rose-300
                'brand-gray': '#f3f4f6', // gray-100
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // You might want to add a nice font in index.html
            }
        },
    },
    plugins: [],
}
