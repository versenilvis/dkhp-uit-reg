
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                primary: '#FFD100',
                background: '#FFD100',
                'main-foreground': 'var(--main-foreground)',
                'main': 'var(--main)',
                'border': 'var(--border)',
                'secondary-background': 'var(--secondary-background)',
                'foreground': 'var(--foreground)'
            },
            borderRadius: {
                'base': '0.5rem'
            },
            boxShadow: {
                'shadow': 'var(--shadow)'
            },
            translate: {
                'boxShadowX': 'var(--boxShadowX)',
                'boxShadowY': 'var(--boxShadowY)',
                'reverseBoxShadowX': 'var(--reverseBoxShadowX)',
                'reverseBoxShadowY': 'var(--reverseBoxShadowY)'
            }
        }
    },
    plugins: [require('tailwindcss-animate')]

};
