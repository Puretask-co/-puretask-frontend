// jest.config.js
// Frontend Jest configuration

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/utils/setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.(ts|tsx)', '**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/tests/**',
    '!src/__tests__/**',
    '!src/test-helpers/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  // Realistic floor pending a coverage ramp-up. Goal: 80/75/70/80.
  // See docs/history/TEST_SUITE_INDEX.md for the prior plan.
  coverageThreshold: {
    global: {
      branches: 8,
      functions: 10,
      lines: 12,
      statements: 12,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);

