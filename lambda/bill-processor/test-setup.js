// Test setup file for Jest
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

// Mock environment variables for tests
process.env.NODE_ENV = 'test';