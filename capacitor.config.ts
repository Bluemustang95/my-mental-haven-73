import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.f6112c586f544e1e990854e0c98dc9ec",
  appName: "RESMA",
  webDir: "dist",
  server: {
    url: "https://f6112c58-6f54-4e1e-9908-54e0c98dc9ec.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: "#FDFCFB",
  },
};

export default config;
