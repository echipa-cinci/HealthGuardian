// Generate QR code for HealthGuardian PWA
import QRCode from 'qrcode';
import fs from 'fs';

// URL to encode in the QR code - this would be your PWA URL
const url = 'https://healthguardian.replit.app/';

// Generate QR code
console.log(`Generating QR code for URL: ${url}`);

// Generate and save QR code as PNG
QRCode.toFile('./qrcode.png', url, {
  color: {
    dark: '#4f46e5',  // Indigo/blue dots
    light: '#FFFFFF'  // White background
  },
  width: 300,
  margin: 2
}, function(err) {
  if (err) {
    console.error('Error generating QR code:', err);
    return;
  }
  console.log('QR code has been generated as qrcode.png');
});

// Also generate QR code as ASCII art in the console for immediate viewing
QRCode.toString(url, {
  color: {
    dark: '#000',
    light: '#fff'
  }
}, function(err, string) {
  if (err) {
    console.error('Error generating ASCII QR code:', err);
    return;
  }
  console.log('\nQR Code (ASCII):');
  console.log(string);
  console.log('\nScan this QR code with your Expo Go app to test the PWA');
  console.log('Or use the generated qrcode.png file');
});

// For Expo Go specific deep link
// exp://exp.host/@your-username/your-project
const expoUrl = 'exp://exp.host/@healthguardian/healthguardian';

// Generate and save Expo-specific QR code
QRCode.toFile('./expo-qrcode.png', expoUrl, {
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  width: 300,
  margin: 2
}, function(err) {
  if (err) {
    console.error('Error generating Expo QR code:', err);
    return;
  }
  console.log('Expo QR code has been generated as expo-qrcode.png');
  console.log('\nNote: This Expo-specific QR code will only work if you have published your app to Expo');
});