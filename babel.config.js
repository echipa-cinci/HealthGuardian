module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // No plugins needed for this simple app
    ],
    // This is needed for Expo compatibility with React 18
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};