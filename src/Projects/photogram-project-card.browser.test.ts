import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Project } from '../Application/types';
import './photogram-project-card';

const project: Project = {
  key: 'p1',
  name: 'Le fardeau',
  data: [
    { id: '1', sequence: '1', url: '/demo/1.jpg' },
    { id: '2', sequence: '2', url: '/demo/2.jpg' },
  ],
  colors: {},
  template: 'small',
};

afterEach(() => render(null, document.body));

async function renderCard(value: Project) {
  render(
    html`<ul>
      <photogram-project-card .project=${value}></photogram-project-card>
    </ul>`,
    document.body,
  );
  const card = document.body.querySelector('photogram-project-card')!;
  await card.updateComplete;
  await card.shadowRoot!.querySelector('pg-card')!.updateComplete;
  return card;
}

function inCard<T extends Element>(
  card: HTMLElement,
  selector: string,
): T | null {
  return card.shadowRoot!.querySelector<T>(selector);
}

describe('photogram-project-card', () => {
  it('is a list item named after the project', async () => {
    await renderCard(project);
    await expect.element(page.getByRole('listitem')).toBeInTheDocument();
    await expect
      .element(page.getByRole('link', { name: 'Le fardeau' }))
      .toHaveAttribute('href', '/project/p1');
  });

  it('covers with the first shot image', async () => {
    const card = await renderCard(project);
    expect(inCard(card, '.img-project-cover')?.getAttribute('src')).toBe(
      '/demo/1.jpg',
    );
  });

  it('covers with the main picture when set', async () => {
    const card = await renderCard({ ...project, mainPicture: '/demo/2.jpg' });
    expect(inCard(card, '.img-project-cover')?.getAttribute('src')).toBe(
      '/demo/2.jpg',
    );
  });

  it('has no cover src without shots', async () => {
    const card = await renderCard({ ...project, data: [] });
    expect(inCard(card, '.img-project-cover')?.hasAttribute('src')).toBe(false);
  });

  it('tells linked from imported projects', async () => {
    const card = await renderCard(project);
    const icon = inCard<HTMLElement>(card, '.img-project-link')!;
    expect(icon.getAttribute('name')).toBe('link-off');
    expect(icon.title).toBe('Imported project inside the browser (unlinked)');
    card.project = {
      ...project,
      dirLink: {} as FileSystemDirectoryHandle,
    };
    await card.updateComplete;
    expect(icon.getAttribute('name')).toBe('link');
    expect(icon.title).toBe('Linked project with file system');
  });

  it('opens on a click anywhere but delete', async () => {
    const card = await renderCard(project);
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    card.addEventListener('open', onOpen);
    card.addEventListener('delete', onDelete);
    await userEvent.click(page.getByRole('img', { name: 'project cover' }));
    await userEvent.click(page.getByRole('link', { name: 'Le fardeau' }));
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen.mock.calls[0][0].detail).toEqual({ key: 'p1' });
    expect(onDelete).not.toHaveBeenCalled();
    expect(location.pathname).not.toBe('/project/p1');
  });

  it('deletes without opening', async () => {
    const card = await renderCard(project);
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    card.addEventListener('open', onOpen);
    card.addEventListener('delete', onDelete);
    await userEvent.hover(page.getByRole('link', { name: 'Le fardeau' }));
    await userEvent.click(
      page.getByRole('button', { name: 'Delete Le fardeau' }),
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete.mock.calls[0][0].detail).toEqual({ key: 'p1' });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens and deletes from the keyboard', async () => {
    const card = await renderCard(project);
    const events: string[] = [];
    card.addEventListener('open', () => events.push('open'));
    card.addEventListener('delete', () => events.push('delete'));
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(events).toEqual(['open', 'delete']);
  });

  it('renders nothing without a project', async () => {
    render(
      html`<photogram-project-card></photogram-project-card>`,
      document.body,
    );
    const card = document.body.querySelector('photogram-project-card')!;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector('pg-card')).toBeNull();
  });
});
