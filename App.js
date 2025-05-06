// Expo entry point - wrapper for PWA
import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Platform, StatusBar, Linking } from 'react-native';

// Simple component to display a message about using the web version
export default function App() {
  const openWebApp = async () => {
    // In a real app, this would be your deployed PWA URL
    const webAppUrl = 'https://healthguardian.replit.app';
    
    // Try to open the URL
    const supported = await Linking.canOpenURL(webAppUrl);
    if (supported) {
      await Linking.openURL(webAppUrl);
    } else {
      console.error("Cannot open URL: " + webAppUrl);
    }
  };

  React.useEffect(() => {
    // Attempt to open the web app when component mounts
    openWebApp();
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>HealthGuardian</Text>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>❤️</Text>
      </View>
      <Text style={styles.message}>
        This app is designed to be used as a Progressive Web App. 
      </Text>
      <Text style={styles.instruction}>
        Please use a web browser to access the full application at:
      </Text>
      <Text style={styles.url} onPress={openWebApp}>
        https://healthguardian.replit.app
      </Text>
      <ActivityIndicator size="large" color="#4f46e5" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 50,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  url: {
    fontSize: 16,
    color: '#4f46e5',
    textDecorationLine: 'underline',
    marginBottom: 30,
  },
  spinner: {
    marginTop: 20,
  },
});