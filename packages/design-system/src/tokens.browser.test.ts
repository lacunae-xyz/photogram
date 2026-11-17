import { afterAll, describe, expect, it } from 'vitest';
import '../tokens.css';

type Rgba = [number, number, number, number];
type Scheme = 'light' | 'dark';

const probe = document.createElement('span');
document.body.append(probe);
afterAll(() => probe.remove());

/** A token's colour in `scheme`, as the browser resolves it: through `color`, which resolves light-dark(). */
function resolve(token: string, scheme: Scheme): Rgba {
  probe.style.colorScheme = scheme;
  probe.style.color = `var(${token})`;
  const color = getComputedStyle(probe).color;
  const values = (color.match(/[\d.]+/g) ?? []).map(Number);
  // color-mix() computes to color(srgb r g b / a), with channels from 0 to 1.
  const scale = color.startsWith('color(srgb') ? 255 : 1;
  const [r = 0, g = 0, b = 0, a = 1] = values;
  return [r * scale, g * scale, b * scale, a];
}

/** `top` painted over `bottom`, each channel rounded to 8 bits as the browser paints it. */
function over([r, g, b, a]: Rgba, [br, bg, bb, ba]: Rgba): Rgba {
  const alpha = a + ba * (1 - a);
  const mix = (top: number, under: number) =>
    Math.round((top * a + under * ba * (1 - a)) / alpha);
  return [mix(r, br), mix(g, bg), mix(b, bb), alpha];
}

function luminance([r, g, b]: Rgba) {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function ratio(a: Rgba, b: Rgba) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/** A surface: its token, or a translucent token over another surface (`hover over surface`). */
type Surface = string;

/** Paints a surface from the page up: each `x over y` composites x on y, the last one on the page's surface. */
function paint(surface: Surface, scheme: Scheme): Rgba {
  const layers = surface.split(' over ').reverse();
  let colour = resolve('--pg-color-surface', scheme);
  for (const layer of layers) {
    colour = over(resolve(`--pg-${layer}`, scheme), colour);
  }
  return colour;
}

function contrast(foreground: string, surface: Surface, scheme: Scheme) {
  const background = paint(surface, scheme);
  return ratio(
    over(resolve(`--pg-${foreground}`, scheme), background),
    background,
  );
}

const page = [
  'color-surface',
  'color-surface-raised',
  'color-surface-alt',
  'color-fill',
  'color-hover over color-surface',
  'color-hover over color-surface-raised',
];

/** Text, 4.5:1: each token on every surface it can sit on. */
const text: Record<string, Surface[]> = {
  'color-text': page,
  'color-text-muted': page,
  'color-text-subtle': page,
  // Links and pg-button: on the surfaces and pg-button's hover tint, not on the fill (4.2:1 in light).
  'color-accent-text': [
    'color-surface',
    'color-surface-raised',
    'color-surface-alt',
    'color-hover over color-surface',
    'color-hover over color-surface-raised',
  ],
  // The header, the image area, card badges and period dots, the theme switch.
  'color-on-chrome': [
    'color-chrome',
    'color-on-chrome-hover over color-chrome',
    'color-backdrop over color-chrome',
  ],
  'color-on-chrome-muted': ['color-chrome'],
  // The current nav link, the theme switch's pressed button, the fx dot.
  'color-on-accent': ['color-accent'],
  'color-on-action': ['color-action'],
};

/** Icons and focus rings, 3:1. Not on the fill (2.9:1 in light): no icon or focusable control sits on it. */
const iconSurfaces = page.filter(surface => surface !== 'color-fill');
const nonText: Record<string, Surface[]> = {
  'color-accent-icon': iconSurfaces,
  'color-focus': [...iconSurfaces, 'color-chrome'],
};

const schemes: Scheme[] = ['light', 'dark'];

describe('tokens.css contrast', () => {
  // The nav's hover tint: on-chrome at 10% (pg-header). Not a token, so the test gives it one.
  document.documentElement.style.setProperty(
    '--pg-color-on-chrome-hover',
    'color-mix(in srgb, var(--pg-color-on-chrome) 10%, transparent)',
  );

  for (const scheme of schemes) {
    describe(scheme, () => {
      for (const [token, surfaces] of Object.entries(text)) {
        it.each(surfaces)(`${token} on %s: 4.5:1`, surface => {
          expect(contrast(token, surface, scheme)).toBeGreaterThanOrEqual(4.5);
        });
      }

      for (const [token, surfaces] of Object.entries(nonText)) {
        it.each(surfaces)(`${token} on %s: 3:1`, surface => {
          expect(contrast(token, surface, scheme)).toBeGreaterThanOrEqual(3);
        });
      }
    });
  }

  // Both pass by under 0.01: a step darker surface or a lighter text fails them.
  it('on-action on red-600 passes at 4.503', () => {
    for (const scheme of schemes) {
      const value = contrast('color-on-action', 'color-action', scheme);
      expect(value).toBeGreaterThanOrEqual(4.5);
      expect(value).toBeCloseTo(4.503, 3);
    }
  });

  it('accent-text on surface-alt passes at 4.5006 (light)', () => {
    const value = contrast('color-accent-text', 'color-surface-alt', 'light');
    expect(value).toBeGreaterThanOrEqual(4.5);
    expect(value).toBeCloseTo(4.5006, 4);
  });

  it('resolves light-dark() per scheme', () => {
    expect(resolve('--pg-color-surface', 'light')).toEqual([255, 255, 255, 1]);
    expect(resolve('--pg-color-surface', 'dark')).toEqual([34, 34, 34, 1]);
  });
});
