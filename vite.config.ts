import { Features } from 'lightningcss';
import ts from 'typescript';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Oxc only lowers legacy decorators, and browsers don't run standard ones yet.
// Vite's migration guide suggests Babel or SWC. TypeScript is already installed.
function standardDecorators(): Plugin {
  return {
    name: 'standard-decorators',
    enforce: 'pre',
    transform: {
      filter: {
        // The dev server adds ?t=… to modules imported after an edit, and ?import to some.
        id: { include: /\.ts(\?.*)?$/, exclude: /\/node_modules\// },
        code: /^\s*@\w/m,
      },
      handler(code, id) {
        const { outputText, sourceMapText } = ts.transpileModule(code, {
          fileName: id.replace(/\?.*$/, ''),
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            sourceMap: true,
            // One copy of __esDecorate & co. from tslib, not one per element.
            importHelpers: true,
          },
        });
        return {
          code: outputText.replace(/\/\/# sourceMappingURL=.*$/, ''),
          map: sourceMapText,
        };
      },
    },
  };
}

export default defineConfig({
  plugins: [standardDecorators()],
  // standardDecorators adds the tslib imports after the dependency scan.
  optimizeDeps: { include: ['tslib'] },
  css: {
    lightningcss: {
      // Native light-dark(): the polyfill resolves it through variables only CSS files' color-scheme sets, so Lit
      // styles and inline color-scheme (label-coloured tiles) couldn't switch a token. Browsers without
      // light-dark() get the light tokens from tokens.css' @supports fallback.
      exclude: Features.LightDark,
    },
  },
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
    // Every src file, so the ones no test loads show at 0%. Run one project at a time with its own
    // --coverage.reportsDirectory to get a report per suite.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/**/*.test.{ts,js}', 'src/setupTests.js'],
      reporter: ['html', 'json-summary', 'lcov', 'text-summary'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{js,ts}'],
          exclude: ['**/*.browser.test.ts'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['src/setupTests.js'],
        },
      },
      {
        extends: true,
        // Discovered late, they'd reload the page mid-run.
        optimizeDeps: {
          include: [
            'lit',
            'lit/decorators.js',
            'lit/directives/keyed.js',
            'lit/directives/ref.js',
            'lit/directives/repeat.js',
            'lit/directives/style-map.js',
            'lit/static-html.js',
          ],
        },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
