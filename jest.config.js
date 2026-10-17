module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '.kilo/worktrees', '.next'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/lib/services/**/*.ts', 'src/app/api/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};