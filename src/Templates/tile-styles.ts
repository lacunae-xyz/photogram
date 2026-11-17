import { css } from 'lit';

// The tile is the host, so it stays a box that print can keep on one page. Print margins are in Tiles.css.
export const tileStyles = css`
  :host {
    display: inline-block;
    border: 1px solid var(--pg-color-border-strong);
    overflow: unset;
    background-color: var(--pg-color-surface-raised);
    /* Resolved here, not inherited: a card-distribution tile is light-scheme on a dark page. */
    color: var(--pg-color-text);
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
