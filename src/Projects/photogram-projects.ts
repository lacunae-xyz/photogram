import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import '@lacunae-xyz/photogram-design-system/pg-empty-state.js';
import Application from '../Application';
import { ProjectsController } from './projects-controller';
import './photogram-import-project';
import './photogram-open-project';
import './photogram-project-card';
import './photogram-quota';

/**
 * The projects page: import or open a project, and the projects stored in this browser.
 *
 * Slot: `header`. Event: `navigate`, with `detail.path`, to open a project.
 */
@customElement('photogram-projects')
export class PhotogramProjects extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .projects-container {
      max-width: 80rem;
      margin: auto;
      padding: 0 6.4rem;
    }

    .action-project {
      display: flex;
      justify-content: flex-end;
    }

    .projects-empty {
      margin: 12.8rem 0;
      /* An overflowing illustration starts at the left edge, as with auto margins. */
      align-items: safe center;
    }

    .projects-empty::part(illustration) {
      width: 51.2rem;
    }

    #grid {
      display: flex;
      list-style-type: none;
      margin: auto;
      overflow-y: hidden;
      flex-flow: wrap;
      padding: 0.4rem;
    }
  `;

  /** Created on first use unless set before. */
  @property({ attribute: false }) accessor application: Application | undefined;

  readonly #projects = new ProjectsController(
    this,
    () => (this.application ??= Application.create()),
  );

  render() {
    const { projects, quota } = this.#projects;
    return html`<div class="projects-container">
      <slot name="header"></slot>
      <div class="action-project">
        <photogram-import-project
          @import=${(event: CustomEvent<{ files: File[] }>) =>
            this.#projects.import(event.detail.files)}
        ></photogram-import-project>
        <photogram-open-project
          @open=${(
            event: CustomEvent<{ dirHandle: FileSystemDirectoryHandle }>,
          ) => this.#projects.open(event.detail.dirHandle)}
        ></photogram-open-project>
      </div>
      ${
        projects.length <= 0
          ? html`<pg-empty-state
              class="projects-empty"
              illustration="empty-street"
              label="No project"
            ></pg-empty-state>`
          : nothing
      }
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
      <photogram-quota
        .value=${quota.value}
        .max=${quota.max}
      ></photogram-quota>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-projects': PhotogramProjects;
  }
}
