import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pg-big-button';
import './pg-button';
import './pg-icon';
import '../tokens.css';

afterEach(() => render(null, document.body));

/** The computed colour of a token, as the browser resolves it. */
function token(name: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

async function innerOf(template: ReturnType<typeof html>, tag: string) {
  render(template, document.body);
  const host = document.body.querySelector(tag) as HTMLElement & {
    updateComplete: Promise<boolean>;
  };
  await host.updateComplete;
  return host.shadowRoot!.querySelector('button')!;
}

for (const tag of ['pg-button', 'pg-big-button'] as const) {
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
      const onClick = vi.fn();
      host.addEventListener('click', onClick);
      host.disabled = true;
      await host.updateComplete;
      expect(host.hasAttribute('disabled')).toBe(true);
      const save = page.getByRole('button', { name: 'Save' });
      await expect.element(save).toBeDisabled();
      await userEvent.click(save, { force: true });
      expect(onClick).not.toHaveBeenCalled();
    });

    it('is disabled by a disabled fieldset', async () => {
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      render(
        html`<form @submit=${onSubmit}>
          <fieldset disabled>
            ${
              tag === 'pg-button'
                ? html`<pg-button type="submit">Save</pg-button>`
                : html`<pg-big-button type="submit">Save</pg-big-button>`
            }
          </fieldset>
        </form>`,
        document.body,
      );
      const host = document.body.querySelector(tag)!;
      await host.updateComplete;
      const save = page.getByRole('button', { name: 'Save' });
      await expect.element(save).toBeDisabled();
      document.body.querySelector('fieldset')!.disabled = false;
      await expect.element(save).toBeEnabled();
      await userEvent.click(save);
      expect(onSubmit).toHaveBeenCalledOnce();
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

describe('pg-button', () => {
  it('is green: accent text, green hover tint', async () => {
    const inner = await innerOf(
      html`<pg-button>Close</pg-button>`,
      'pg-button',
    );
    expect(getComputedStyle(inner).color).toBe(token('--pg-color-accent-text'));
    await userEvent.hover(inner);
    expect(getComputedStyle(inner).backgroundColor).toBe(
      token('--pg-color-hover'),
    );
  });

  it("doesn't draw a disabled button in the accent colour", async () => {
    const inner = await innerOf(
      html`<pg-button disabled>Close</pg-button>`,
      'pg-button',
    );
    expect(getComputedStyle(inner).color).not.toBe(
      token('--pg-color-accent-text'),
    );
  });

  it("doesn't tint a disabled button on hover", async () => {
    const inner = await innerOf(
      html`<pg-button disabled>Close</pg-button>`,
      'pg-button',
    );
    await userEvent.hover(inner, { force: true });
    expect(getComputedStyle(inner).backgroundColor).not.toBe(
      token('--pg-color-hover'),
    );
  });

  it('rings the keyboard focus in the focus colour', async () => {
    const inner = await innerOf(
      html`<pg-button>Close</pg-button>`,
      'pg-button',
    );
    await userEvent.tab();
    expect(getComputedStyle(inner).outlineColor).toBe(
      token('--pg-color-focus'),
    );
  });
});

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
  it('paints its icon in the text colour, and in the accent text on hover', async () => {
    render(
      html`<p style="color: rgb(1, 2, 3)">
        <pg-button variant="icon" label="Print"
          ><pg-icon name="print"></pg-icon
        ></pg-button>
      </p>`,
      document.body,
    );
    const host = document.body.querySelector('pg-button')!;
    const icon = document.body.querySelector('pg-icon')!;
    await host.updateComplete;
    await icon.updateComplete;
    const svg = icon.shadowRoot!.querySelector('svg')!;
    expect(getComputedStyle(svg).fill).toBe('rgb(1, 2, 3)');
    await userEvent.hover(host);
    expect(getComputedStyle(svg).fill).toBe(token('--pg-color-accent-text'));
  });
});

describe('pg-big-button', () => {
  it('is raised', async () => {
    render(html`<pg-big-button>Open</pg-big-button>`, document.body);
    const host = document.body.querySelector('pg-big-button')!;
    await host.updateComplete;
    const inner = host.shadowRoot!.querySelector('button')!;
    expect(getComputedStyle(inner).boxShadow).not.toBe('none');
  });

  it('is red, the only button that is', async () => {
    const inner = await innerOf(
      html`<pg-big-button>Open</pg-big-button>`,
      'pg-big-button',
    );
    expect(getComputedStyle(inner).backgroundColor).toBe(
      token('--pg-color-action'),
    );
    expect(getComputedStyle(inner).color).toBe(token('--pg-color-on-action'));
  });
});
