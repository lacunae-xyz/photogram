import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-button';
import '../tokens.css';

afterEach(() => render(null, document.body));

for (const tag of ['pg-button'] as const) {
  describe(tag, () => {
    async function renderButton(template: ReturnType<typeof html>) {
      render(template, document.body);
      const button = document.body.querySelector(tag);
      if (!button) throw new Error(`no ${tag}`);
      await button.updateComplete;
      return button;
    }

    function inner(host: HTMLElement) {
      const button = host.shadowRoot?.querySelector('button');
      if (!button) throw new Error('no inner button');
      return button;
    }

    const button = (content: string, attributes = '') =>
      tag === 'pg-button'
        ? html`<pg-button .label=${attributes}>${content}</pg-button>`
        : html`<pg-big-button .label=${attributes}>${content}</pg-big-button>`;

    it('is a button named by its content', async () => {
      await renderButton(button('Save'));
      await expect
        .element(page.getByRole('button', { name: 'Save' }))
        .toBeVisible();
    });

    it('is named by its label when it has one', async () => {
      await renderButton(button('←', 'Back'));
      await expect
        .element(page.getByRole('button', { name: 'Back' }))
        .toBeVisible();
    });

    it('is a plain button by default', async () => {
      const host = await renderButton(button('Save'));
      expect(inner(host).type).toBe('button');
    });

    it('dispatches click', async () => {
      const host = await renderButton(button('Save'));
      const onClick = vi.fn();
      host.addEventListener('click', onClick);
      await userEvent.click(page.getByRole('button', { name: 'Save' }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('takes no click when disabled', async () => {
      const host = await renderButton(button('Save'));
      host.disabled = true;
      await host.updateComplete;
      expect(host.hasAttribute('disabled')).toBe(true);
      await expect
        .element(page.getByRole('button', { name: 'Save' }))
        .toBeDisabled();
    });

    it('is focused with Tab and clicked with Enter and Space', async () => {
      const host = await renderButton(button('Save'));
      const onClick = vi.fn();
      host.addEventListener('click', onClick);
      await userEvent.tab();
      expect(host.shadowRoot?.activeElement).toBe(inner(host));
      expect(document.activeElement).toBe(host);
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('focuses its inner button from focus()', async () => {
      const host = await renderButton(button('Save'));
      host.focus();
      expect(host.shadowRoot?.activeElement).toBe(inner(host));
    });

    it('submits its form with type="submit"', async () => {
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      render(
        html`<form @submit=${onSubmit}>
          <input name="name" value="x" />
          ${
            tag === 'pg-button'
              ? html`<pg-button type="submit">Save</pg-button>`
              : html`<pg-big-button type="submit">Save</pg-big-button>`
          }
        </form>`,
        document.body,
      );
      await document.body.querySelector(tag)?.updateComplete;
      await userEvent.click(page.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('resets its form with type="reset"', async () => {
      render(
        html`<form>
          <input name="name" value="x" />
          ${
            tag === 'pg-button'
              ? html`<pg-button type="reset">Reset</pg-button>`
              : html`<pg-big-button type="reset">Reset</pg-big-button>`
          }
        </form>`,
        document.body,
      );
      await document.body.querySelector(tag)?.updateComplete;
      const input = document.body.querySelector('input')!;
      input.value = 'changed';
      await userEvent.click(page.getByRole('button', { name: 'Reset' }));
      expect(input.value).toBe('x');
    });

    it("doesn't submit its form by default", async () => {
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      render(
        html`<form @submit=${onSubmit}>
          ${
            tag === 'pg-button'
              ? html`<pg-button>Close</pg-button>`
              : html`<pg-big-button>Close</pg-big-button>`
          }
        </form>`,
        document.body,
      );
      await document.body.querySelector(tag)?.updateComplete;
      await userEvent.click(page.getByRole('button', { name: 'Close' }));
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
}

describe('pg-button variant="icon"', () => {
  it('reflects the variant and is round', async () => {
    render(
      html`<pg-button variant="icon" label="Print">P</pg-button>`,
      document.body,
    );
    const host = document.body.querySelector('pg-button')!;
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('icon');
    const inner = host.shadowRoot!.querySelector('button')!;
    expect(getComputedStyle(inner).borderTopLeftRadius).not.toBe('0px');
    await expect
      .element(page.getByRole('button', { name: 'Print' }))
      .toBeVisible();
  });
});
