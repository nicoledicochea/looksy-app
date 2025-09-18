module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // Handle AWS SDK v2 open handles gracefully
  detectOpenHandles: true,
  // Transform JSX files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-svg|@testing-library)/)',
  ],
};