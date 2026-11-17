import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-demo';

afterEach(() => render(null, document.body));

describe('photogram-demo', () => {
  it('shows the demo project from /demo', async () => {
    render(html`<photogram-demo></photogram-demo>`, document.body);
    await expect
      .element(page.getByRole('heading', { name: 'Le fardeau (démo)' }))
      .toBeVisible();
    const demo = document.body.querySelector('photogram-demo')!;
    const project = demo.shadowRoot!.querySelector('photogram-project')!;
    expect(project.projectId).toBe('demo');
    const tiles = () =>
      project
        .shadowRoot!.querySelector('photogram-tiles')!
        .shadowRoot!.querySelectorAll('photogram-tile-small');
    await vi.waitFor(() => expect(tiles()).toHaveLength(15));
    expect(tiles()[0].url).toBe(new URL('/demo/1.jpg', location.href).href);
  });

  it('sends back from the project', async () => {
    render(html`<photogram-demo></photogram-demo>`, document.body);
    const demo = document.body.querySelector('photogram-demo')!;
    const back = vi.fn();
    demo.addEventListener('back', back);
    await expect
      .element(page.getByRole('heading', { name: 'Le fardeau (démo)' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    expect(back).toHaveBeenCalledOnce();
  });
});
