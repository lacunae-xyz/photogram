import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@lacunae-xyz/photogram-design-system/pg-big-button.js';
import '@lacunae-xyz/photogram-design-system/pg-button.js';
import '@lacunae-xyz/photogram-design-system/pg-dialog.js';
import type { Colors, Shot } from '../Application/types';
import empty from '../Templates/empty.svg';

export type EditedShot = Omit<Shot, 'url' | 'fx'> & {
  url?: string | null;
  fx?: string | boolean;
};

/**
 * The shot editor, a modal dialog shown while `shot` is set.
 *
 * Events: `save` ({ shot }: the shot with the edits), `close` (Escape, backdrop, Close),
 * `new-image` ({ files }), `delete-image`, `set-main` ({ url }).
 */
@customElement('photogram-tile-form')
export class PhotogramTileForm extends LitElement {
  static styles = css`
    pg-dialog::part(dialog) {
      max-width: 38.75rem;
    }

    #form {
      text-align: left;
    }

    #form::after {
      content: '';
      display: table;
      clear: both;
    }

    #form-img {
      width: 100%;
    }

    #form-sequence,
    #form-action,
    #label,
    #periode,
    #fx {
      border-radius: var(--pg-radius-s);
      background-color: var(--pg-grey-200);
      border: none;
      margin-bottom: var(--pg-space-2);
      font-family: var(--pg-font-mono);
      font-size: var(--pg-font-size-4);
    }

    label {
      padding: 0.625rem;
    }

    #form-action {
      width: 100%;
    }

    #form-sequence {
      width: 3.75rem;
    }

    #periode {
      width: 8.75rem;
    }

    #label {
      width: 10rem;
    }

    #form pg-button,
    #form pg-big-button {
      float: right;
    }

    .photogram-form-container {
      margin-bottom: 0.625rem;
      text-align: center;
      position: relative;
    }

    .photogram-form-container input {
      display: none;
    }

    #photogram-label {
      display: block;
      margin: 0;
      padding: 0;
      position: relative;
      text-align: center;
      opacity: 0.7;
      transition: opacity 0.4s;
    }

    #photogram-label:hover {
      opacity: 1;
    }

    #photogram-label img {
      width: 100%;
    }

    #photogram-label em {
      position: absolute;
      top: 85%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: color-mix(in srgb, var(--pg-grey-900) 53.3%, transparent);
    }

    .button-container {
      display: block;
      width: 100%;
      position: absolute;
      min-height: 3rem;
      bottom: var(--pg-space-1);
      background: color-mix(in srgb, var(--pg-grey-950) 25%, transparent);
      text-align: start;
    }

    .button-container button {
      font: inherit;
      background: none;
      border: none;
      color: var(--pg-color-on-chrome);
      min-height: 3rem;
      font-size: var(--pg-font-size-2);
      text-transform: uppercase;
    }

    .button-container button:hover,
    .button-container button:focus {
      background: var(--pg-color-hover);
    }
  `;

  @property({ attribute: false }) accessor shot: EditedShot | undefined;

  /** The project's labels, offered as suggestions. */
  @property({ attribute: false }) accessor colors: Colors | undefined;

  @state() private accessor edits: Partial<EditedShot> = {};

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has('shot') && changed.get('shot')?.id !== this.shot?.id) {
      this.edits = {};
    }
  }

  get #edited(): EditedShot | undefined {
    return this.shot && { ...this.shot, ...this.edits };
  }

  #emit(type: string, detail?: object) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  #onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.name) {
      return;
    }
    const value = target.type === 'checkbox' ? target.checked : target.value;
    this.edits = { ...this.edits, [target.name]: value };
  }

  #onSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.#emit('save', { shot: this.#edited });
  }

  // A custom element isn't a submit button, so Enter in a field doesn't submit the form by itself.
  #onKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement &&
      event.target.type === 'text'
    ) {
      event.preventDefault();
      (event.currentTarget as HTMLFormElement).requestSubmit();
    }
  }

  #image(url: string | null | undefined) {
    if (url) {
      return html`<div class="photogram-form-container">
        <img id="form-img" src=${url} alt="Photogram" />
        <span class="button-container"
          ><button type="button" @click=${() => this.#emit('delete-image')}>
            Delete</button
          ><button
            type="button"
            @click=${() => this.#emit('set-main', { url })}
          >
            Set as main
          </button></span
        >
      </div>`;
    }
    return html`<div class="photogram-form-container">
      <input
        id="photogram"
        type="file"
        accept="image/*"
        @change=${(event: Event) => {
          const input = event.target as HTMLInputElement;
          this.#emit('new-image', { files: [...(input.files ?? [])] });
          input.value = '';
        }}
      />
      <label for="photogram" id="photogram-label"
        ><img alt="" src=${empty} /><em>Add new photogram</em></label
      >
    </div>`;
  }

  render() {
    const shot = this.#edited;
    if (!shot) {
      return nothing;
    }
    const labels = Object.keys(this.colors ?? {}).sort();
    return html`<pg-dialog
      open
      label="Edit shot"
      @close=${() => this.#emit('close')}
    >
      <form
        id="form"
        @submit=${this.#onSubmit}
        @input=${this.#onInput}
        @keydown=${this.#onKeyDown}
      >
        ${this.#image(shot.url)}
        <div id="form-meta-datas">
          <input
            id="form-sequence"
            name="sequence"
            placeholder="sequence"
            aria-label="Sequence"
            autofocus
            .value=${shot.sequence ?? ''}
          />
          <label for="label">Label</label>
          <input
            id="label"
            list="label-list"
            name="label"
            placeholder="Label"
            .value=${shot.label ?? ''}
          />
          <datalist id="label-list">
            ${labels.map(label => html`<option value=${label}></option>`)}
          </datalist>
          <label for="periode">Periode</label>
          <select id="periode" name="periode" .value=${shot.periode ?? ''}>
            <option value="">None</option>
            <option value="matin">Morning</option>
            <option value="jour">Day</option>
            <option value="soir">Evening</option>
            <option value="nuit">Night</option>
          </select>
          <label for="fx">Fx</label>
          <input
            id="fx"
            name="fx"
            type="checkbox"
            .checked=${Boolean(shot.fx)}
          />
        </div>
        <textarea
          id="form-action"
          name="action"
          placeholder="action"
          aria-label="Action"
          rows="4"
          .value=${shot.action ?? ''}
        ></textarea>
        <pg-big-button type="submit">Save</pg-big-button>
        <pg-button id="form-close" @click=${() => this.#emit('close')}
          >Close</pg-button
        >
      </form>
    </pg-dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photogram-tile-form': PhotogramTileForm;
  }
}
