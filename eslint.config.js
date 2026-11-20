import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist', 'coverage', 'e2e', 'public'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.test.{js,ts}'],
    languageOptions: {
      globals: globals.vitest,
    },
  },
  prettier,
);
