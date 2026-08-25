module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native-community|@react-native-documents|@react-navigation|react-native-vector-icons|react-native-linear-gradient|react-native-safe-area-context|@tanstack)/)',
  ],
};
