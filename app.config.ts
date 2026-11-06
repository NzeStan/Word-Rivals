import { existsSync } from 'node:fs';
import type { ExpoConfig } from 'expo/config';
import native from './src/config/native.json';

// Firebase config for Android push. Download it from the Firebase console (see README) and drop it here.
const googleServicesFile = existsSync('./google-services.json') ? './google-services.json' : undefined;

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
    googleServicesFile,
  },
  ios: { bundleIdentifier: native.iosBundleId, supportsTablet: false },
  extra: native.easProjectId ? { eas: { projectId: native.easProjectId } } : {},
  plugins: [
    'expo-router',
    'expo-image',
    'expo-secure-store',
    'expo-font',
    'expo-audio',
    'expo-web-browser',
    [
      'expo-notifications',
      {
        icon: './assets/native/notification-icon.png',
        color: native.notificationColor,
        defaultChannel: 'default',
      },
    ],
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
