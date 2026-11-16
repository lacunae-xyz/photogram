import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { EditedShot, PhotogramTileForm } from './photogram-tile-form';
import './photogram-tile-form';

afterEach(() => render(null, document.body));

const shot: EditedShot = {
  id: '3',
  sequence: '3',
  action: 'Théo entre',
  label: 'salon',
  periode: 'soir',
  fx: 'x',
  url: '/demo/1.jpg',
};

async function renderForm(settings: Partial<PhotogramTileForm> = {}) {
  const element = document.createElement('photogram-tile-form');
  Object.assign(element, {
    shot,
    colors: { salon: '#F44336', cuisine: '#E91E63' },
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

describe('photogram-tile-form', () => {
  it('shows nothing without a shot', async () => {
    const element = await renderForm({ shot: undefined });
    expect(element.shadowRoot!.querySelector('#form')).toBeNull();
  });

  it('shows the shot in a modal dialog, focus on the sequence', async () => {
    const element = await renderForm();
    expect(element.shadowRoot!.activeElement?.id).toBe('form-sequence');
    await expect
      .element(page.getByRole('dialog', { name: 'Edit shot' }))
      .toBeVisible();
    await expect.element(page.getByLabelText('Sequence')).toHaveValue('3');
    await expect
      .element(page.getByRole('combobox', { name: 'Label' }))
      .toHaveValue('salon');
    await expect
      .element(page.getByRole('combobox', { name: 'Periode' }))
      .toHaveValue('soir');
    await expect
      .element(page.getByRole('checkbox', { name: 'Fx' }))
      .toBeChecked();
    await expect
      .element(page.getByLabelText('Action'))
      .toHaveValue('Théo entre');
    await expect.element(page.getByAltText('Photogram')).toBeVisible();
  });

  it('suggests the project labels', async () => {
    const element = await renderForm();
    const options = element.shadowRoot!.querySelectorAll('#label-list option');
    expect([...options].map(option => option.getAttribute('value'))).toEqual([
      'cuisine',
      'salon',
    ]);
  });

  it('saves the shot with the edits', async () => {
    const element = await renderForm();
    const saved = listen(element, 'save');
    await userEvent.fill(page.getByLabelText('Action'), 'Théo sort');
    await userEvent.selectOptions(
      page.getByRole('combobox', { name: 'Periode' }),
      'nuit',
    );
    await userEvent.click(page.getByRole('checkbox', { name: 'Fx' }));
    await userEvent.click(page.getByRole('button', { name: 'Save' }));
    expect(saved()).toEqual([
      { shot: { ...shot, action: 'Théo sort', periode: 'nuit', fx: false } },
    ]);
  });

  it('saves on Enter in a text field', async () => {
    const element = await renderForm();
    const saved = listen(element, 'save');
    await userEvent.fill(page.getByLabelText('Sequence'), '3 bis');
    await userEvent.keyboard('{Enter}');
    expect(saved()).toEqual([{ shot: { ...shot, sequence: '3 bis' } }]);
  });

  it('keeps the edits when the image changes', async () => {
    const element = await renderForm();
    const saved = listen(element, 'save');
    await userEvent.fill(page.getByLabelText('Action'), 'Théo sort');
    element.shot = { ...shot, url: null };
    await element.updateComplete;
    await userEvent.click(page.getByRole('button', { name: 'Save' }));
    expect(saved()).toEqual([
      { shot: { ...shot, url: null, action: 'Théo sort' } },
    ]);
  });

  it('drops the edits for another shot', async () => {
    const element = await renderForm();
    await userEvent.fill(page.getByLabelText('Action'), 'Théo sort');
    element.shot = { ...shot, id: '4', action: 'Alice' };
    await element.updateComplete;
    await expect.element(page.getByLabelText('Action')).toHaveValue('Alice');
  });

  it('closes on Close and on Escape', async () => {
    const element = await renderForm();
    const onClose = vi.fn();
    element.addEventListener('close', onClose);
    await userEvent.click(page.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => onClose.mock.calls.length).toBe(2);
  });

  it('deletes the image or sets it as main', async () => {
    const element = await renderForm();
    const deleted = listen(element, 'delete-image');
    const main = listen(element, 'set-main');
    await userEvent.click(page.getByRole('button', { name: 'Delete' }));
    await userEvent.click(page.getByRole('button', { name: 'Set as main' }));
    expect(deleted()).toHaveLength(1);
    expect(main()).toEqual([{ url: '/demo/1.jpg' }]);
  });

  it('offers a new image without one', async () => {
    const element = await renderForm({ shot: { ...shot, url: null } });
    const added = listen(element, 'new-image');
    await expect.element(page.getByText('Add new photogram')).toBeVisible();
    const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' });
    await userEvent.upload(page.getByLabelText('Add new photogram'), file);
    expect(added()).toHaveLength(1);
    expect(added()[0].files[0].name).toBe('shot.jpg');
  });
});
