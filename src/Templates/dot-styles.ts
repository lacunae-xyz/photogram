import { css } from 'lit';

// The dot is pg-icon's <img>, as it was before the port.
export const dotStyles = css`
  .dot::part(icon) {
    padding: 0.6rem;
    height: 2rem;
    width: 2rem;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
    border-radius: 100%;
    background-color: var(--pg-grey-400);
    margin-right: 0.8rem;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .dot.hide::part(icon) {
    visibility: hidden;
  }
`;
