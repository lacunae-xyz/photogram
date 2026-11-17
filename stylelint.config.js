// Raw colours, radii, shadows and fonts belong in the design-system tokens.
const notAToken = /^(?!var\(--pg-|(inherit|initial|unset|none|0)$)/;

export default {
  ignoreFiles: [
    'packages/design-system/tokens.css',
    'dist/**',
    'coverage/**',
    'e2e/**',
    'public/**',
  ],
  overrides: [{ files: ['**/*.ts'], customSyntax: 'postcss-lit' }],
  reportNeedlessDisables: true,
  reportDescriptionlessDisables: true,
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'oklch',
      'lab',
      'lch',
    ],
    'declaration-property-value-disallowed-list': {
      '/^(border(-[a-z]+)*-radius|box-shadow|font|font-family|font-size)$/': [
        notAToken,
      ],
    },
  },
};
