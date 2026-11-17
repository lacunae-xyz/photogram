// The gallery page (index.html, from 06's design.html prototype): every pg-* element and its states, in the scheme
// picked in its header. Its screenshots are in e2e/screenshots/gallery.spec.ts.
import { html, render } from 'lit';
import './pg-big-button';
import './pg-button';
import './pg-card';
import './pg-dialog';
import './pg-empty-state';
import './pg-header';
import { iconNames } from './pg-icon';
import { illustrationNames } from './pg-illustration';
import './pg-theme-switch';
import { applyTheme, storedTheme } from './theme';

applyTheme(storedTheme());

const greys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950];

const tokens: [string, string][] = [
  ['surface', 'page'],
  ['surface-raised', 'cards, dialogs, tiles'],
  ['surface-alt', 'empty states, code, chips'],
  ['fill', 'fields, the tile board, selected and hovered rows'],
  ['border', 'dividers'],
  ['border-strong', 'tile, card and swatch outlines'],
  ['chrome', 'header, image background (same in both)'],
  ['on-chrome', 'text on the chrome'],
  ['on-chrome-muted', 'the tagline'],
  ['text', 'body text'],
  ['text-muted', 'secondary text'],
  ['text-subtle', 'captions, metadata'],
  ['disabled', 'disabled controls'],
  ['accent', 'illustrations, active nav, fills'],
  ['on-accent', 'text on the accent'],
  ['accent-icon', 'icons (3:1)'],
  ['focus', 'focus ring (3:1)'],
  ['accent-text', 'links, pg-button (4.5:1)'],
  ['hover', 'hover tint'],
  ['action', 'pg-big-button'],
  ['on-action', 'text on the action'],
  ['backdrop', 'dialog backdrop, badges'],
];

/** The label colours: user data, the same in both schemes. */
const labels = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
];

const links = [
  { href: '#colour', label: 'Colour' },
  { href: '#elements', label: 'Elements' },
  { href: '#illustrations', label: 'Illustrations' },
];

const chip = (token: string, scheme: 'light' | 'dark') =>
  html`<span class="chip-frame ${scheme}"
    ><span
      class="chip"
      style="background-color: var(--pg-color-${token})"
    ></span
  ></span>`;

function openDialog() {
  const dialog = document.querySelector('pg-dialog');
  if (dialog) {
    dialog.open = true;
  }
}

function closeDialog() {
  const dialog = document.querySelector('pg-dialog');
  if (dialog) {
    dialog.open = false;
  }
}

const card = (heading: string, badge: string | undefined) =>
  html`<pg-card heading=${heading} href="#elements">
    <img slot="media" class="cover" alt="" src="/demo/1.jpg" />
    ${badge ? html`<pg-icon slot="badge" name=${badge}></pg-icon>` : ''}
    <pg-button slot="actions" variant="icon" label=${`Delete ${heading}`}
      ><pg-icon name="delete"></pg-icon
    ></pg-button>
  </pg-card>`;

render(
  html`<pg-header
      heading="Photogram"
      tagline="Design system"
      href="#"
      .links=${links}
      current="#elements"
      ><pg-theme-switch></pg-theme-switch
    ></pg-header>
    <main>
      <h1>Photogram design system</h1>
      <p>
        The <code>@lacunae-xyz/photogram-design-system</code> elements and
        tokens, in the scheme the switch above picks. Auto follows the system.
      </p>

      <h2 id="colour">Colour</h2>
      <h3>Grey scale</h3>
      <div class="ramp">
        ${greys.map(
          step =>
            html`<div
              class=${step >= 600 ? 'on-dark' : 'on-light'}
              style="background-color: var(--pg-grey-${step})"
            >
              <b>${step}</b>
            </div>`,
        )}
      </div>

      <h3>Semantic tokens</h3>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Light</th>
            <th>Dark</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>
          ${tokens.map(
            ([token, use]) =>
              html`<tr>
                <td><code>--pg-color-${token}</code></td>
                <td>${chip(token, 'light')}</td>
                <td>${chip(token, 'dark')}</td>
                <td class="note">${use}</td>
              </tr>`,
          )}
        </tbody>
      </table>

      <h3>Label colours</h3>
      <div class="row">
        ${labels.map(
          label =>
            html`<div class="swatch" style="background-color: ${label}"></div>`,
        )}
      </div>
      <p class="note">User data: the same in both schemes.</p>

      <h3>Type</h3>
      ${[5, 4, 3, 2, 1].map(
        size =>
          html`<div class="type-row">
            <code>font-size-${size}</code
            ><span style="font-size: var(--pg-font-size-${size})"
              >Séquence 12 · Intérieur nuit</span
            >
          </div>`,
      )}
      <div class="type-row">
        <code>font-text</code
        ><span style="font-family: var(--pg-font-text)"
          >Long-form text, in the system sans-serif.</span
        >
      </div>

      <h3>Shape, elevation, space</h3>
      <div class="row">
        <div class="box" style="border-radius: var(--pg-radius-s)">
          radius-s
        </div>
        <div class="box" style="border-radius: var(--pg-radius-pill)">
          radius-pill
        </div>
        <div class="box" style="box-shadow: var(--pg-shadow-1)">shadow-1</div>
        <div class="box" style="box-shadow: var(--pg-shadow-2)">shadow-2</div>
      </div>
      ${[1, 2, 3, 4, 5, 6].map(
        space =>
          html`<div class="row">
            <code>space-${space}</code>
            <div class="space" style="width: var(--pg-space-${space})"></div>
          </div>`,
      )}

      <h2 id="elements">pg-big-button</h2>
      <div class="row" id="big-buttons">
        <pg-big-button>Import project</pg-big-button>
        <pg-big-button disabled>Disabled</pg-big-button>
      </div>

      <h2>pg-button</h2>
      <div class="row" id="buttons">
        <pg-button>Export data.json</pg-button>
        <pg-button disabled>Disabled</pg-button>
        <pg-button variant="icon" label="Back"
          ><pg-icon name="arrow-back"></pg-icon
        ></pg-button>
        <pg-button variant="icon" label="Print"
          ><pg-icon name="print"></pg-icon
        ></pg-button>
        <pg-button variant="icon" label="Delete" disabled
          ><pg-icon name="delete"></pg-icon
        ></pg-button>
      </div>

      <h2>pg-icon</h2>
      <div class="row icons">
        ${iconNames.map(
          name => html`<pg-icon name=${name} label=${name}></pg-icon>`,
        )}
      </div>

      <h2>pg-card</h2>
      <div class="row cards">
        ${card('Linked', 'link')} ${card('Imported', 'link-off')}
        ${card('No badge', undefined)}
      </div>

      <h2>pg-empty-state</h2>
      <pg-empty-state illustration="empty-street" label="No project">
        <p>No project yet. Import a folder with a data.csv and its stills.</p>
        <pg-big-button>Import project</pg-big-button>
      </pg-empty-state>

      <h2>pg-dialog</h2>
      <pg-big-button @click=${openDialog}>Open the dialog</pg-big-button>
      <pg-dialog label="Shot 12">
        <h3>Shot 12</h3>
        <p>A modal dialog on the backdrop.</p>
        <div class="row">
          <pg-button @click=${closeDialog}>Cancel</pg-button>
          <pg-big-button @click=${closeDialog}>Save</pg-big-button>
        </div>
      </pg-dialog>

      <h2>pg-theme-switch</h2>
      <pg-theme-switch></pg-theme-switch>
      <p class="note">Also in the header, on the chrome.</p>

      <h2 id="illustrations">pg-illustration</h2>
      <div class="illustrations">
        ${illustrationNames.map(
          name =>
            html`<figure>
              <pg-illustration name=${name}></pg-illustration>
              <figcaption>${name}</figcaption>
            </figure>`,
        )}
      </div>
    </main>`,
  document.body,
);
