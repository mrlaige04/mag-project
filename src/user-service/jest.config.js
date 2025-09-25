module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    coveragePathIgnorePatterns: [
      "\\.js$",
      "\\.d\\.ts$",
      "dist",
      "node_modules",
      "common",
      "main.ts",
      "worker.ts",
      "app.module.ts"
    ],
  };