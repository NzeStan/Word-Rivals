import type { ExpoConfig } from 'expo/config';
import native from './src/config/native.json';

const config: ExpoConfig = {
  name: native.name,
  slug: native.slug,
  scheme: native.scheme,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/native/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: native.androidPackage,
    adaptiveIcon: {
      backgroundColor: native.iconBackground,
      foregroundImage: './assets/native/adaptive-foreground.png',
      monochromeImage: './assets/native/adaptive-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  ios: { bundleIdentifier: native.iosBundleId, supportsTablet: false },
  plugins: [
    'expo-router',
    'expo-image',
    'expo-secure-store',
    'expo-font',
    'expo-audio',
    [
      'expo-splash-screen',
      {
        image: './assets/native/splash.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: native.splashBackground,
      },
    ],
  ],
};

export default config;
