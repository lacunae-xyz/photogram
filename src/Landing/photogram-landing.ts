import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import videographer from '@lacunae-xyz/photogram-design-system/illustrations/videographer.svg';
import webDeveloper from '@lacunae-xyz/photogram-design-system/illustrations/web-developer.svg';
import '@lacunae-xyz/photogram-design-system/pg-illustration.js';
import Application from '../Application';
import { canOpenFolder, pickFolder } from '../Projects/folder-picker';
import { ProjectsController } from '../Projects/projects-controller';
import '../Projects/photogram-import-project';
import '../Projects/photogram-project-card';
import '../Projects/photogram-quota';

const creators = [
  {
    className: 'creator-one',
    img: '/nicolas.jpeg',
    name: 'Nicolas Mouchel',
    job: 'Developer',
    link: 'https://sagix.fr/nicolasmouchel/',
  },
  {
    className: 'creator-two',
    img: '/thomas.jpeg',
    name: 'Thomas Heurtier',
    job: 'Editor',
    link: 'https://www.linkedin.com/in/thomas-heurtier-a1207061/',
  },
];

/**
 * The landing page: the projects stored in this browser, how to start, and the creators.
 *
 * Slot: `header`. Event: `navigate`, with `detail.path`, to open a project.
 */
@customElement('photogram-landing')
export class PhotogramLanding extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .landing-container {
      max-width: 50rem;
      margin: auto;
      padding: 0 4rem;
    }

    h2 {
      font-size: var(--pg-font-size-4);
    }

    .landing-footer {
      padding: var(--pg-space-6) 0;
    }

    .landing-footer a {
      color: var(--pg-color-accent-text);
    }

    .list-project-container {
      display: flex;
      overflow-x: scroll;
    }

    .list-project-header {
      display: flex;
      align-items: center;
    }

    .list-project-header h2 {
      flex-grow: 1;
    }

    #grid {
      display: flex;
      list-style-type: none;
      padding: var(--pg-space-1);
    }

    .empty-project-layout {
      padding-top: var(--pg-space-4);
      padding-bottom: var(--pg-space-4);
    }

    .empty-project-layout a {
      text-decoration: none;
    }

    #new-project-file {
      display: none;
    }

    .empty-project-open {
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      font: inherit;
      text-align: inherit;
    }

    .empty-project-item {
      display: flex;
      border-radius: var(--pg-radius-s);
      transition-property: transform background-color;
      transition-duration: 0.5s;
      color: var(--pg-color-text);
      text-decoration: none;
      padding-bottom: var(--pg-space-4);
    }

    .empty-project-item:hover {
      transform: scale(1.05);
      background-color: var(--pg-grey-200);
      cursor: pointer;
    }

    .empty-project-item:active {
      background-color: var(--pg-color-hover);
    }

    .empty-project-item pg-illustration::part(image) {
      width: 8rem;
      height: 8rem;
      margin: var(--pg-space-2) var(--pg-space-6);
      opacity: 0.8;
      transition-property: opacity;
      transition-duration: 0.5s;
    }

    .empty-project-item:hover pg-illustration::part(image) {
      opacity: 1;
    }

    .empty-cell-text {
      flex-grow: 1;
    }

    .empty-project-item h1 {
      margin: var(--pg-space-4);
      font-size: var(--pg-font-size-5);
      text-decoration: none;
    }

    .empty-project-item span {
      display: inline-block;
      padding: 0 var(--pg-space-4);
      color: var(--pg-color-text-muted);
    }

    .creator-layout {
      display: grid;
      grid-template-areas: 'creator-title creator-title' 'creator-one creator-two';
      align-content: center;
      padding-bottom: 4.5rem;
      position: relative;
      isolation: isolate;
    }

    /* Its own layer, so the backgrounds fade without fading the creators. */
    .creator-layout::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      opacity: 0.8;

      /* pg: 6.5 dark mode. Backgrounds keep the files' unDraw colours, not the --pg-illus-* tokens. */
      background-image:
        url(${unsafeCSS(webDeveloper)}), url(${unsafeCSS(videographer)});
      background-position:
        left 1rem center,
        right 1rem center;
      background-size: 12rem;
      background-repeat: no-repeat;
      transition-property: background-size background-position;
      transition-duration: 0.5s;
    }

    .creator-layout:hover::before {
      background-size: 10.25rem;
    }

    /* Narrower, the creators sit on the artwork. The tutorial's backgrounds go at the same width, under its 50rem layout. */
    @media (max-width: 50rem) {
      .creator-layout::before {
        display: none;
      }
    }

    .creator-layout h2 {
      grid-area: creator-title;
    }

    .creator-item {
      display: block;
      width: 16rem;
      transition-property: transform;
      transition-duration: 0.5s;
      color: var(--pg-color-text);
      text-decoration: none;
      text-align: center;
    }

    .creator-item:hover {
      transform: scale(1.15);
    }

    .creator-item img {
      width: 8rem;
      height: 8rem;
      border-radius: var(--pg-radius-pill);
    }

    .creator-name {
      display: inline-block;
      padding-top: var(--pg-space-4);
      padding-bottom: var(--pg-space-2);
      font-weight: bold;
    }

    .creator-one {
      grid-area: creator-one;
      justify-self: end;
    }

    .creator-two {
      grid-area: creator-two;
      justify-self: start;
    }
  `;

  /** Created on first use unless set before. */
  @property({ attribute: false }) accessor application: Application | undefined;

  readonly #projects = new ProjectsController(
    this,
    () => (this.application ??= Application.create()),
  );

  #onFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    // Resetting the form empties the input's live FileList.
    const files = [...(input.files ?? [])];
    input.form?.reset();
    this.#projects.import(files);
  }

  async #onOpen() {
    const dirHandle = await pickFolder();
    if (dirHandle) {
      this.#projects.open(dirHandle);
    }
  }

  #list() {
    const { projects } = this.#projects;
    if (projects.length <= 0) {
      return nothing;
    }
    return html`<div>
      <div class="list-project">
        <div class="list-project-header">
          <h2>Projects</h2>
          <photogram-import-project
            @import=${(event: CustomEvent<{ files: File[] }>) =>
              this.#projects.import(event.detail.files)}
          ></photogram-import-project>
        </div>
        <div class="list-project-container">
          <ul id="grid">
            ${repeat(
              projects,
              project => project.key,
              project =>
                html`<photogram-project-card
                  .project=${project}
                  @open=${() => this.#projects.link(project.key)}
                  @delete=${() => this.#projects.delete(project.key)}
                ></photogram-project-card>`,
            )}
          </ul>
        </div>
      </div>
    </div>`;
  }

  #cell(illustration: string, title: string, description: string) {
    return html`<section class="empty-project-item">
      <pg-illustration name=${illustration}></pg-illustration>
      <div class="empty-cell-text">
        <h1>${title}</h1>
        <span>${description}</span>
      </div>
    </section>`;
  }

  #howToStart() {
    return html`<div class="empty-project-layout">
      <h2>How to start</h2>
      <a href="/tutorial"
        >${this.#cell(
          'learning',
          'Learn',
          'Read our tutorial to learn how to create a new project',
        )}</a
      >
      <form>
        <input
          type="file"
          id="new-project-file"
          webkitdirectory
          directory
          multiple
          @change=${this.#onFiles}
        />
        <label for="new-project-file"
          >${this.#cell(
            'upload-image',
            'Create',
            'Import your pictures and csv file',
          )}</label
        >
      </form>
      ${
        canOpenFolder()
          ? html`<button
              type="button"
              class="empty-project-open"
              @click=${this.#onOpen}
            >
              ${this.#cell(
                'folder',
                'Open',
                'Open a folder and save your changes back to it',
              )}
            </button>`
          : nothing
      }
      <a href="/project-demo"
        >${this.#cell('presentation', 'Try', 'See a live demo of Photogram')}</a
      >
    </div>`;
  }

  #creators() {
    return html`<div class="creator-layout">
      <h2>Creators</h2>
      ${creators.map(
        creator =>
          html`<a
            href=${creator.link}
            target="_blank"
            rel="noopener noreferrer"
            class=${`${creator.className} creator-item`}
            ><img src=${creator.img} alt=${creator.name} /><br /><strong
              class="creator-name"
              >${creator.name}</strong
            ><br /><span>${creator.job}</span></a
          >`,
      )}
    </div>`;
  }

  render() {
    const { quota } = this.#projects;
    return html`<div class="landing-container">
      <slot name="header"></slot>
      ${this.#list()} ${this.#howToStart()}
      <photogram-quota
        .value=${quota.value}
        .max=${quota.max}
      ></photogram-quota>
      ${this.#creators()}
      <footer class="landing-footer">
        <a href="/privacy-policy">Privacy policy</a>
      </footer>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-landing': PhotogramLanding;
  }
}
