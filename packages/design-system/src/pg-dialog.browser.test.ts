import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-dialog';
import type { PgDialog } from './pg-dialog';

afterEach(() => render(null, document.body));

async function renderDialog(open: boolean) {
  render(
    html`<button id="outside">Outside</button>
      <pg-dialog ?open=${open} label="Edit shot">
        <form>
          <input id="first" />
          <input id="focused" autofocus />
          <button type="button">Inside</button>
        </form>
      </pg-dialog>`,
    document.body,
  );
  const dialog = document.body.querySelector('pg-dialog');
  if (!dialog) throw new Error('no pg-dialog');
  await dialog.updateComplete;
  return dialog;
}

function nativeDialog(host: PgDialog) {
  const dialog = host.shadowRoot?.querySelector('dialog');
  if (!dialog) throw new Error('no native dialog');
  return dialog;
}

describe('pg-dialog', () => {
  it('is closed by default', async () => {
    const host = await renderDialog(false);
    expect(nativeDialog(host).open).toBe(false);
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modal with its content, named by its label', async () => {
    const host = await renderDialog(true);
    expect(nativeDialog(host).matches(':modal')).toBe(true);
    await expect
      .element(page.getByRole('dialog', { name: 'Edit shot' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Inside' }))
      .toBeVisible();
  });

  it('opens when open is set, closes when it is cleared', async () => {
    const host = await renderDialog(false);
    const onClose = vi.fn();
    host.addEventListener('close', onClose);
    host.open = true;
    await host.updateComplete;
    expect(nativeDialog(host).matches(':modal')).toBe(true);
    expect(host.hasAttribute('open')).toBe(true);
    host.open = false;
    await host.updateComplete;
    expect(nativeDialog(host).open).toBe(false);
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
  });

  it('moves focus to the autofocus field', async () => {
    await renderDialog(true);
    expect(document.activeElement?.id).toBe('focused');
  });

  it('keeps focus inside: the page behind is inert', async () => {
    await renderDialog(true);
    document.getElementById('outside')?.focus();
    expect(document.activeElement?.id).toBe('focused');
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('Inside');
  });

  it('closes on Escape and dispatches close', async () => {
    const host = await renderDialog(true);
    const onClose = vi.fn();
    host.addEventListener('close', onClose);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(host.open).toBe(false);
    expect(host.hasAttribute('open')).toBe(false);
    expect(nativeDialog(host).open).toBe(false);
  });

  it('closes on a backdrop click', async () => {
    const host = await renderDialog(true);
    const onClose = vi.fn();
    host.addEventListener('close', onClose);
    nativeDialog(host).click();
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(host.open).toBe(false);
  });

  it('stays open on a click inside', async () => {
    const host = await renderDialog(true);
    const onClose = vi.fn();
    host.addEventListener('close', onClose);
    await userEvent.click(page.getByRole('button', { name: 'Inside' }));
    await userEvent.click(page.getByRole('textbox').first());
    expect(host.open).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
