module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    'android/**',
    'ios/Pods/**',
    'ios/build/**',
    'vendor/**',
    'node_modules/**',
  ],
  overrides: [
    {
      files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', 'jest.setup.js'],
      env: { jest: true },
    },
  ],
};
