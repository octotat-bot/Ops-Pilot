/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    app: '#f4f6f5',
                    surface: '#ffffff',
                    subtle: '#eef2f1',
                },
                brand: {
                    primary: '#1f6f78',
                    'primary-soft': '#cfe6e8',
                },
                accent: {
                    sand: '#e7dcc8',
                    'sand-dark': '#cbbfa9',
                },
                text: {
                    primary: '#1c2b2d',
                    secondary: '#4a5d60',
                    muted: '#6f8487',
                },
                border: {
                    light: '#d9e1e0',
                    strong: '#c2cdcc',
                },
                state: {
                    success: '#2f855a',
                    warning: '#b7791f',
                    danger: '#c53030',
                    info: '#2b6cb0',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'sm-soft': '0 1px 2px rgba(0,0,0,0.04)',
                'md-soft': '0 6px 18px rgba(0,0,0,0.06)',
            }
        },
    },
    plugins: [],
}
