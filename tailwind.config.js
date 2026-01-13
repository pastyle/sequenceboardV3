/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                spades: '#6A4C92',
                clubs: '#00C8B3',
                hearts: '#F68C69',
                diamonds: '#AC7F5E',
                joker: '#AFAFAF',
                'add-jack': '#0088FF',
                'remove-jack': '#FF595D',
                'bg-dark': '#1e1e24',
                'bg-panel': '#2b2b36',
                'text-primary': '#ffffff',
                'text-secondary': '#a0a0a0',
            },
            animation: {
                pulse: 'pulse 1.5s infinite',
                shake: 'shake 0.5s',
                winPulse: 'winPulse 1s infinite alternate',
            },
            keyframes: {
                pulse: {
                    '0%, 100%': { boxShadow: 'inset 0 0 0 2px #FFD700' },
                    '50%': { boxShadow: 'inset 0 0 0 6px #FFD700' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%, 75%': { transform: 'translateX(-2px)' },
                    '50%': { transform: 'translateX(2px)' },
                },
                winPulse: {
                    'from': { transform: 'scale(1)', boxShadow: '0 0 10px 2px #FFD700' },
                    'to': { transform: 'scale(1.2)', boxShadow: '0 0 20px 5px #FFD700' },
                }
            }
        },
    },
    plugins: [],
}
