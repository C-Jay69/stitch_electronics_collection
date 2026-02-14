import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: "#a855f7",
                "background-light": "#f7f5f8",
                "background-dark": "#000000",
                "card-dark": "#191022",
                "surface-dark": "#2a2a2a",
            },
            fontFamily: {
                display: ["var(--font-space-grotesk)", "sans-serif"],
            },
        },
    },
    plugins: [],
} satisfies Config;
