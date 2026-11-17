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
    files: ['src/**/*.{js,jsx,ts}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The Fixor island is the last React code. It leaves for its own repo in phase 7.
    files: ['src/Fixor/**/*.{js,jsx}'],
    extends: [eslintReact.configs.recommended],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Not in CRA's rules. Fixor stays as it is until phase 7 ports it to Lit.
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
