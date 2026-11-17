import { css } from 'lit';

// The period and fx icons, in the box the old dots took, so the tile lays out as it did.
export const indicatorStyles = css`
  .indicator::part(icon) {
    padding: var(--pg-space-1);
    margin-right: var(--pg-space-2);
  }

  /* On the host, so the labelled image hides with its icon. */
  .indicator.hide {
    visibility: hidden;
  }
`;
