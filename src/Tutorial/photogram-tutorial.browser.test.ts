import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { colors } from '../Application';
import './photogram-tutorial';

afterEach(() => render(null, document.body));

async function renderTutorial() {
  render(
    html`<photogram-tutorial
      ><header slot="header">Site header</header></photogram-tutorial
    >`,
    document.body,
  );
  const tutorial = document.body.querySelector('photogram-tutorial')!;
  await tutorial.updateComplete;
  const tile = tutorial.shadowRoot!.querySelector('photogram-tile-small')!;
  return { tutorial, tile };
}

function field(name: string) {
  return document
    .querySelector('photogram-tutorial')!
    .shadowRoot!.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
}

describe('photogram-tutorial', () => {
  it('shows the tutorial under the header', async () => {
    await renderTutorial();
    await expect.element(page.getByText('Site header')).toBeVisible();
    await expect
      .element(
        page.getByRole('heading', { name: 'Comment utiliser Photogram' }),
      )
      .toBeVisible();
  });

  it('shows the example row as a tile', async () => {
    const { tile } = await renderTutorial();
    expect(tile.sequence).toBe('1');
    expect(tile.action).toBe('Théo est avec ses invités');
    expect(tile.period).toBe('soir');
    expect(tile.fx).toBe('fx');
    expect(tile.url).toBe('/demo/1.jpg');
    expect(tile.color).toBe(colors[5]);
    expect(tile.colorDistribution).toBe('indicator');
  });

  it('updates the tile as the form is typed in', async () => {
    const { tutorial, tile } = await renderTutorial();
    await userEvent.fill(field('action'), 'Alice entre');
    await userEvent.fill(field('sequence'), '12');
    await userEvent.fill(field('period'), 'nuit');
    await tutorial.updateComplete;
    expect(tile.action).toBe('Alice entre');
    expect(tile.sequence).toBe('12');
    expect(tile.period).toBe('nuit');
  });

  it('colours the tile by the label length, none without a label', async () => {
    const { tutorial, tile } = await renderTutorial();
    await userEvent.fill(field('label'), 'cuisine');
    await tutorial.updateComplete;
    expect(tile.color).toBe(colors[7]);
    await userEvent.clear(field('label'));
    await tutorial.updateComplete;
    expect(tile.color).toBe('');
  });
});
