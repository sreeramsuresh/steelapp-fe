/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/**/__tests__/**",
    "!./src/**/*.test.{js,ts,jsx,tsx}",
  ],
  // Use class-based dark mode (controlled by .dark class on html element)
  darkMode: 'class',
  // Optimize for production
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6fffa",
          100: "#b2f5ea",
          200: "#81e6d9",
          300: "#4fd1c7",
          400: "#38b2ac",
          500: "#319795",
          600: "#2c7a7b",
          700: "#285e61",
          800: "#234e52",
          900: "#1d4044",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        teal: {
          50: "#e6fffa",
          100: "#b2f5ea",
          200: "#81e6d9",
          300: "#4fd1c7",
          400: "#38b2ac",
          500: "#008b8b", // Dark Cyan from MUI theme
          600: "#2c7a7b",
          700: "#00695c", // Dark from MUI theme
          800: "#234e52",
          900: "#1d4044",
        },
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#eeeeee",
          300: "#e0e0e0",
          400: "#bdbdbd",
          500: "#9e9e9e",
          600: "#37474f", // Steel divider from MUI theme
          700: "#263238", // Steel blue-grey from MUI theme
          800: "#1e2328", // Steel card background from MUI theme
          900: "#121418", // Darker steel grey from MUI theme
        },
        // Shadcn theme colors from CSS variables
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        'line-item-slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'line-item-slide-in': 'line-item-slide-in 0.3s ease both',
      },
    },
  },
  plugins: [],
};
