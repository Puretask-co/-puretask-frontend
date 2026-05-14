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
  // Floor pinned to current actuals while 10 suites stay skipped under the
  // Phase 5 unskip TODOs (docs/TODOS.md, "Test suite (Phase 5)"). Until those
  // un-skip, raise these only when actuals rise. Goal: 80/75/70/80.
  coverageThreshold: {
    global: {
      branches: 2,
      functions: 1,
      lines: 2,
      statements: 2,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);

