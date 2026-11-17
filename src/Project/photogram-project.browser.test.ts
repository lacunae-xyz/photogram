import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import Application from '../Application';
import IndexedDBProjectsDataSource from '../Application/IndexedDBProjectsDataSource';
import type { Project } from '../Application/types';
import './photogram-project';

afterEach(() => {
  render(null, document.body);
  vi.restoreAllMocks();
});

const stored: Project = {
  key: 'p1',
  name: 'Le fardeau',
  data: [
    { id: '1', sequence: '1', action: 'Ouverture', label: 'salon' },
    { id: '2', sequence: '2', action: 'Deuxième' },
  ],
  colors: { salon: '#F44336' },
  template: 'small',
};

function application() {
  return Application.createNull({
    dataSource: IndexedDBProjectsDataSource.createNull({
      projects: [stored],
    }),
  });
}

function renderProject(app = application()) {
  render(
    html`<photogram-project
      project-id="p1"
      .application=${app}
    ></photogram-project>`,
    document.body,
  );
  const element = document.body.querySelector('photogram-project')!;
  const inShadow = <K extends keyof HTMLElementTagNameMap>(name: K) =>
    element.shadowRoot!.querySelector(name)!;
  return { element, app, inShadow };
}

const tiles = (element: HTMLElement) =>
  element
    .shadowRoot!.querySelector('photogram-tiles')!
    .shadowRoot!.querySelectorAll('photogram-tile-small, photogram-tile-large');

describe('photogram-project', () => {
  it('shows the project name and its shots as tiles', async () => {
    const { element, inShadow } = renderProject();
    await expect
      .element(page.getByRole('heading', { name: 'Le fardeau' }))
      .toBeVisible();
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
    expect(inShadow('photogram-tiles').template).toBe('small');
    expect(inShadow('photogram-tiles').colorDistribution).toBe('indicator');
    expect(inShadow('photogram-configuration').colors).toEqual(stored.colors);
  });

  it('shows the last project-id set, whichever load ends first', async () => {
    const app = Application.createNull({
      dataSource: IndexedDBProjectsDataSource.createNull({
        projects: [stored, { ...stored, key: 'p2', name: 'Le second' }],
      }),
    });
    const get = app.get.bind(app);
    let releaseFirst = () => {};
    const firstHeld = new Promise<void>(resolve => (releaseFirst = resolve));
    vi.spyOn(app, 'get').mockImplementation(async key => {
      const project = await get(key);
      if (key === 'p1') await firstHeld;
      return project;
    });
    const { element } = renderProject(app);
    await vi.waitFor(() => expect(app.get).toHaveBeenCalledWith('p1'));
    element.projectId = 'p2';
    await expect
      .element(page.getByRole('heading', { name: 'Le second' }))
      .toBeVisible();
    releaseFirst();
    await new Promise(resolve => setTimeout(resolve, 50));
    await expect
      .element(page.getByRole('heading', { name: 'Le second' }))
      .toBeVisible();
  });

  it('offers export for an imported project', async () => {
    renderProject();
    await expect
      .element(page.getByRole('button', { name: 'Export data.json' }))
      .toBeVisible();
  });

  it('saves a template change and shows it', async () => {
    const { element, app, inShadow } = renderProject();
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
    inShadow('photogram-configuration').dispatchEvent(
      new CustomEvent('template-change', { detail: { template: 'large' } }),
    );
    await vi.waitFor(() =>
      expect(inShadow('photogram-tiles').template).toBe('large'),
    );
    expect((await app.get('p1')).template).toBe('large');
  });

  it('shows a print setting before the save', async () => {
    const { element, inShadow } = renderProject();
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
    inShadow('photogram-configuration').dispatchEvent(
      new CustomEvent('print-space-around-change', {
        detail: { printSpaceAround: true },
      }),
    );
    await element.updateComplete;
    expect(inShadow('photogram-tiles').printSpaceAround).toBe(true);
  });

  it('edits a shot in the tile form', async () => {
    const { element, app, inShadow } = renderProject();
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
    inShadow('photogram-tiles').dispatchEvent(
      new CustomEvent('tile-select', { detail: { shot: stored.data[1] } }),
    );
    await element.updateComplete;
    const form = inShadow('photogram-tile-form');
    expect(form.shot).toEqual(stored.data[1]);
    form.dispatchEvent(
      new CustomEvent('save', {
        detail: { shot: { ...stored.data[1], action: 'Modifié' } },
      }),
    );
    await element.updateComplete;
    expect(form.shot).toBeUndefined();
    await vi.waitFor(async () =>
      expect((await app.get('p1')).data[1].action).toBe('Modifié'),
    );
  });

  it('closes the tile form', async () => {
    const { element, inShadow } = renderProject();
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
    inShadow('photogram-tiles').dispatchEvent(
      new CustomEvent('tile-select', { detail: { shot: stored.data[0] } }),
    );
    await element.updateComplete;
    inShadow('photogram-tile-form').dispatchEvent(new CustomEvent('close'));
    await element.updateComplete;
    expect(inShadow('photogram-tile-form').shot).toBeUndefined();
  });

  it('sends back from the toolbar', async () => {
    const { element } = renderProject();
    const back = vi.fn();
    element.addEventListener('back', back);
    await page.getByRole('button', { name: 'Close' }).click();
    expect(back).toHaveBeenCalledOnce();
  });

  it('asks for permission again, then shows the tiles', async () => {
    const app = application();
    const needsPermission = vi
      .spyOn(app, 'needsPermission')
      .mockResolvedValue(true);
    const requestPermission = vi
      .spyOn(app, 'requestPermission')
      .mockImplementation(async () => {
        needsPermission.mockResolvedValue(false);
      });
    const { element } = renderProject(app);
    const grant = page.getByRole('button', { name: 'Grant permission' });
    await expect.element(grant).toBeVisible();
    await expect
      .element(page.getByText(/Permission needs to be given again/))
      .toBeVisible();
    expect(element.shadowRoot!.querySelector('photogram-tiles')).toBeNull();
    const illustration = element
      .shadowRoot!.querySelector('pg-empty-state')!
      .shadowRoot!.querySelector('pg-illustration')!;
    expect(illustration.name).toBe('private-files');

    await grant.click();
    expect(requestPermission).toHaveBeenCalledWith('p1');
    await vi.waitFor(() => expect(tiles(element)).toHaveLength(2));
  });
});
