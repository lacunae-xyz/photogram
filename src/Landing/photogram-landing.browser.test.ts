import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import Application from '../Application';
import IndexedDBProjectsDataSource from '../Application/IndexedDBProjectsDataSource';
import type { Project } from '../Application/types';
import type { PgIllustration } from '@lacunae-xyz/photogram-design-system/pg-illustration.js';
import './photogram-landing';
import '@lacunae-xyz/photogram-design-system/tokens.css';

afterEach(() => {
  render(null, document.body);
  vi.restoreAllMocks();
});

/** The computed colour of a token, as the browser resolves it. */
function token(name: string) {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const project = (key: string, name: string): Project => ({
  key,
  name,
  data: [{ id: '1', sequence: '1' }],
  colors: {},
  template: 'small',
});

async function renderLanding(projects: Project[] = []) {
  const application = Application.createNull({
    dataSource: IndexedDBProjectsDataSource.createNull({ projects }),
  });
  render(
    html`<photogram-landing .application=${application}
      ><header slot="header">Site header</header></photogram-landing
    >`,
    document.body,
  );
  const landing = document.body.querySelector('photogram-landing')!;
  await landing.updateComplete;
  return landing;
}

function csvFile(folder: string) {
  const csv = new File(['1;action;label;;'], 'data.csv', { type: 'text/csv' });
  Object.defineProperty(csv, 'webkitRelativePath', {
    value: `${folder}/data.csv`,
  });
  return csv;
}

describe('photogram-landing', () => {
  it('shows how to start under the header, with no project list', async () => {
    await renderLanding();
    await expect.element(page.getByText('Site header')).toBeVisible();
    await expect
      .element(page.getByRole('heading', { name: 'How to start' }))
      .toBeVisible();
    for (const name of ['Learn', 'Create', 'Open', 'Try']) {
      await expect.element(page.getByRole('heading', { name })).toBeVisible();
    }
    await expect
      .element(page.getByRole('heading', { name: 'Projects' }))
      .not.toBeInTheDocument();
  });

  it('links the cells and the footer', async () => {
    await renderLanding();
    await expect
      .element(page.getByRole('link', { name: /Learn/ }))
      .toHaveAttribute('href', '/tutorial');
    await expect
      .element(page.getByRole('link', { name: /Try/ }))
      .toHaveAttribute('href', '/project-demo');
    await expect
      .element(page.getByRole('link', { name: 'Privacy policy' }))
      .toHaveAttribute('href', '/privacy-policy');
  });

  it('draws the footer link in the accent text colour', async () => {
    await renderLanding();
    const privacy = page.getByRole('link', { name: 'Privacy policy' });
    await expect.element(privacy).toBeVisible();
    expect(getComputedStyle(privacy.element()).color).toBe(
      token('--pg-color-accent-text'),
    );
  });

  it('draws an illustration in every cell', async () => {
    const landing = await renderLanding();
    const names = [
      ...landing.shadowRoot!.querySelectorAll<PgIllustration>(
        '.empty-project-item pg-illustration',
      ),
    ].map(illustration => illustration.name);
    expect(names).toEqual([
      'learning',
      'upload-image',
      'folder',
      'presentation',
    ]);
  });

  it('draws the artwork behind the creators as decoration', async () => {
    const landing = await renderLanding();
    const art = landing.shadowRoot!.querySelectorAll<PgIllustration>(
      '.creator-layout pg-illustration',
    );
    expect([...art].map(illustration => illustration.name)).toEqual([
      'web-developer',
      'videographer',
    ]);
    for (const illustration of art) {
      expect(illustration.label).toBe('');
    }
  });

  it('lists the stored projects', async () => {
    await renderLanding([project('a', 'Le fardeau')]);
    await expect
      .element(page.getByRole('heading', { name: 'Projects' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Le fardeau' }))
      .toBeVisible();
  });

  it('imports the folder picked in Create', async () => {
    const landing = await renderLanding();
    const input =
      landing.shadowRoot!.querySelector<HTMLInputElement>('#new-project-file')!;
    const transfer = new DataTransfer();
    transfer.items.add(csvFile('Création'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await expect
      .element(page.getByRole('link', { name: 'Création' }))
      .toBeVisible();
    expect(input.files.length).toBe(0);
  });

  it('opens the folder picked in Open', async () => {
    const application = Application.createNull();
    const open = vi.spyOn(application, 'open').mockResolvedValue([]);
    const dirHandle = { name: 'Projet' } as FileSystemDirectoryHandle;
    vi.spyOn(
      window as unknown as { showDirectoryPicker: () => unknown },
      'showDirectoryPicker',
    ).mockResolvedValue(dirHandle);
    render(
      html`<photogram-landing .application=${application}></photogram-landing>`,
      document.body,
    );
    await page.getByRole('button', { name: /Open/ }).click();
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith(dirHandle));
  });

  it('asks to navigate to an opened project', async () => {
    const landing = await renderLanding([project('a', 'Le fardeau')]);
    const navigate = vi.fn();
    landing.addEventListener('navigate', event =>
      navigate((event as CustomEvent).detail.path),
    );
    await page.getByRole('link', { name: 'Le fardeau' }).click();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/project/a'));
  });

  it('links the creators', async () => {
    await renderLanding();
    await expect
      .element(page.getByRole('link', { name: /Nicolas Mouchel/ }))
      .toHaveAttribute('href', 'https://sagix.fr/nicolasmouchel/');
    await expect
      .element(page.getByRole('link', { name: /Thomas Heurtier/ }))
      .toHaveAttribute('target', '_blank');
  });

  it("hides the creators' artwork when the page is narrower than 50rem", async () => {
    const creators = async (width: number) => {
      await page.viewport(width, 900);
      const landing = await renderLanding();
      const art = landing.shadowRoot!.querySelector('.creator-art')!;
      return getComputedStyle(art).display;
    };
    try {
      expect(await creators(1280)).not.toBe('none');
      expect(await creators(700)).toBe('none');
      expect(await creators(390)).toBe('none');
    } finally {
      await page.viewport(414, 896);
    }
  });
});
