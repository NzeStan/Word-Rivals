// Runs the app's networking code in plain Node, so it talks to a real backend with real sockets.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.e2e.ts'],
  globals: { __DEV__: true },
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { presets: [[require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] }), { reanimated: false, worklets: false }]] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/e2e/stubs.js',
    '^expo-constants$': '<rootDir>/e2e/stubs.js',
    'expo/virtual/env': '<rootDir>/e2e/env.js',
    '^expo-secure-store$': '<rootDir>/e2e/stubs.js',
  },
};
