/**
 * Website ↔ mobile acceptance tests. They run the app's real API modules
 * (src/api/*) against a running Shashtna website + PostgreSQL, and drive the
 * real admin console in Chromium. See tests/backend/README.md.
 */
// babel-preset-expo ships inside the expo package.
const babelPresetExpo = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });

module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/backend/**/*.test.ts'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: [babelPresetExpo] }] },
  moduleNameMapper: {
    '^@/src/lib/config$': '<rootDir>/tests/backend/config.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 60_000,
};
