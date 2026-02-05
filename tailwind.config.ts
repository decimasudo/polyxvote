import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Forces the 8-bit font as the default for the whole app
        sans: ['"Press Start 2P"', 'cursive'], 
        mono: ['"Press Start 2P"', 'cursive'],
      },
      boxShadow: {
        // The classic retro solid shadows from clawdpm
        'hard': '4px 4px 0px 0px rgba(0,0,0,1)', 
        'hard-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Clawdpm specific retro palette
        primary: '#2B5D3A', // Retro Green
        accent: '#F5A623',  // Retro Orange
        blue: {
           600: '#2563EB',
           700: '#1d4ed8',
        }
      },
      borderRadius: {
        // FORCE 0px everywhere. No round buttons allowed in retro mode.
        lg: '0px',
        md: '0px',
        sm: '0px',
        full: '0px', 
      },
      keyframes: {
        'pixel-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      animation: {
        'pixel-float': 'pixel-float 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;