import { css } from 'lit';

// Today's raised button on a native <button>, until pg-big-button replaces it.
export const raisedButtonStyles = css`
  .raised {
    display: inline-block;
    box-sizing: content-box;
    padding: 12px 16px;
    margin: 6px 8px 6px 8px;
    min-width: 88px;
    border: none;
    border-radius: var(--pg-radius-s);
    box-shadow: var(--pg-shadow-1);
    color: var(--pg-color-on-action);
    background-color: var(--pg-color-action);
    font: inherit;
    /* stylelint-disable-next-line declaration-property-value-disallowed-list -- pg: 6.5 */
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
  }

  .raised:hover {
    box-shadow: var(--pg-shadow-2);
    /* stylelint-disable-next-line color-no-hex -- pg: 6.5 */
    color: #ffffffff;
  }
`;
