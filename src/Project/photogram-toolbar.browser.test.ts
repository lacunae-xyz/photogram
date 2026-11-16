import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './photogram-toolbar';

afterEach(() => render(null, document.body));

async function renderToolbar(exportable: boolean) {
  render(
    html`<photogram-toolbar
      heading="Le fardeau"
      ?exportable=${exportable}
    ></photogram-toolbar>`,
    document.body,
  );
  const toolbar = document.body.querySelector('photogram-toolbar')!;
  await toolbar.updateComplete;
  return toolbar;
}

describe('photogram-toolbar', () => {
  it('shows the project name', async () => {
    await renderToolbar(false);
    await expect
      .element(page.getByRole('heading', { name: 'Le fardeau' }))
      .toBeVisible();
  });

  it('offers export only when exportable', async () => {
    const toolbar = await renderToolbar(false);
    const exportButton = page.getByRole('button', { name: 'Export data.json' });
    await expect.element(exportButton).not.toBeInTheDocument();
    toolbar.exportable = true;
    await toolbar.updateComplete;
    await expect.element(exportButton).toBeVisible();
  });

  it('tells back, export and print', async () => {
    const toolbar = await renderToolbar(true);
    const events: string[] = [];
    for (const type of ['back', 'export', 'print']) {
      toolbar.addEventListener(type, () => events.push(type));
    }
    await userEvent.click(page.getByRole('button', { name: 'Close' }));
    await userEvent.click(
      page.getByRole('button', { name: 'Export data.json' }),
    );
    await userEvent.click(page.getByRole('button', { name: 'Print' }));
    expect(events).toEqual(['back', 'export', 'print']);
  });

  it('reaches every button with the keyboard', async () => {
    const toolbar = await renderToolbar(true);
    const onPrint = vi.fn();
    toolbar.addEventListener('print', onPrint);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onPrint).toHaveBeenCalledOnce();
  });
});
