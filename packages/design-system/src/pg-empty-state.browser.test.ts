import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import './pg-empty-state';

afterEach(() => render(null, document.body));

async function renderEmptyState(template: ReturnType<typeof html>) {
  render(template, document.body);
  const emptyState = document.body.querySelector('pg-empty-state');
  if (!emptyState) throw new Error('no pg-empty-state');
  await emptyState.updateComplete;
  return emptyState;
}

describe('pg-empty-state', () => {
  it('shows its illustration, named by its label', async () => {
    await renderEmptyState(
      html`<pg-empty-state
        illustration="empty-street"
        label="No project"
      ></pg-empty-state>`,
    );
    await expect
      .element(page.getByRole('img', { name: 'No project' }))
      .toBeVisible();
  });

  it('puts its content under the illustration', async () => {
    await renderEmptyState(
      html`<pg-empty-state illustration="secure-files">
        <p>Permission needs to be given again</p>
        <button>Grant permission</button>
      </pg-empty-state>`,
    );
    const button = page.getByRole('button', { name: 'Grant permission' });
    await expect.element(button).toBeVisible();
    const image = await vi.waitFor(() => {
      const image = document
        .querySelector('pg-empty-state')!
        .shadowRoot!.querySelector('pg-illustration')!
        .shadowRoot!.querySelector('img');
      if (!image) throw new Error('no img yet');
      return image;
    });
    await image.decode();
    const text = page.getByText('Permission needs to be given again').element();
    expect(text.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      image.getBoundingClientRect().bottom,
    );
    expect(image.alt).toBe('');
  });

  it('lets the page size the illustration', async () => {
    const style = document.createElement('style');
    style.textContent = 'pg-empty-state::part(illustration) { width: 200px; }';
    document.head.append(style);
    try {
      const emptyState = await renderEmptyState(
        html`<pg-empty-state
          illustration="empty-street"
          label="No project"
        ></pg-empty-state>`,
      );
      const image = page.getByRole('img', { name: 'No project' });
      await expect.element(image).toBeVisible();
      expect(image.element().getBoundingClientRect().width).toBe(200);
      const host = emptyState.getBoundingClientRect();
      const box = image.element().getBoundingClientRect();
      expect(box.left - host.left).toBeCloseTo(host.right - box.right, 0);
    } finally {
      style.remove();
    }
  });
});
