import { html, render, type LitElement } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-tile-large';
import './photogram-tile-small';
import type { Tile } from './tile';

const shot = {
  sequence: '12',
  action: 'Théo est avec ses invités',
  period: 'soir',
  fx: 'x',
  url: '/demo/1.jpg',
  color: '#FFEB3B',
};

afterEach(() => render(null, document.body));

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
        .element(page.getByRole('img', { name: 'period' }))
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
