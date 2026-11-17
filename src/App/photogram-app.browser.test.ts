import { html, render } from 'lit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-app';

const testerUrl = location.href;

const defaultMeta = {
  title: 'Photogram · A tool for editor assistants',
  description: 'Create a board of photograms ready to print and cut.',
};

let description: HTMLMetaElement;

beforeEach(() => {
  document.title = defaultMeta.title;
  description = document.createElement('meta');
  description.name = 'description';
  description.content = defaultMeta.description;
  document.head.append(description);
});

afterEach(() => {
  render(null, document.body);
  description.remove();
  document.head.querySelector('meta[name="robots"]')?.remove();
  history.replaceState(null, '', testerUrl);
  vi.restoreAllMocks();
});

async function renderApp(path: string) {
  history.replaceState(null, '', path);
  render(html`<photogram-app></photogram-app>`, document.body);
  const app = document.body.querySelector('photogram-app')!;
  await vi.waitFor(() => {
    if (!app.shadowRoot?.firstElementChild) throw new Error('no page yet');
  });
  return app;
}

function shownPage(app: HTMLElement) {
  return app.shadowRoot!.querySelector('*:not(style)')?.localName;
}

function announced(app: HTMLElement) {
  return app.shadowRoot!.querySelector('[role="status"]')!.textContent;
}

function meta() {
  return { title: document.title, description: description.content };
}

/** Records whether the app took the click, and keeps it from leaving the test page. */
function clickOutcome() {
  const outcome = { prevented: undefined as boolean | undefined };
  window.addEventListener(
    'click',
    event => {
      outcome.prevented = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true },
  );
  return outcome;
}

function headerLink(app: HTMLElement, name: string) {
  const header = app.shadowRoot!.querySelector('pg-header')!;
  return [...header.shadowRoot!.querySelectorAll('a')].find(
    link => link.textContent?.trim() === name,
  )!;
}

describe('photogram-app', () => {
  const routes = [
    {
      path: '/',
      page: 'photogram-landing',
      title: 'Photogram · A tool for editor assistants',
      current: null,
    },
    {
      path: '/tutorial',
      page: 'photogram-tutorial',
      title: 'Photogram · Comment utiliser Photogram',
      current: 'Tutorial',
    },
    {
      path: '/projects',
      page: 'photogram-projects',
      title: 'Photogram · Projects',
      current: 'Projects',
    },
    {
      path: '/project-demo',
      page: 'photogram-demo',
      title: 'Photogram - Try the tool for assistant editors',
      current: undefined,
    },
    {
      path: '/privacy-policy',
      page: 'photogram-privacy',
      title: 'Photogram · Privacy policy',
      current: null,
    },
  ];

  for (const route of routes) {
    it(`shows ${route.page} on ${route.path}, with its title and description`, async () => {
      const app = await renderApp(route.path);
      expect(shownPage(app)).toBe(route.page);
      expect(document.title).toBe(route.title);
      expect(description.content).not.toBe(defaultMeta.description);
      const header = app.shadowRoot!.querySelector('pg-header');
      if (route.current === undefined) {
        expect(header).toBeNull();
        return;
      }
      expect(header?.slot).toBe('header');
      await header!.updateComplete;
      const current = header!.shadowRoot!.querySelector(
        '[aria-current="page"]',
      );
      expect(current?.textContent ?? null).toBe(route.current);
    });
  }

  it('shows a project with the default title and description', async () => {
    const app = await renderApp('/project/42');
    expect(shownPage(app)).toBe('photogram-project');
    expect(app.shadowRoot!.querySelector('photogram-project')!.projectId).toBe(
      '42',
    );
    expect(meta()).toEqual(defaultMeta);
  });

  it('decodes the project id of the address', async () => {
    const app = await renderApp('/project/a%20b');
    const project = () => app.shadowRoot!.querySelector('photogram-project')!;
    expect(project().projectId).toBe('a b');
    await app.navigate('/project/100%');
    expect(project().projectId).toBe('100%');
  });

  it('shows not found on an unknown address (B16)', async () => {
    const app = await renderApp('/does-not-exist');
    expect(shownPage(app)).toBe('photogram-not-found');
    await expect
      .element(page.getByRole('heading', { name: 'Page not found' }))
      .toBeVisible();
    expect(meta()).toEqual({
      ...defaultMeta,
      title: 'Photogram · Page not found',
    });
  });

  it('keeps search engines off the not found page only', async () => {
    const robots = () =>
      document.head.querySelectorAll('meta[name="robots"][content="noindex"]')
        .length;
    const app = await renderApp('/does-not-exist');
    expect(robots()).toBe(1);
    await app.navigate('/also-missing');
    expect(robots()).toBe(1);
    await app.navigate('/tutorial');
    expect(robots()).toBe(0);
  });

  it('matches like react-router did: any case, with or without a trailing slash', async () => {
    const app = await renderApp('/Tutorial/');
    expect(shownPage(app)).toBe('photogram-tutorial');
    history.replaceState(null, '', '/project/42/');
    await app.navigate('/project/42/');
    expect(shownPage(app)).toBe('photogram-project');
    await app.navigate('/tutorial/more');
    expect(shownPage(app)).toBe('photogram-not-found');
  });

  it('mounts Fixor in its light DOM on /fixor, and removes it on leaving', async () => {
    const app = await renderApp('/fixor');
    const fixor = app.querySelector('photogram-fixor')!;
    expect(fixor).not.toBeNull();
    expect(app.shadowRoot!.querySelector('slot')!.assignedElements()).toEqual([
      fixor,
    ]);
    await expect
      .element(page.getByRole('heading', { name: 'Fixor' }))
      .toBeVisible();
    expect(meta()).toEqual(defaultMeta);

    await app.navigate('/fixor');
    expect(app.querySelectorAll('photogram-fixor')).toHaveLength(1);

    await app.navigate('/tutorial');
    expect(app.querySelector('photogram-fixor')).toBeNull();
    expect(fixor.childElementCount).toBe(0);
  });

  it('follows an in-app link without loading the page', async () => {
    const app = await renderApp('/projects');
    const length = history.length;
    const outcome = clickOutcome();
    headerLink(app, 'Tutorial').click();
    expect(outcome.prevented).toBe(true);
    expect(location.pathname).toBe('/tutorial');
    expect(history.length).toBe(length + 1);
    await vi.waitFor(() => expect(shownPage(app)).toBe('photogram-tutorial'));
    expect(document.title).toBe('Photogram · Comment utiliser Photogram');
  });

  it('shows the new page from its top', async () => {
    const app = await renderApp('/projects');
    const spacer = document.createElement('div');
    spacer.style.height = '10000px';
    document.body.append(spacer);
    window.scrollTo(0, 5000);
    expect(window.scrollY).toBeGreaterThan(0);
    clickOutcome();
    headerLink(app, 'Tutorial').click();
    await vi.waitFor(() => expect(shownPage(app)).toBe('photogram-tutorial'));
    await vi.waitFor(() => expect(window.scrollY).toBe(0));
    spacer.remove();
  });

  it('reads nothing on load', async () => {
    const app = await renderApp('/projects');
    expect(announced(app)).toBe('');
  });

  it('reads the new page’s title after a link', async () => {
    const app = await renderApp('/projects');
    clickOutcome();
    headerLink(app, 'Tutorial').click();
    await vi.waitFor(() =>
      expect(announced(app)).toBe('Photogram · Comment utiliser Photogram'),
    );
    expect(shownPage(app)).toBe('photogram-tutorial');
  });

  it('reads the title on back and forward', async () => {
    const app = await renderApp('/projects');
    await app.navigate('/tutorial');
    history.replaceState(null, '', '/projects');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.waitFor(() => expect(announced(app)).toBe('Photogram · Projects'));
  });

  it('follows links in pages too', async () => {
    const app = await renderApp('/');
    const landing = app.shadowRoot!.querySelector('photogram-landing')!;
    await landing.updateComplete;
    const outcome = clickOutcome();
    landing
      .shadowRoot!.querySelector<HTMLAnchorElement>(
        'a[href="/privacy-policy"]',
      )!
      .click();
    expect(outcome.prevented).toBe(true);
    await vi.waitFor(() => expect(shownPage(app)).toBe('photogram-privacy'));
  });

  for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
    it(`leaves a click with ${modifier} to the browser`, async () => {
      const app = await renderApp('/projects');
      const outcome = clickOutcome();
      headerLink(app, 'Tutorial').dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          composed: true,
          cancelable: true,
          [modifier]: true,
        }),
      );
      expect(outcome.prevented).toBe(false);
      expect(location.pathname).toBe('/projects');
    });
  }

  it('leaves a middle click to the browser', async () => {
    const app = await renderApp('/projects');
    const outcome = clickOutcome();
    headerLink(app, 'Tutorial').dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
        button: 1,
      }),
    );
    expect(outcome.prevented).toBe(false);
  });

  it('leaves links to other sites, new tabs and downloads to the browser', async () => {
    const app = await renderApp('/privacy-policy');
    const privacy = app.shadowRoot!.querySelector('photogram-privacy')!;
    const links: Partial<
      Pick<HTMLAnchorElement, 'href' | 'target' | 'download'>
    >[] = [
      { href: 'https://www.netlify.com/privacy/' },
      { href: '/tutorial', target: '_blank' },
      { href: '/demo/data.csv', download: '' },
      { href: '#top' },
    ];
    for (const attributes of links) {
      const link = Object.assign(document.createElement('a'), attributes);
      privacy.append(link);
      const outcome = clickOutcome();
      link.click();
      expect(outcome.prevented, link.outerHTML).toBe(false);
      link.remove();
    }
    expect(location.pathname).toBe('/privacy-policy');
  });

  it('leaves Fixor’s links to the browser, as before the island', async () => {
    const app = await renderApp('/fixor');
    await expect
      .element(page.getByRole('heading', { name: 'Fixor' }))
      .toBeVisible();
    const outcome = clickOutcome();
    app
      .querySelector<HTMLAnchorElement>('photogram-fixor a[href="/fixor"]')!
      .click();
    expect(outcome.prevented).toBe(false);
  });

  it('opens what a page sends with navigate', async () => {
    const app = await renderApp('/projects');
    const projects = app.shadowRoot!.querySelector('photogram-projects')!;
    projects.dispatchEvent(
      new CustomEvent('navigate', { detail: { path: '/project/7' } }),
    );
    expect(location.pathname).toBe('/project/7');
    await vi.waitFor(() => expect(shownPage(app)).toBe('photogram-project'));
  });

  it('goes back in history on a page’s back', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});
    const app = await renderApp('/project-demo');
    app
      .shadowRoot!.querySelector('photogram-demo')!
      .dispatchEvent(new Event('back'));
    expect(back).toHaveBeenCalledOnce();
  });

  it('shows the page of the address on popstate', async () => {
    const app = await renderApp('/projects');
    await app.navigate('/tutorial');
    history.replaceState(null, '', '/projects');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await vi.waitFor(() => expect(shownPage(app)).toBe('photogram-projects'));
    expect(document.title).toBe('Photogram · Projects');
  });
});
