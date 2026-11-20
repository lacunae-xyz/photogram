import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { palette } from '../Application/colors';
import './photogram-colors';

afterEach(() => render(null, document.body));

async function renderColors(
  colors: Record<string, string> | undefined,
  defaultColor?: string,
) {
  const element = document.createElement('photogram-colors');
  Object.assign(element, { colors, defaultColor });
  render(html`${element}`, document.body);
  await element.updateComplete;
  return element;
}

const input = (name: string) =>
  page.getByLabelText(`${name} colour`).element() as HTMLInputElement;

describe('photogram-colors', () => {
  it('shows each label with its colour, normalised to #rrggbb', async () => {
    await renderColors({ salon: '#F44336', cuisine: '#abc' });
    expect(input('salon').value).toBe('#f44336');
    expect(input('cuisine').value).toBe('#aabbcc');
    await expect.element(page.getByText('salon')).toBeVisible();
  });

  it('shows the default colour, white when unset', async () => {
    const element = await renderColors({});
    expect(input('Default').value).toBe('#ffffff');
    element.defaultColor = '#3F51B5';
    await element.updateComplete;
    expect(input('Default').value).toBe('#3f51b5');
  });

  it('saves a colour on change, not on input', async () => {
    const element = await renderColors({ salon: '#F44336' });
    const onChange = vi.fn();
    element.addEventListener('color-change', onChange);
    const salon = input('salon');
    salon.value = '#00ff00';
    salon.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
    salon.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].detail).toEqual({
      label: 'salon',
      color: '#00ff00',
    });
  });

  it('offers the label palette as presets on every colour input', async () => {
    await renderColors({ salon: '#F44336', cuisine: '#abc' });
    const expected = palette.map(color => color.toLowerCase());
    for (const name of ['Default', 'salon', 'cuisine']) {
      const list = input(name).list;
      expect(list).toBeInstanceOf(HTMLDataListElement);
      expect([...list!.options].map(option => option.value)).toEqual(expected);
    }
  });

  it('saves a preset like any colour', async () => {
    const element = await renderColors({ salon: '#F44336' });
    const onChange = vi.fn();
    element.addEventListener('color-change', onChange);
    const salon = input('salon');
    const preset = salon.list!.options[7].value;
    salon.value = preset;
    salon.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange.mock.calls[0][0].detail).toEqual({
      label: 'salon',
      color: preset,
    });
  });

  it('saves the default colour', async () => {
    const element = await renderColors({});
    const onChange = vi.fn();
    element.addEventListener('default-color-change', onChange);
    await userEvent.fill(page.getByLabelText('Default colour'), '#123456');
    expect(onChange.mock.calls.at(-1)?.[0].detail).toEqual({
      color: '#123456',
    });
  });

  it('deletes a label from its button, by keyboard too', async () => {
    const element = await renderColors({ salon: '#F44336' });
    const onDelete = vi.fn();
    element.addEventListener('color-delete', onDelete);
    const button = page.getByRole('button', { name: 'Delete label salon' });
    await userEvent.click(button);
    (button.element() as HTMLElement).focus();
    await userEvent.keyboard('{Enter}');
    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onDelete.mock.calls[0][0].detail).toEqual({ label: 'salon' });
  });

  it('keeps its events on itself', async () => {
    await renderColors({ salon: '#F44336' });
    const onDelete = vi.fn();
    document.body.addEventListener('color-delete', onDelete, { once: true });
    await userEvent.click(
      page.getByRole('button', { name: 'Delete label salon' }),
    );
    expect(onDelete).not.toHaveBeenCalled();
    document.body.removeEventListener('color-delete', onDelete);
  });
});
