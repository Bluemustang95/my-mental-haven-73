import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body: ["Lora", "serif"],
        sans: ["Montserrat", "sans-serif"],
        mindful: ["DM Serif Display", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        mood: {
          1: "hsl(var(--mood-1))",
          2: "hsl(var(--mood-2))",
          3: "hsl(var(--mood-3))",
          4: "hsl(var(--mood-4))",
          5: "hsl(var(--mood-5))",
        },
        mindful: {
          cream: "hsl(var(--mindful-cream))",
          yellow: "hsl(var(--mindful-yellow))",
          orange: "hsl(var(--mindful-orange))",
          sky: "hsl(var(--mindful-sky))",
          rose: "hsl(var(--mindful-rose))",
        },
        resource: {
          grounding: { bg: "hsl(var(--resource-grounding-bg))", accent: "hsl(var(--resource-grounding-accent))" },
          mindfulness: { bg: "hsl(var(--resource-mindfulness-bg))", accent: "hsl(var(--resource-mindfulness-accent))" },
          psycho: { bg: "hsl(var(--resource-psycho-bg))", accent: "hsl(var(--resource-psycho-accent))" },
          selfcare: { bg: "hsl(var(--resource-selfcare-bg))", accent: "hsl(var(--resource-selfcare-accent))" },
          breathing: { bg: "hsl(var(--resource-breathing-bg))", accent: "hsl(var(--resource-breathing-accent))" },
          sleep: { bg: "hsl(var(--resource-sleep-bg))", accent: "hsl(var(--resource-sleep-accent))" },
          rumination: { bg: "hsl(var(--resource-rumination-bg))", accent: "hsl(var(--resource-rumination-accent))" },
          recovery: { bg: "hsl(var(--resource-recovery-bg))", accent: "hsl(var(--resource-recovery-accent))", relapse: "hsl(var(--resource-recovery-relapse))" },
          regulation: { bg: "hsl(var(--resource-regulation-bg))", accent: "hsl(var(--resource-regulation-accent))" },
          eating: { bg: "hsl(var(--resource-eating-bg))", accent: "hsl(var(--resource-eating-accent))" },
          values: { bg: "hsl(var(--resource-values-bg))", accent: "hsl(var(--resource-values-accent))" },
          safety: { bg: "hsl(var(--resource-safety-bg))", accent: "hsl(var(--resource-safety-accent))" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
