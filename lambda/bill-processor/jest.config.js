module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'index.js',
        '!node_modules/**',
        '!coverage/**',
        '!*.config.js'
    ],
    testMatch: [
        '**/__tests__/**/*.js',
        '**/*.test.js'
    ],
    verbose: true,
    setupFilesAfterEnv: ['<rootDir>/test-setup.js']
};