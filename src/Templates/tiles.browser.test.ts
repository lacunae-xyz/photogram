import { html, render, type LitElement } from 'lit';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-tile-large';
import './photogram-tile-small';
import type { Tile } from './tile';
import { palette } from '../Application/colors';
import tokens from '@lacunae-xyz/photogram-design-system/tokens.css?inline';

const shot = {
  sequence: '12',
  action: 'Théo est avec ses invités',
  period: 'soir',
  fx: 'x',
  url: '/demo/1.jpg',
  color: '#FFEB3B',
};

afterEach(() => render(null, document.body));

/** Paints the dot's fill over the tile, then the icon over the dot, and returns their WCAG contrast ratio. */
function contrast(tile: string, dot: string, icon: string) {
  const context = new OffscreenCanvas(1, 1).getContext('2d')!;
  const paint = (...colors: string[]) => {
    for (const color of colors) {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
    }
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    const linear = (channel: number) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const [lighter, darker] = [paint(tile, dot), paint(tile, dot, icon)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

async function frames(count: number) {
  for (let i = 0; i < count; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}

function part<T extends Element = HTMLElement>(tile: Tile, path: string[]) {
  let root: ParentNode | null | undefined = tile.shadowRoot;
  let found: Element | null | undefined;
  for (const selector of path) {
    found = root?.querySelector(selector);
    root = found?.shadowRoot ?? found;
  }
  if (!found) throw new Error(`nothing at ${path.join(' > ')}`);
  return found as T;
}

for (const tag of ['photogram-tile-small', 'photogram-tile-large'] as const) {
  describe(tag, () => {
    async function renderTile(
      fields: Partial<typeof shot> & {
        colorDistribution?: string;
      },
    ) {
      const tile = document.createElement(tag);
      Object.assign(tile, fields);
      render(html`${tile}`, document.body);
      await tile.updateComplete;
      for (const child of tile.shadowRoot?.querySelectorAll('*') ?? []) {
        await (child as Partial<Tile>).updateComplete;
      }
      return tile;
    }

    it('shows the shot', async () => {
      const tile = await renderTile(shot);
      expect(part(tile, ['photogram-sequence', '.sequence']).textContent).toBe(
        '12',
      );
      expect(part(tile, ['photogram-action', '.action']).textContent).toBe(
        shot.action,
      );
      expect(part(tile, ['photogram-image', '.img']).getAttribute('src')).toBe(
        '/demo/1.jpg',
      );
      await expect
        .element(page.getByRole('img', { name: 'period: evening' }))
        .toBeVisible();
      await expect
        .element(page.getByRole('img', { name: 'special effects indicator' }))
        .toBeVisible();
    });

    it('shows the empty image without a url', async () => {
      const tile = await renderTile({ ...shot, url: undefined });
      expect(
        part(tile, ['photogram-image', '.img']).getAttribute('src'),
      ).toMatch(/empty.*\.svg$/);
    });

    it('hides period and fx when unset', async () => {
      await renderTile({ sequence: '1' });
      for (const name of ['period', 'special effects indicator']) {
        await expect
          .element(page.getByRole('img', { name, includeHidden: true }))
          .not.toBeVisible();
      }
    });

    it('colours the sequence, with text that contrasts', async () => {
      const light = await renderTile(shot);
      const sequence = part(light, ['photogram-sequence', '.sequence']);
      expect(getComputedStyle(sequence)).toMatchObject({
        backgroundColor: 'rgb(255, 235, 59)',
        color: 'rgb(0, 0, 0)',
      });
      light.color = '#3F51B5';
      await light.updateComplete;
      await part<LitElement>(light, ['photogram-sequence']).updateComplete;
      expect(getComputedStyle(sequence).color).toBe('rgb(255, 255, 255)');
    });

    it('shows each period with its own icon', async () => {
      const paths = new Set();
      for (const period of ['matin', 'jour', 'soir', 'nuit']) {
        const tile = await renderTile({ ...shot, period });
        await part<LitElement>(tile, ['photogram-period', 'pg-icon'])
          .updateComplete;
        paths.add(
          part(tile, ['photogram-period', 'pg-icon', 'path']).getAttribute('d'),
        );
      }
      expect(paths.size).toBe(4);
    });

    it('names the period it shows', async () => {
      await renderTile({ ...shot, period: 'nuit' });
      await expect
        .element(page.getByRole('img', { name: 'period: night' }))
        .toBeVisible();
    });

    it('draws period and fx as dots their icons read on (3:1), on any label colour', async () => {
      const style = document.createElement('style');
      style.textContent = tokens;
      document.head.append(style);
      onTestFinished(() => style.remove());
      const labels = [undefined, '#FFFFFF', ...palette, '#000000'];
      for (const value of ['matin', 'jour', 'soir', 'nuit']) {
        for (const color of labels) {
          const tile = await renderTile({
            ...shot,
            period: value,
            color,
            colorDistribution: 'card',
          });
          for (const indicator of ['photogram-period', 'photogram-fx']) {
            const svg = part(tile, [indicator, 'pg-icon', 'svg']);
            const style = getComputedStyle(svg);
            expect(style.width, `${indicator} ${value} size`).toBe('20px');
            expect(style.borderRadius).not.toBe('0px');
            const ratio = contrast(
              getComputedStyle(tile).backgroundColor,
              style.backgroundColor,
              style.fill,
            );
            expect(
              ratio,
              `${indicator} ${value} on ${color ?? 'white'}`,
            ).toBeGreaterThanOrEqual(3);
          }
        }
      }
    });

    describe('in each colour scheme', () => {
      const withTokens = (scheme: string) => {
        const style = document.createElement('style');
        style.textContent = tokens;
        document.head.append(style);
        document.documentElement.style.colorScheme = scheme;
        onTestFinished(() => {
          style.remove();
          document.documentElement.style.colorScheme = '';
        });
      };

      it('keeps black text in the light scheme, the printed one', async () => {
        withTokens('light');
        for (const colorDistribution of ['indicator', 'card']) {
          const tile = await renderTile({ ...shot, colorDistribution });
          expect(getComputedStyle(tile).color, colorDistribution).toBe(
            'rgb(0, 0, 0)',
          );
        }
      });

      it('draws on the dark surface, in the light text colour', async () => {
        withTokens('dark');
        const tile = await renderTile({
          ...shot,
          colorDistribution: 'indicator',
        });
        expect(getComputedStyle(tile)).toMatchObject({
          backgroundColor: 'rgb(42, 42, 42)',
          color: 'rgb(238, 238, 238)',
        });
      });

      it('keeps a label-coloured tile as in the light scheme', async () => {
        withTokens('dark');
        const tile = await renderTile({ ...shot, colorDistribution: 'card' });
        expect(getComputedStyle(tile)).toMatchObject({
          backgroundColor: 'rgb(255, 235, 59)',
          color: 'rgb(0, 0, 0)',
          borderTopColor: 'rgb(170, 170, 170)',
        });
        tile.colorDistribution = 'indicator';
        await tile.updateComplete;
        expect(getComputedStyle(tile).color).toBe('rgb(238, 238, 238)');
      });

      it('draws period and fx as dots their icons read on (3:1)', async () => {
        withTokens('dark');
        for (const value of ['matin', 'jour', 'soir', 'nuit']) {
          const tile = await renderTile({
            ...shot,
            period: value,
            colorDistribution: 'indicator',
          });
          for (const indicator of ['photogram-period', 'photogram-fx']) {
            const style = getComputedStyle(
              part(tile, [indicator, 'pg-icon', 'svg']),
            );
            const ratio = contrast(
              getComputedStyle(tile).backgroundColor,
              style.backgroundColor,
              style.fill,
            );
            expect(ratio, `${indicator} ${value}`).toBeGreaterThanOrEqual(3);
          }
        }
      });
    });

    it('takes the label colour as background only for the card distribution', async () => {
      const tile = await renderTile({
        ...shot,
        colorDistribution: 'indicator',
      });
      expect(getComputedStyle(tile).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      tile.colorDistribution = 'card';
      await tile.updateComplete;
      expect(getComputedStyle(tile).backgroundColor).toBe('rgb(255, 235, 59)');
      tile.colorDistribution = 'indicator';
      await tile.updateComplete;
      expect(getComputedStyle(tile).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('is a box that print can keep in one piece', async () => {
      const tile = await renderTile(shot);
      expect(getComputedStyle(tile)).toMatchObject({
        display:
          tag === 'photogram-tile-small' ? 'inline-block' : 'inline-grid',
        breakInside: 'avoid',
      });
    });

    it('sizes the action with an inline font-size', async () => {
      const tile = await renderTile(shot);
      const action = part(tile, ['photogram-action', '.action']);
      await vi.waitFor(() => expect(action.style.fontSize).toMatch(/rem$/));
      const sized = action.style.fontSize;
      tile.action = `${shot.action} `.repeat(40);
      await tile.updateComplete;
      await vi.waitFor(() => expect(action.style.fontSize).not.toBe(sized));
    });

    it('stops sizing the action once the tile is removed', async () => {
      const tile = await renderTile({
        ...shot,
        action: `${shot.action} `.repeat(40),
      });
      const action = part(tile, ['photogram-action', '.action']);
      await vi.waitFor(() => expect(action.style.fontSize).toMatch(/rem$/));
      const sized = action.style.fontSize;
      expect(sized).not.toBe('1.25rem');
      document.createElement('div').append(tile);
      tile.action = shot.action;
      await frames(20);
      expect(action.style.fontSize).toBe(sized);
    });

    it('sizes the action again once the tile is put back', async () => {
      const tile = await renderTile(shot);
      const action = part(tile, ['photogram-action', '.action']);
      await vi.waitFor(() => expect(action.style.fontSize).toMatch(/rem$/));
      const sized = action.style.fontSize;
      const holder = document.createElement('div');
      holder.append(tile);
      document.body.append(holder);
      tile.action = `${shot.action} `.repeat(40);
      await vi.waitFor(() => expect(action.style.fontSize).not.toBe(sized));
    });
  });
}
