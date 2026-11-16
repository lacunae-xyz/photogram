import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Shot } from '../Application/types';
import type { PhotogramTiles } from './photogram-tiles';
import './photogram-tiles';

afterEach(() => render(null, document.body));

const shots: Shot[] = [
  { id: '1', sequence: '1', action: 'Ouverture', label: 'salon' },
  { id: '2', sequence: '2', action: 'Deuxième' },
];

async function renderTiles(settings: Partial<PhotogramTiles> = {}) {
  const element = document.createElement('photogram-tiles');
  Object.assign(element, {
    shots,
    template: 'small',
    colors: { salon: '#F44336' },
    defaultColor: '#3F51B5',
    colorDistribution: 'indicator',
    ...settings,
  });
  render(html`${element}`, document.body);
  await element.updateComplete;
  return element;
}

const tiles = (element: PhotogramTiles) => [
  ...element.shadowRoot!.querySelectorAll(
    '.tiles-container > :is(photogram-tile-small, photogram-tile-large)',
  ),
];

describe('photogram-tiles', () => {
  it('renders nothing without shots', async () => {
    const element = await renderTiles({ shots: undefined });
    expect(element.shadowRoot!.querySelector('.tiles-container')).toBeNull();
  });

  it('shows a tile per shot, in the chosen template', async () => {
    const element = await renderTiles();
    expect(tiles(element).map(tile => tile.localName)).toEqual([
      'photogram-tile-small',
      'photogram-tile-small',
    ]);
    element.template = 'large';
    await element.updateComplete;
    expect(tiles(element).map(tile => tile.localName)).toEqual([
      'photogram-tile-large',
      'photogram-tile-large',
    ]);
  });

  it('colours a tile by its label, or with the default colour', async () => {
    const element = await renderTiles({ colorDistribution: 'card' });
    expect(tiles(element)).toMatchObject([
      {
        sequence: '1',
        action: 'Ouverture',
        color: '#F44336',
        colorDistribution: 'card',
      },
      { sequence: '2', color: '#3F51B5' },
    ]);
  });

  it('tells which tile was clicked', async () => {
    const element = await renderTiles();
    const onSelect = vi.fn();
    element.addEventListener('tile-select', onSelect);
    await userEvent.click(page.elementLocator(tiles(element)[1]));
    expect(onSelect.mock.calls[0][0].detail).toEqual({ shot: shots[1] });
  });

  it('sets the print spacing class', async () => {
    const element = await renderTiles();
    const container = () =>
      element.shadowRoot!.querySelector('.tiles-container')!;
    expect(container().className).toBe('tiles-container print-no-space');
    element.printSpaceAround = true;
    await element.updateComplete;
    expect(container().className).toBe('tiles-container print-space-around');
  });

  it('re-creates every tile on a new font, so each title is sized again', async () => {
    const element = await renderTiles({ fontFamily: 'Arial' });
    const before = tiles(element);
    element.shots = shots.map(shot => ({ ...shot }));
    await element.updateComplete;
    expect(tiles(element)).toEqual(before);
    element.fontFamily = 'Georgia';
    await element.updateComplete;
    const after = tiles(element);
    expect(after).toHaveLength(2);
    after.forEach((tile, i) => expect(tile).not.toBe(before[i]));
    expect(
      getComputedStyle(element.shadowRoot!.querySelector('.tiles-container')!)
        .fontFamily,
    ).toBe('Georgia');
  });
});
