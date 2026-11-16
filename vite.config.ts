import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // Assets stay files named like CRA's (`empty.<hex>.svg`): edit.spec matches the empty image src on that.
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        hashCharacters: 'hex',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  test: {
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/setupTests.js'],
  },
});
