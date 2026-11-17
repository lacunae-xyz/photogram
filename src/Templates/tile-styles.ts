import { css } from 'lit';

// The tile is the host, so it stays a box that print can keep on one page. Print margins are in Tiles.css.
export const tileStyles = css`
  :host {
    display: inline-block;
    border: 1px solid var(--pg-color-border-strong);
    overflow: unset;
    background-color: var(--pg-color-surface-raised);
    /* Resolved here, not inherited: a card-distribution tile is light-scheme on a dark page. Black in the light
       scheme, as tiles always printed, not the UI's grey-900. The first line is for browsers without light-dark(). */
    /* stylelint-disable color-no-hex -- printed tiles keep their black text */
    color: #000000;
    color: light-dark(#000000, var(--pg-grey-200));
    /* stylelint-enable color-no-hex */
    text-align: left;
    page-break-inside: avoid;
    box-sizing: border-box;
    cursor: pointer;
    transition: transform 200ms ease-out;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  :host(:hover) {
    transform: scale(1.05);
  }

  :host(:active) {
    transition-delay: 100ms;
    transform: scale(1.06);
  }
`;
