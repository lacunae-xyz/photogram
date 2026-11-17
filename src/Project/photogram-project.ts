import { LitElement, css, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-big-button.js';
import '@lacunae-xyz/photogram-design-system/pg-empty-state.js';
import Application from '../Application';
import type { Project, Shot } from '../Application/types';
import Images from '../FilesParser/Images';
import track from '../track';
import type { EditedShot } from './photogram-tile-form';
import './photogram-configuration';
import './photogram-tile-form';
import './photogram-tiles';
import './photogram-toolbar';

/**
 * The project page: the toolbar, the tiles (or the prompt to grant folder access again), and the configuration.
 *
 * Event: `back`.
 */
@customElement('photogram-project')
export class PhotogramProject extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .layout-parent {
      display: grid;
      grid-template-columns: auto 15rem;
      grid-template-rows: 3.375rem auto;
      grid-template-areas: 'layout-top layout-top' 'layout-left layout-right';
      height: 100vh;
    }

    .layout-top {
      grid-area: layout-top;
    }

    .layout-left {
      grid-area: layout-left;
      width: 100%;
      height: 100%;
      overflow-y: auto;
    }

    /* Focusable, so the keyboard scrolls the tiles. */
    .layout-left:focus-visible {
      outline: 2px solid var(--pg-color-focus);
      outline-offset: -2px;
    }

    .layout-right {
      grid-area: layout-right;
    }

    @media print {
      .layout-parent {
        display: block;
        height: inherit;
      }

      .layout-left {
        height: inherit;
        overflow-y: visible;
      }

      .layout-top {
        display: none;
      }

      .layout-right {
        display: none;
      }
    }

    .prompt-permission {
      padding: 120px 0;
    }

    .prompt-permission::part(illustration) {
      width: 320px;
    }

    .prompt-permission-description {
      font-size: var(--pg-font-size-3);
      margin-bottom: 0;
    }
  `;

  @property({ attribute: 'project-id' }) accessor projectId: string | undefined;

  /** Created on the first update unless set before. */
  @property({ attribute: false }) accessor application: Application | undefined;

  @state() private accessor project: Partial<Project> = {};

  @state() private accessor permission = false;

  /** The shot in the tile form. */
  @state() private accessor shot: EditedShot | undefined;

  // Render in a task of its own, as React did. A use case on the in-memory demo resolves in microtasks, which
  // put the font change's re-created tiles, and their layout, in the input event's task.
  protected async scheduleUpdate() {
    await new Promise(resolve => setTimeout(resolve));
    super.scheduleUpdate();
  }

  protected willUpdate(changed: PropertyValues<this>) {
    this.application ??= Application.create();
    if (changed.has('projectId') || changed.has('application')) {
      this.#load();
    }
  }

  async #load() {
    const { application, projectId } = this;
    if (!application || projectId === undefined) {
      return;
    }
    // A load for an earlier project-id or application may end after this one.
    const current = () =>
      application === this.application && projectId === this.projectId;
    try {
      if (await application.needsPermission(projectId)) {
        if (current()) this.permission = true;
        return;
      }
      const project = await application.get(projectId);
      if (!current()) return;
      project.template ??= 'small';
      project.colorDistribution ??= 'indicator';
      this.project = project;
      this.permission = false;
    } catch (error) {
      console.error(error);
    }
  }

  /** Runs a use case on this project, then shows the saved project. */
  #save(change: (application: Application, id: string) => Promise<unknown>) {
    const { application, projectId } = this;
    if (!application || projectId === undefined) {
      return;
    }
    change(application, projectId).then(() => this.#load());
  }

  // Controlled checkboxes revert on click until the save reloads the project: show the new value now.
  #show(setting: Partial<Project>) {
    this.project = { ...this.project, ...setting };
  }

  #back() {
    track('project-back');
    this.dispatchEvent(new Event('back'));
  }

  #print() {
    track('project-print', { tiles: this.project.data?.length });
    window.print();
  }

  async #exportDataJson() {
    const json = await this.application!.exportDataJson(this.projectId!);
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  #onNewImage(files: File[]) {
    const shotId = this.shot?.id;
    Images.create()
      .execute(this.projectId!, files)
      .then(([image]) => {
        // The form may have closed, or moved to another shot, while the image was stored.
        if (image && this.shot?.id === shotId) {
          this.shot = { ...this.shot!, url: image.url };
        }
      })
      .catch(error => console.error(error));
  }

  async #grantPermission() {
    try {
      await this.application!.requestPermission(this.projectId!);
      this.#load();
    } catch (error) {
      console.error(error);
    }
  }

  #promptPermission() {
    return html`<pg-empty-state
      class="prompt-permission"
      illustration="private-files"
    >
      <p class="prompt-permission-description">
        Permission needs to be given again to access to the files.
      </p>
      <p class="prompt-permission-reason">
        Permission will be asked after each reload
      </p>
      <pg-big-button @click=${this.#grantPermission}
        >Grant permission</pg-big-button
      >
    </pg-empty-state>`;
  }

  render() {
    const project = this.project;
    const unlinked = project.key !== undefined && !project.dirLink;
    return html`<photogram-tile-form
        .shot=${this.shot}
        .colors=${project.colors}
        @close=${() => (this.shot = undefined)}
        @save=${(event: CustomEvent<{ shot: EditedShot }>) => {
          this.shot = undefined;
          this.#save((application, id) =>
            application.update(id, event.detail.shot as Shot),
          );
        }}
        @new-image=${(event: CustomEvent<{ files: File[] }>) =>
          this.#onNewImage(event.detail.files)}
        @delete-image=${() => (this.shot = { ...this.shot!, url: null })}
        @set-main=${(event: CustomEvent<{ url: string }>) =>
          this.application!.updateMainPicture(this.projectId!, event.detail.url)
            .then(() => (this.shot = undefined))
            .catch(error => console.error(error))}
      ></photogram-tile-form>
      <main class="layout-parent">
        <div class="layout-top">
          <photogram-toolbar
            .heading=${project.name}
            .exportable=${unlinked}
            @back=${this.#back}
            @print=${this.#print}
            @export=${() =>
              this.#exportDataJson().catch(error => console.error(error))}
          ></photogram-toolbar>
        </div>
        <div class="layout-left" role="region" aria-label="Tiles" tabindex="0">
          ${
            this.permission
              ? this.#promptPermission()
              : html`<photogram-tiles
                  .shots=${project.data}
                  .template=${project.template}
                  .colors=${project.colors}
                  .defaultColor=${project.defaultColor}
                  .colorDistribution=${project.colorDistribution}
                  .fontFamily=${project.fontFamily}
                  .printSpaceAround=${project.printSpaceAround}
                  @tile-select=${(event: CustomEvent<{ shot: Shot }>) =>
                    (this.shot = event.detail.shot)}
                ></photogram-tiles>`
          }
        </div>
        <div class="layout-right">
          <photogram-configuration
            .template=${project.template}
            .fontFamily=${project.fontFamily}
            .printSpaceAround=${project.printSpaceAround}
            .colorDistribution=${project.colorDistribution}
            .defaultColor=${project.defaultColor}
            .colors=${project.colors}
            @template-change=${(
              event: CustomEvent<Pick<Project, 'template'>>,
            ) =>
              this.#save((application, id) =>
                application.updateTemplate(id, event.detail.template),
              )}
            @font-family-change=${(
              event: CustomEvent<{ fontFamily: string }>,
            ) =>
              this.#save((application, id) =>
                application.updateFontFamily(id, event.detail.fontFamily),
              )}
            @print-space-around-change=${(
              event: CustomEvent<{ printSpaceAround: boolean }>,
            ) => {
              const { printSpaceAround } = event.detail;
              this.#show({ printSpaceAround });
              this.#save((application, id) =>
                application.updatePrintSpaceAround(id, printSpaceAround),
              );
            }}
            @color-distribution-change=${(
              event: CustomEvent<Required<Pick<Project, 'colorDistribution'>>>,
            ) => {
              const { colorDistribution } = event.detail;
              this.#show({ colorDistribution });
              this.#save((application, id) =>
                application.updateColorDistribution(id, colorDistribution),
              );
            }}
            @default-color-change=${(event: CustomEvent<{ color: string }>) =>
              this.#save((application, id) =>
                application.updateDefaultColor(id, event.detail.color),
              )}
            @color-change=${(
              event: CustomEvent<{ label: string; color: string }>,
            ) =>
              this.#save((application, id) =>
                application.updateColor(id, {
                  [event.detail.label]: event.detail.color,
                }),
              )}
            @color-delete=${(event: CustomEvent<{ label: string }>) =>
              this.#save((application, id) =>
                application.deleteColor(id, event.detail.label),
              )}
          ></photogram-configuration>
        </div>
      </main>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-project': PhotogramProject;
  }
}
