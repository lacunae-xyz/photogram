import { css } from 'lit';

// The period and fx dots, as before the icons changed: a 20px icon on a 32px disc. The disc is the icon's background,
// so each fill sets an icon colour that reads on it (≥ 3:1) whatever the label colour under a translucent fill.
export const indicatorStyles = css`
  .indicator::part(icon) {
    padding: 0.375rem;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--pg-radius-pill);
    margin-right: var(--pg-space-2);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* On the host, so the labelled image hides with its icon. */
  .indicator.hide {
    visibility: hidden;
  }
`;
