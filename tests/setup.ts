import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  console.log('Starting API test suite...');
  // Ensure we have a dev server running
  if (!process.env.TEST_API_URL) {
    process.env.TEST_API_URL = 'http://localhost:3000';
  }
});

afterAll(() => {
  console.log('API test suite completed.');
});

beforeEach(() => {
  // Reset any test state if needed
});

afterEach(() => {
  // Clean up after each test
});