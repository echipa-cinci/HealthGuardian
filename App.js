// Expo entry point - redirects to web app
import { createElement } from 'react';
import { WebView } from 'react-native-webview';

// Simple bridge component to load the web version in Expo
export default function App() {
  // When running in Expo, we'll load the web app in a WebView
  // The URL would be the deployed version of the PWA
  // For development, you can use localhost if on the same network
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://healthguardian.replit.app';
  
  // Create a WebView element to display the web app
  return createElement(WebView, {
    source: { uri: appUrl },
    style: { flex: 1 },
    // Enable JavaScript and allow geolocation for the web app
    javaScriptEnabled: true,
    domStorageEnabled: true,
    geolocationEnabled: true,
    // Allow the WebView to access the device's camera and microphone (if needed)
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
  });
}