import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './photogram-quota';

afterEach(() => render(null, document.body));

async function renderQuota(value: number, max: number) {
  render(
    html`<photogram-quota .value=${value} .max=${max}></photogram-quota>`,
    document.body,
  );
  const quota = document.body.querySelector('photogram-quota')!;
  await quota.updateComplete;
  return quota;
}

describe('photogram-quota', () => {
  it('shows the usage out of the quota', async () => {
    const quota = await renderQuota(12_345_678, 1_234_567_890);
    await expect
      .element(page.getByText('11.77 MB / 1.15 GB'))
      .toBeInTheDocument();
    const bar = quota.shadowRoot!.querySelector('progress')!;
    expect(bar.value).toBe(12_345_678);
    expect(bar.max).toBe(1_234_567_890);
  });

  it('shows zero before the estimate', async () => {
    await renderQuota(0, 0);
    await expect.element(page.getByText('0 B / 0 B')).toBeInTheDocument();
  });

  it('reads its sizes from attributes', async () => {
    render(
      html`<photogram-quota value="2048" max="1048576"></photogram-quota>`,
      document.body,
    );
    await document.body.querySelector('photogram-quota')!.updateComplete;
    await expect.element(page.getByText('2 kB / 1 MB')).toBeInTheDocument();
  });

  it('stays at the bottom of the window', async () => {
    const quota = await renderQuota(0, 0);
    expect(getComputedStyle(quota).position).toBe('fixed');
    expect(quota.getBoundingClientRect().bottom).toBe(window.innerHeight);
  });
});
