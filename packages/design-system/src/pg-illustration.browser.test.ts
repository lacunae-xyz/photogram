import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { illustrationNames, type PgIllustration } from './pg-illustration';

afterEach(() => render(null, document.body));

function renderIllustration(template: ReturnType<typeof html>) {
  render(template, document.body);
  const illustration = document.body.querySelector('pg-illustration');
  if (!illustration) throw new Error('no pg-illustration');
  return illustration;
}

async function loadedImage(illustration: PgIllustration) {
  const image = await vi.waitFor(() => {
    const image = illustration.shadowRoot!.querySelector('img');
    if (!image) throw new Error('no img yet');
    return image;
  });
  await image.decode();
  return image;
}

async function svgOf(illustration: PgIllustration) {
  const image = await loadedImage(illustration);
  return decodeURIComponent(
    image.src.slice('data:image/svg+xml,'.length),
  ).toLowerCase();
}

describe('pg-illustration', () => {
  it('has the illustrations the pages use', () => {
    expect([...illustrationNames].sort()).toEqual([
      'editable',
      'empty-street',
      'folder',
      'learning',
      'presentation',
      'private-files',
      'the-search',
      'upload-image',
      'videographer',
      'web-developer',
    ]);
  });

  it.each(illustrationNames)('loads %s', async name => {
    const image = await loadedImage(
      renderIllustration(
        html`<pg-illustration name=${name}></pg-illustration>`,
      ),
    );
    expect(image.naturalWidth).toBeGreaterThan(0);
  });

  it('is decorative without a label', async () => {
    const image = await loadedImage(
      renderIllustration(
        html`<pg-illustration name="empty-street"></pg-illustration>`,
      ),
    );
    expect(image.alt).toBe('');
    await expect.element(page.getByRole('img')).not.toBeInTheDocument();
  });

  it('is an image named by its label', async () => {
    renderIllustration(
      html`<pg-illustration
        name="empty-street"
        label="No project"
      ></pg-illustration>`,
    );
    await expect
      .element(page.getByRole('img', { name: 'No project' }))
      .toBeVisible();
  });

  it('keeps the unDraw colours when the tokens are not set', async () => {
    const svg = await svgOf(
      renderIllustration(
        html`<pg-illustration name="empty-street"></pg-illustration>`,
      ),
    );
    expect(svg).toContain('fill="#38d39f"');
    expect(svg).toContain('fill="#3f3d56"');
  });

  it('paints with the tokens', async () => {
    const svg = await svgOf(
      renderIllustration(
        html`<pg-illustration
          name="folder"
          style="--pg-color-accent: #00ff00; --pg-illus-ink: #111111; --pg-illus-bg: #222222; --pg-illus-shape: #444444; --pg-illus-line: #555555; --pg-illus-paper: #333333"
        ></pg-illustration>`,
      ),
    );
    for (const colour of [
      '#38d39f',
      '#3f3d56',
      '#f2f2f2',
      '#e6e6e6',
      '"#ccc"',
      '"#fff"',
    ]) {
      expect(svg).not.toContain(colour);
    }
    for (const colour of [
      'rgb(0, 255, 0)',
      'rgb(17, 17, 17)',
      'rgb(34, 34, 34)',
      'rgb(68, 68, 68)',
      'rgb(85, 85, 85)',
      'rgb(51, 51, 51)',
    ]) {
      expect(svg).toContain(`fill="${colour}"`);
    }
    // No token for skin.
    expect(svg).toContain('fill="#9e616a"');
  });

  describe('with light-dark() tokens', () => {
    const style =
      '--pg-color-accent: #00ff00; --pg-illus-bg: light-dark(#eeeeee, #333333)';

    afterEach(() => {
      delete document.documentElement.dataset.theme;
      document.documentElement.style.colorScheme = '';
    });

    it('paints in the light scheme', async () => {
      document.documentElement.style.colorScheme = 'light';
      const svg = await svgOf(
        renderIllustration(
          html`<pg-illustration
            name="folder"
            style=${style}
          ></pg-illustration>`,
        ),
      );
      expect(svg).toContain('fill="rgb(238, 238, 238)"');
      expect(svg).not.toContain('light-dark');
    });

    it('paints in the dark scheme', async () => {
      document.documentElement.style.colorScheme = 'dark';
      const svg = await svgOf(
        renderIllustration(
          html`<pg-illustration
            name="folder"
            style=${style}
          ></pg-illustration>`,
        ),
      );
      expect(svg).toContain('fill="rgb(51, 51, 51)"');
    });

    it("paints in its own element's scheme", async () => {
      document.documentElement.style.colorScheme = 'dark';
      const svg = await svgOf(
        renderIllustration(
          html`<div style="color-scheme: light">
            <pg-illustration name="folder" style=${style}></pg-illustration>
          </div>`,
        ),
      );
      expect(svg).toContain('fill="rgb(238, 238, 238)"');
    });

    it('paints again when <html data-theme> changes', async () => {
      // What tokens.css does with data-theme, without the screen-only media query vitest's page doesn't need.
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(
        ":root[data-theme='light'] { color-scheme: light } :root[data-theme='dark'] { color-scheme: dark }",
      );
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      try {
        document.documentElement.dataset.theme = 'light';
        const illustration = renderIllustration(
          html`<pg-illustration
            name="folder"
            style=${style}
          ></pg-illustration>`,
        );
        expect(await svgOf(illustration)).toContain(
          'fill="rgb(238, 238, 238)"',
        );
        document.documentElement.dataset.theme = 'dark';
        await vi.waitFor(async () =>
          expect(await svgOf(illustration)).toContain('fill="rgb(51, 51, 51)"'),
        );
      } finally {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
          adopted => adopted !== sheet,
        );
      }
    });

    it('stops listening once disconnected', async () => {
      const illustration = renderIllustration(
        html`<pg-illustration name="folder" style=${style}></pg-illustration>`,
      );
      await loadedImage(illustration);
      render(null, document.body);
      const update = vi.spyOn(illustration, 'requestUpdate');
      document.documentElement.dataset.theme = 'dark';
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(update).not.toHaveBeenCalled();
    });
  });

  it('switches illustration with its name', async () => {
    const illustration = renderIllustration(
      html`<pg-illustration name="empty-street"></pg-illustration>`,
    );
    await loadedImage(illustration);
    illustration.name = 'learning';
    await vi.waitFor(async () =>
      expect(await svgOf(illustration)).toContain('<title>learning</title>'),
    );
  });

  it('renders nothing for an unknown name', async () => {
    const illustration = renderIllustration(
      html`<pg-illustration name="nope"></pg-illustration>`,
    );
    await illustration.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(illustration.shadowRoot!.querySelector('img')).toBeNull();
  });
});
