// HealthGuardian PWA Launcher for Expo Go
// This is the simplest possible implementation to avoid dependency issues

// Define a minimal version of the app that works in Expo Go
export default function App() {
  return {
    // Use createElement directly to avoid React import issues
    $$typeof: Symbol.for('react.element'),
    type: 'View',
    key: null,
    ref: null,
    props: {
      style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 20 },
      children: [
        {
          $$typeof: Symbol.for('react.element'),
          type: 'Text',
          key: 'title',
          ref: null,
          props: {
            style: { fontSize: 24, fontWeight: 'bold', color: '#4f46e5', marginBottom: 20 },
            children: 'HealthGuardian'
          }
        },
        {
          $$typeof: Symbol.for('react.element'),
          type: 'View',
          key: 'logo',
          ref: null,
          props: {
            style: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
            children: {
              $$typeof: Symbol.for('react.element'),
              type: 'Text',
              key: null,
              ref: null,
              props: {
                style: { fontSize: 50 },
                children: '❤️'
              }
            }
          }
        },
        {
          $$typeof: Symbol.for('react.element'),
          type: 'Text',
          key: 'message',
          ref: null,
          props: {
            style: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
            children: 'This app is designed to be used as a Progressive Web App.'
          }
        },
        {
          $$typeof: Symbol.for('react.element'),
          type: 'Text',
          key: 'instruction',
          ref: null,
          props: {
            style: { fontSize: 14, textAlign: 'center', marginBottom: 10 },
            children: 'Please use a web browser to access the full application at:'
          }
        },
        {
          $$typeof: Symbol.for('react.element'),
          type: 'Text',
          key: 'url',
          ref: null,
          props: {
            style: { fontSize: 16, color: '#4f46e5', textDecorationLine: 'underline', marginBottom: 30 },
            children: 'https://healthguardian.replit.app',
            onPress: () => {
              // Use the global object to avoid imports
              const openURL = (url) => {
                if (global.Linking && global.Linking.openURL) {
                  global.Linking.openURL(url).catch(err => 
                    console.error('An error occurred', err)
                  );
                }
              };
              openURL('https://healthguardian.replit.app');
            }
          }
        }
      ]
    }
  };
}