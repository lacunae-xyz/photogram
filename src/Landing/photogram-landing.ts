import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '@lacunae-xyz/photogram-design-system/pg-illustration.js';
import Application from '../Application';
import { canOpenFolder, pickFolder } from '../Projects/folder-picker';
import { ProjectsController } from '../Projects/projects-controller';
import '../Projects/photogram-import-project';
import '../Projects/photogram-project-card';
import '../Projects/photogram-quota';
import videographer from '../illus/undraw_videographer_nnc7.svg';
import webDeveloper from '../illus/undraw_web_developer_p3e5.svg';

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
      max-width: 80rem;
      margin: auto;
      padding: 0 6.4rem;
    }

    h2 {
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 2.8rem;
    }

    .landing-footer {
      padding: 3.2rem 0;
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
      padding: 0.4rem;
    }

    .empty-project-layout {
      padding-top: 1.6rem;
      padding-bottom: 1.6rem;
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
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 0.8rem;
      transition-property: transform background-color;
      transition-duration: 0.5s;
      color: var(--pg-color-text);
      text-decoration: none;
      padding-bottom: 1.6rem;
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
      width: 12.8rem;
      height: 12.8rem;
      margin: 0.8rem 3.2rem;
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
      margin: 1.6rem;
      text-decoration: none;
    }

    .empty-project-item span {
      display: inline-block;
      padding: 0rem 1.6rem;
      color: var(--pg-color-text-muted);
    }

    .creator-layout {
      display: grid;
      grid-template-areas: 'creator-title creator-title' 'creator-one creator-two';
      align-content: center;
      padding-bottom: 7.2rem;

      background-image:
        url(${unsafeCSS(webDeveloper)}), url(${unsafeCSS(videographer)});
      background-position:
        left 1.6rem center,
        right 1.6rem center;
      background-size: 19.2rem;
      background-repeat: no-repeat;
      transition-property: background-size background-position;
      transition-duration: 0.5s;
    }

    .creator-layout:hover {
      background-size: 16.4rem;
    }

    .creator-layout h2 {
      grid-area: creator-title;
    }

    .creator-item {
      display: block;
      width: 25.6rem;
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
      width: 12.8rem;
      height: 12.8rem;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 12.8rem;
    }

    .creator-name {
      display: inline-block;
      padding-top: 1.6rem;
      padding-bottom: 0.8rem;
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
