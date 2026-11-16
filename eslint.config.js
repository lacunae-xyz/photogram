import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
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
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [eslintReact.configs.recommended],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React rules CRA didn't have. Phase 6 replaces these components with Lit.
      '@eslint-react/no-access-state-in-setstate': 'off',
      '@eslint-react/no-set-state-in-component-did-update': 'off',
      '@eslint-react/no-unused-class-component-members': 'off',
      '@eslint-react/set-state-in-effect': 'off',
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
