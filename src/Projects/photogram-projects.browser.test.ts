import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import Application from '../Application';
import IndexedDBProjectsDataSource from '../Application/IndexedDBProjectsDataSource';
import type { Project } from '../Application/types';
import './photogram-projects';

afterEach(() => render(null, document.body));

const project = (key: string, name: string): Project => ({
  key,
  name,
  data: [{ id: '1', sequence: '1' }],
  colors: {},
  template: 'small',
});

function renderProjects(projects: Project[] = []) {
  const application = Application.createNull({
    dataSource: IndexedDBProjectsDataSource.createNull({ projects }),
  });
  render(
    html`<photogram-projects .application=${application}
      ><header slot="header">Site header</header></photogram-projects
    >`,
    document.body,
  );
  return document.body.querySelector('photogram-projects')!;
}

const cards = () => page.getByRole('listitem');

describe('photogram-projects', () => {
  it('shows the header and the actions', async () => {
    renderProjects();
    await expect.element(page.getByText('Site header')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Import project' }))
      .toBeVisible();
  });

  it('shows the empty state without projects', async () => {
    renderProjects();
    await expect
      .element(page.getByRole('img', { name: 'No project' }))
      .toBeVisible();
    expect(cards().elements()).toHaveLength(0);
  });

  it('lists the stored projects', async () => {
    renderProjects([project('a', 'Le fardeau'), project('b', 'Court')]);
    await expect.element(cards().nth(1)).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Le fardeau' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Court' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'No project' }))
      .not.toBeInTheDocument();
  });

  it('adds an imported project', async () => {
    const projects = renderProjects();
    await expect
      .element(page.getByRole('img', { name: 'No project' }))
      .toBeVisible();
    const csv = new File(['1;action;label;;'], 'data.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(csv, 'webkitRelativePath', {
      value: 'Import/data.csv',
    });
    projects
      .shadowRoot!.querySelector('photogram-import-project')!
      .dispatchEvent(new CustomEvent('import', { detail: { files: [csv] } }));
    await expect
      .element(page.getByRole('link', { name: 'Import' }))
      .toBeVisible();
  });

  it('deletes a project', async () => {
    renderProjects([project('a', 'Le fardeau'), project('b', 'Court')]);
    await page.getByRole('button', { name: 'Delete Le fardeau' }).click();
    await expect
      .element(page.getByRole('link', { name: 'Le fardeau' }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole('link', { name: 'Court' }))
      .toBeVisible();
  });

  it('asks to navigate to an opened project', async () => {
    const projects = renderProjects([project('a', 'Le fardeau')]);
    const navigate = vi.fn();
    projects.addEventListener('navigate', event =>
      navigate((event as CustomEvent).detail.path),
    );
    await page.getByRole('link', { name: 'Le fardeau' }).click();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/project/a'));
  });

  it('shows the storage quota', async () => {
    const projects = renderProjects();
    await projects.updateComplete;
    const quota = projects.shadowRoot!.querySelector('photogram-quota')!;
    const { quota: max } = await navigator.storage.estimate();
    await vi.waitFor(() => expect(quota.max).toBe(max));
  });
});
