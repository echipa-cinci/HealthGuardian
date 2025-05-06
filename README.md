# HealthGuardian PWA

HealthGuardian is a medical management platform that facilitates seamless interactions between doctors and patients through advanced digital health tools, with real-time WebSocket updates and enhanced patient information management.

## Running as a PWA

The application is designed to run as a Progressive Web App (PWA), which provides a native-like experience on mobile devices.

### How to Install as a PWA

1. Visit the deployed application in a modern browser (Chrome, Edge, Safari)
2. Look for the install button in the application header
3. Click "Install" to add the app to your home screen
4. Once installed, the app can be launched from your home screen like any other app

## Testing with Expo Go

For demo purposes, we've provided a simple Expo app that can be used to test the PWA in the Expo Go environment.

### How to Run with Expo Go

1. Make sure you have Expo Go installed on your mobile device
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. You have two options to run the app:
   
   **Option 1: Use the published Expo app**
   - Open Expo Go
   - Scan the QR code from the published app
   - This will open our HealthGuardian launcher which redirects to the PWA

   **Option 2: Run locally (for development)**
   - Clone this repository
   - Rename `expo-package.json` to `package.json` (backup the original first)
   - Run `npm install`
   - Run `npx expo start`
   - Scan the QR code with Expo Go

## PWA Features

The HealthGuardian PWA includes:

- **Offline Support**: Basic functionality works without an internet connection
- **Installable**: Can be added to your home screen for quick access
- **Responsive Design**: Works on all device sizes
- **Push Notifications**: (Coming soon) Get alerts when patient parameters are outside normal ranges

## Technical Details

This application is built using:

- React frontend
- Express backend
- PostgreSQL database
- TypeScript
- Drizzle ORM
- WebSocket real-time communication
- Role-based authentication
- PWA capabilities with service workers

## For Developers

If you'd like to contribute to the development of HealthGuardian, please refer to the development guidelines in the repository.