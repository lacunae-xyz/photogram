import { Routes } from '@lit-labs/router';
import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-header.js';
import '@lacunae-xyz/photogram-design-system/pg-theme-switch.js';
import '../Demo/photogram-demo';
import '../Fixor/photogram-fixor';
import '../Landing/photogram-landing';
import '../NotFound/photogram-not-found';
import '../PrivacyPolicy/photogram-privacy';
import '../Project/photogram-project';
import '../Projects/photogram-projects';
import '../Tutorial/photogram-tutorial';
import logo from './logo.svg';

type Meta = { title: string; description: string };

const links = [
  { href: '/projects', label: 'Projects' },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/project-demo', label: 'Demo' },
];

function header(current?: string) {
  return html`<pg-header
    slot="header"
    heading="Photogram"
    tagline="A tool for editor assistants"
    logo=${logo}
    logo-label="logo of Photogram"
    .links=${links}
    current=${current ?? nothing}
    ><pg-theme-switch></pg-theme-switch
  ></pg-header>`;
}

/** As react-router 5 matched: case-insensitive, with or without a trailing slash. */
function pattern(pathname: string) {
  return new URLPattern(
    { pathname: pathname === '/' ? '/' : `${pathname}{/}?` },
    { ignoreCase: true },
  );
}

/** A path segment as react-router 5 passed it: decoded, or as is if it isn't valid. */
function decoded(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function documentMeta(): Meta {
  return {
    title: document.title,
    description:
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? '',
  };
}

/**
 * Photogram: routes the address to its page, with its title and description.
 * Links and pages' `navigate` events change the address without a reload. Fixor renders in the light DOM.
 */
@customElement('photogram-app')
export class PhotogramApp extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .announcer {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      border: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `;

  /** index.html's, for the pages that have none of their own. */
  readonly #defaultMeta = documentMeta();

  #fixor: HTMLElement | undefined;

  /** On the not found page only: the server answers its address with a 200. */
  readonly #noindex = Object.assign(document.createElement('meta'), {
    name: 'robots',
    content: 'noindex',
  });

  readonly #routes = new Routes(
    this,
    [
      {
        pattern: pattern('/'),
        enter: () =>
          this.#enter({
            title: 'Photogram · A tool for editor assistants',
            description:
              'Create a board of photograms ready to print and cut, from a CSV file and your stills. Your projects stay on your device.',
          }),
        render: () =>
          html`<photogram-landing @navigate=${this.#onNavigate}
            >${header()}</photogram-landing
          >`,
      },
      {
        pattern: pattern('/tutorial'),
        enter: () =>
          this.#enter({
            title: 'Photogram · Comment utiliser Photogram',
            description:
              'Préparer le tableau et les photogrammes de votre projet, puis les ajouter à Photogram',
          }),
        render: () =>
          html`<photogram-tutorial>${header('/tutorial')}</photogram-tutorial>`,
      },
      {
        pattern: pattern('/projects'),
        enter: () =>
          this.#enter({
            title: 'Photogram · Projects',
            description:
              'Import or open a project folder, and find the projects stored in this browser.',
          }),
        render: () =>
          html`<photogram-projects @navigate=${this.#onNavigate}
            >${header('/projects')}</photogram-projects
          >`,
      },
      {
        pattern: pattern('/project/:id'),
        enter: () => this.#enter(),
        render: ({ id }) =>
          html`<photogram-project
            project-id=${id === undefined ? nothing : decoded(id)}
            @back=${this.#onBack}
          ></photogram-project>`,
      },
      {
        pattern: pattern('/project-demo'),
        enter: () =>
          this.#enter({
            title: 'Photogram - Try the tool for assistant editors',
            description: 'Learn and play with our demo data set',
          }),
        render: () =>
          html`<photogram-demo @back=${this.#onBack}></photogram-demo>`,
      },
      {
        pattern: pattern('/privacy-policy'),
        enter: () =>
          this.#enter({
            title: 'Photogram · Privacy policy',
            description:
              'Photogram keeps your projects on your device. What it counts, and who hosts it.',
          }),
        render: () => html`<photogram-privacy>${header()}</photogram-privacy>`,
      },
      {
        pattern: pattern('/fixor'),
        enter: () => this.#enter(undefined, { fixor: true }),
        // Fixor's CSS is global: it renders in the light DOM.
        render: () => html`<slot></slot>`,
      },
    ],
    {
      fallback: {
        enter: () =>
          this.#enter(
            { ...this.#defaultMeta, title: 'Photogram · Page not found' },
            { noindex: true },
          ),
        render: () =>
          html`<photogram-not-found>${header()}</photogram-not-found>`,
      },
    },
  );

  constructor() {
    super();
    this.addEventListener('click', this.#onClick);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.#onPopState);
    this.#routes.goto(location.pathname);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.#onPopState);
  }

  render() {
    return html`${this.#routes.outlet()}
      <div class="announcer" role="status"></div>`;
  }

  /** Adds `path` to the history and shows its page. */
  async navigate(path: string) {
    const url = new URL(path, location.href);
    if (url.href !== location.href) {
      history.pushState(null, '', url);
    }
    await this.#routes.goto(url.pathname);
    await this.updateComplete;
    // The new page starts at its top, as after a load. Back and forward restore their own position.
    window.scrollTo(0, 0);
    this.#announce();
  }

  /**
   * Screen readers read the new page's title, as they did after a load. The focus stays where it is: Tab
   * already starts from the top of the new page, and focusing the app upset Firefox's scroll restoration on back.
   */
  #announce() {
    this.renderRoot.querySelector('.announcer')!.textContent = document.title;
  }

  #enter(meta = this.#defaultMeta, { fixor = false, noindex = false } = {}) {
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.description);
    if (noindex) {
      document.head.append(this.#noindex);
    } else {
      this.#noindex.remove();
    }
    if (fixor) {
      this.#fixor ??= this.appendChild(
        document.createElement('photogram-fixor'),
      );
    } else {
      this.#fixor?.remove();
      this.#fixor = undefined;
    }
    return true;
  }

  readonly #onPopState = async () => {
    await this.#routes.goto(location.pathname);
    await this.updateComplete;
    this.#announce();
  };

  #onNavigate(event: CustomEvent<{ path: string }>) {
    this.navigate(event.detail.path);
  }

  #onBack() {
    history.back();
  }

  readonly #onClick = (event: MouseEvent) => {
    // Modified and middle clicks open a tab, a window or a download, as on any link.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const path = event.composedPath();
    // Fixor's links load the page, as they did before the island.
    if (this.#fixor && path.includes(this.#fixor)) {
      return;
    }
    const anchor = path.find(
      (target): target is HTMLAnchorElement =>
        target instanceof HTMLAnchorElement,
    );
    if (
      !anchor?.href ||
      (anchor.target !== '' && anchor.target !== '_self') ||
      anchor.hasAttribute('download') ||
      anchor.origin !== location.origin
    ) {
      return;
    }
    // A link to an anchor on this page scrolls to it.
    if (
      anchor.hash &&
      anchor.pathname === location.pathname &&
      anchor.search === location.search
    ) {
      return;
    }
    event.preventDefault();
    this.navigate(anchor.href);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-app': PhotogramApp;
  }
}
