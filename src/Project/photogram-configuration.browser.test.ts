import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { PhotogramConfiguration } from './photogram-configuration';
import './photogram-configuration';

afterEach(() => render(null, document.body));

async function renderConfiguration(
  settings: Partial<PhotogramConfiguration> = {},
) {
  const element = document.createElement('photogram-configuration');
  Object.assign(element, {
    template: 'small',
    colorDistribution: 'indicator',
    colors: { salon: '#F44336' },
    ...settings,
  });
  render(html`${element}`, document.body);
  await element.updateComplete;
  return element;
}

function listen(element: HTMLElement, type: string) {
  const listener = vi.fn();
  element.addEventListener(type, listener);
  return () => listener.mock.calls.map(([event]) => event.detail);
}

describe('photogram-configuration', () => {
  it('shows the settings', async () => {
    const element = await renderConfiguration({
      template: 'large',
      fontFamily: 'Arial',
      printSpaceAround: true,
      colorDistribution: 'card',
    });
    await expect
      .element(page.getByRole('checkbox', { name: 'Space around cards' }))
      .toBeChecked();
    await expect
      .element(page.getByRole('checkbox', { name: 'Background color' }))
      .toBeChecked();
    await expect.element(page.getByRole('combobox')).toHaveValue('Arial');
    expect(
      element.shadowRoot!.querySelector<HTMLInputElement>(
        'input[name=layout]:checked',
      )?.value,
    ).toBe('large');
    await expect
      .element(page.getByLabelText('salon colour'))
      .toBeInTheDocument();
  });

  it('shows a preview of each template', async () => {
    const element = await renderConfiguration();
    const previews = element.shadowRoot!.querySelectorAll(
      '.preview > :is(photogram-tile-small, photogram-tile-large)',
    );
    expect([...previews].map(tile => tile.localName)).toEqual([
      'photogram-tile-small',
      'photogram-tile-large',
    ]);
    expect(previews[0]).toMatchObject({ sequence: '1', period: 'soir' });
  });

  it('tells each change', async () => {
    const element = await renderConfiguration();
    const printSpaceAround = listen(element, 'print-space-around-change');
    const fontFamily = listen(element, 'font-family-change');
    const template = listen(element, 'template-change');
    const colorDistribution = listen(element, 'color-distribution-change');

    await userEvent.click(
      page.getByRole('checkbox', { name: 'Space around cards' }),
    );
    await userEvent.fill(page.getByRole('combobox'), 'Arial');
    await userEvent.click(page.getByText('Large'));
    await userEvent.click(
      page.getByRole('checkbox', { name: 'Background color' }),
    );

    expect(printSpaceAround()).toEqual([{ printSpaceAround: true }]);
    expect(fontFamily()).toEqual([{ fontFamily: 'Arial' }]);
    expect(template()).toEqual([{ template: 'large' }]);
    expect(colorDistribution()).toEqual([{ colorDistribution: 'card' }]);
  });

  it('lets the colour events out', async () => {
    const element = await renderConfiguration();
    const deleted = listen(element, 'color-delete');
    await userEvent.click(
      page.getByRole('button', { name: 'Delete label salon' }),
    );
    expect(deleted()).toEqual([{ label: 'salon' }]);
  });

  it('follows a new font family from outside', async () => {
    const element = await renderConfiguration({ fontFamily: 'Arial' });
    element.fontFamily = 'Georgia';
    await element.updateComplete;
    await expect.element(page.getByRole('combobox')).toHaveValue('Georgia');
  });
});
