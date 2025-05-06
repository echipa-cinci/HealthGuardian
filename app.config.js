// Expo configuration with dynamic values
export default {
  name: "HealthGuardian",
  slug: "healthguardian",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./client/public/icons/pwa-512x512.svg",
  splash: {
    image: "./client/public/icons/pwa-512x512.svg",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.healthguardian.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./client/public/icons/pwa-512x512.svg",
      backgroundColor: "#FFFFFF"
    },
    package: "com.healthguardian.app"
  },
  web: {
    favicon: "./client/public/medical_services.svg"
  },
  extra: {
    eas: {
      projectId: "healthguardian"
    }
  },
  plugins: [
    // Add any Expo plugins here when needed
  ]
};