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
        display: ["Poppins", "Montserrat", "sans-serif"],
        body: ["Lora", "serif"],
        sans: ["Inter", "Poppins", "Montserrat", "sans-serif"],
        mindful: ["DM Serif Display", "serif"],
        serifElegant: ["Playfair Display", "Lora", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(16,25,39,0.04)",
        "glass-lg": "0 12px 48px rgba(16,25,39,0.08)",
        "primary-glow": "0 20px 40px rgba(124,194,200,0.3)",
        "accent-glow": "0 15px 35px rgba(250,203,96,0.25)",
        "violet-glow": "0 15px 40px -15px rgba(139,121,242,0.8)",
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
        resma: {
          navy: "#101927",
          teal: "#7cc2c8",
          gold: "#facb60",
          purple: "#6366f1",
          lightBg: "#f9f9fb",
          lightBg2: "#e8ebf3",
          adminBg: "#f4f7f9",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "breath-vagal": {
          "0%,100%": { transform: "scale(0.95)", opacity: "0.28", filter: "blur(30px)" },
          "50%": { transform: "scale(1.45)", opacity: "0.65", filter: "blur(50px)" },
        },
        "float-weightless": {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(0.5deg)" },
        },
        "cascade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "twinkle": {
          "0%,100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },

      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s cubic-bezier(.2,.8,.2,1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(.2,.8,.2,1) both",
        "slide-up": "slide-up 0.45s cubic-bezier(.2,.8,.2,1) both",
        "shimmer": "shimmer 2.5s linear infinite",
        "breath-vagal": "breath-vagal 6s ease-in-out infinite",
        "float-weightless": "float-weightless 5s ease-in-out infinite",
        "cascade-up": "cascade-up 1.2s cubic-bezier(.22,1,.36,1) both",
        "float-slow": "float-slow 4s ease-in-out infinite",
        "twinkle": "twinkle 2s ease-in-out infinite",

      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
