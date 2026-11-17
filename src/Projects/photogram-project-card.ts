import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-button.js';
import '@lacunae-xyz/photogram-design-system/pg-card.js';
import '@lacunae-xyz/photogram-design-system/pg-icon.js';
import type { Project } from '../Application/types';

/**
 * A project in a list: its cover (main picture, else the first shot's image), name, and whether it's linked to a folder.
 * Put it in a `<ul>`: it is the list item.
 *
 * Events: `open` and `delete`, with `detail.key`.
 */
@customElement('photogram-project-card')
export class PhotogramProjectCard extends LitElement {
  static styles = css`
    /* A flex box, so the card stretches to the tallest card in its row. */
    :host {
      display: flex;
    }

    pg-card {
      width: 24rem;
      min-width: 12rem;
      margin: 1.2rem;
    }

    .img-project-cover {
      width: 100%;
      display: block;
    }

    .img-project-link::part(icon) {
      display: block;
      width: 24px;
      height: 24px;
      padding: 6px;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 30px;
      /* stylelint-disable-next-line function-disallowed-list -- pg: 6.5 */
      background-color: rgba(255, 255, 255, 0.6);
    }

    .btn-delete::part(button) {
      display: block;
      height: 2.6rem;
      width: 2.6rem;
      padding: 0;
      line-height: normal;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      font-size: 1.3rem;
      font-weight: bold;
      text-transform: none;
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background: #fff;
      color: var(--pg-color-text-muted);
      /* stylelint-disable-next-line color-named -- pg: 6.5 */
      border: 1px solid silver;
      /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
      border-radius: 100px;
    }

    .btn-delete::part(button):active {
      /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
      background: #ddd;
      color: var(--pg-color-text);
    }
  `;

  @property({ attribute: false }) accessor project: Project | undefined;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
  }

  #emit(type: 'open' | 'delete') {
    this.dispatchEvent(
      new CustomEvent(type, { detail: { key: this.project?.key } }),
    );
  }

  #onClick(event: MouseEvent) {
    const onLink = event
      .composedPath()
      .some(target => target instanceof HTMLAnchorElement);
    // A modified click on the name does what it does on any link (new tab, window, download).
    if (
      onLink &&
      (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    event.preventDefault();
    this.#emit('open');
  }

  #onDelete(event: MouseEvent) {
    event.stopPropagation();
    this.#emit('delete');
  }

  render() {
    const project = this.project;
    if (!project) {
      return nothing;
    }
    const cover = project.mainPicture || project.data[0]?.url;
    const linked = project.dirLink !== undefined;
    return html`<pg-card
      class="projects-card"
      heading=${project.name}
      href=${`/project/${project.key}`}
      @click=${this.#onClick}
    >
      <img
        slot="media"
        class="img-project-cover"
        alt="project cover"
        src=${cover ?? nothing}
      />
      <pg-icon
        slot="badge"
        class="img-project-link"
        name=${linked ? 'link' : 'link-off'}
        title=${
          linked
            ? 'Linked project with file system'
            : 'Imported project inside the browser (unlinked)'
        }
      ></pg-icon>
      <pg-button
        slot="actions"
        variant="icon"
        class="btn-delete"
        label=${`Delete ${project.name}`}
        @click=${this.#onDelete}
        >✕</pg-button
      >
    </pg-card>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-project-card': PhotogramProjectCard;
  }
}
