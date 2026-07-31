import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/harness/specs/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    root: path.resolve(__dirname, '../../'),
  },
});
