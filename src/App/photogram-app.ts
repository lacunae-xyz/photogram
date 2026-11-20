import { Routes } from '@lit-labs/router';
import { LitElement, css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-header.js';
import '@lacunae-xyz/photogram-design-system/pg-theme-switch.js';
import '../Demo/photogram-demo';
import '../Landing/photogram-landing';
import '../NotFound/photogram-not-found';
import '../PrivacyPolicy/photogram-privacy';
import '../Project/photogram-project';
import '../Projects/photogram-projects';
import '../Tutorial/photogram-tutorial';

type Meta = { title: string; description: string };

const links = [
  { href: '/projects', label: 'Projects' },
  { href: '/tutorial', label: 'Tutorial' },
  { href: '/project-demo', label: 'Demo' },
];

/** Inline, so that its fill follows the text colour: light, dark, print and forced colours. */
const logo = html`<svg
  slot="logo"
  viewBox="0 0 406.819 406.819"
  fill="currentColor"
  role="img"
  aria-label="logo of Photogram"
>
  <path
    d="M36.01,406.819h334.816c14.258,0,25.922-11.656,25.922-25.906V25.906 C396.748,11.689,385.075,0,370.826,0H36.01C21.72,0,10.071,11.689,10.071,25.906v355.007 C10.071,395.163,21.72,406.819,36.01,406.819z M333.515,31.693c0-4.3,3.52-7.771,7.779-7.771h24.304 c4.292,0,7.763,3.471,7.763,7.771v25.028c0,4.3-3.471,7.771-7.763,7.771h-24.304c-4.259,0-7.779-3.463-7.779-7.771V31.693z M333.515,95.364c0-4.3,3.52-7.779,7.779-7.779h24.304c4.292,0,7.763,3.479,7.763,7.779v25.028c0,4.292-3.471,7.795-7.763,7.795 h-24.304c-4.259,0-7.779-3.503-7.779-7.795V95.364z M333.515,159.084c0-4.292,3.52-7.795,7.779-7.795h24.304 c4.292,0,7.763,3.503,7.763,7.795v25.036c0,4.259-3.471,7.763-7.763,7.763h-24.304c-4.259,0-7.779-3.503-7.779-7.763V159.084z M333.515,222.755c0-4.3,3.52-7.795,7.779-7.795h24.304c4.292,0,7.763,3.495,7.763,7.795v25.036c0,4.292-3.471,7.771-7.763,7.771 h-24.304c-4.259,0-7.779-3.479-7.779-7.771V222.755z M333.515,286.427c0-4.3,3.52-7.771,7.779-7.771h24.304 c4.292,0,7.763,3.463,7.763,7.771v25.052c0,4.276-3.471,7.755-7.763,7.755h-24.304c-4.259,0-7.779-3.479-7.779-7.755V286.427z M333.515,350.098c0-4.276,3.52-7.771,7.779-7.771h24.304c4.292,0,7.763,3.495,7.763,7.771v25.077c0,4.243-3.471,7.755-7.763,7.755 h-24.304c-4.259,0-7.779-3.503-7.779-7.755V350.098z M99.981,50.478c0-4.3,3.503-7.771,7.795-7.771h191.298 c4.268,0,7.763,3.471,7.763,7.771v123.945c0,4.259-3.495,7.795-7.763,7.795H107.777c-4.292,0-7.795-3.536-7.795-7.795 C99.981,174.423,99.981,50.478,99.981,50.478z M99.981,241.598c0-4.268,3.503-7.747,7.795-7.747h191.298 c4.268,0,7.763,3.479,7.763,7.747V356.17c0,4.276-3.495,7.771-7.763,7.771H107.777c-4.292,0-7.795-3.495-7.795-7.771 C99.981,356.17,99.981,241.598,99.981,241.598z M33.457,31.693c0-4.3,3.495-7.771,7.779-7.771h24.313 c4.268,0,7.755,3.471,7.755,7.771v25.028c0,4.3-3.487,7.771-7.755,7.771H41.236c-4.284,0-7.779-3.463-7.779-7.771 C33.457,56.721,33.457,31.693,33.457,31.693z M33.457,95.364c0-4.3,3.495-7.779,7.779-7.779h24.313 c4.268,0,7.755,3.479,7.755,7.779v25.028c0,4.292-3.487,7.795-7.755,7.795H41.236c-4.284,0-7.779-3.503-7.779-7.795 C33.457,120.392,33.457,95.364,33.457,95.364z M33.457,159.084c0-4.292,3.495-7.795,7.779-7.795h24.313 c4.268,0,7.755,3.503,7.755,7.795v25.036c0,4.259-3.487,7.763-7.755,7.763H41.236c-4.284,0-7.779-3.503-7.779-7.763 C33.457,184.12,33.457,159.084,33.457,159.084z M33.457,222.755c0-4.3,3.495-7.795,7.779-7.795h24.313 c4.268,0,7.755,3.495,7.755,7.795v25.036c0,4.292-3.487,7.771-7.755,7.771H41.236c-4.284,0-7.779-3.479-7.779-7.771 C33.457,247.791,33.457,222.755,33.457,222.755z M33.457,286.427c0-4.3,3.495-7.771,7.779-7.771h24.313 c4.268,0,7.755,3.463,7.755,7.771v25.052c0,4.276-3.487,7.755-7.755,7.755H41.236c-4.284,0-7.779-3.479-7.779-7.755 C33.457,311.479,33.457,286.427,33.457,286.427z M33.457,350.098c0-4.276,3.495-7.771,7.779-7.771h24.313 c4.268,0,7.755,3.495,7.755,7.771v25.077c0,4.243-3.487,7.755-7.755,7.755H41.236c-4.284,0-7.779-3.503-7.779-7.755 C33.457,375.174,33.457,350.098,33.457,350.098z"
  />
</svg>`;

function header(current?: string) {
  return html`<pg-header
    slot="header"
    heading="Photogram"
    tagline="A tool for editor assistants"
    .links=${links}
    current=${current ?? nothing}
    >${logo}<pg-theme-switch></pg-theme-switch
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
 * Links and pages' `navigate` events change the address without a reload.
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

  #enter(meta = this.#defaultMeta, { noindex = false } = {}) {
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.description);
    if (noindex) {
      document.head.append(this.#noindex);
    } else {
      this.#noindex.remove();
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
