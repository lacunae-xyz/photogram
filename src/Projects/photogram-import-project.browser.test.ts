import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './photogram-import-project';

afterEach(() => {
  vi.restoreAllMocks();
  render(null, document.body);
});

async function renderImport() {
  render(
    html`<photogram-import-project></photogram-import-project>`,
    document.body,
  );
  const element = document.body.querySelector('photogram-import-project')!;
  await element.updateComplete;
  const input = element.shadowRoot!.querySelector('input')!;
  // A real click would open the native picker.
  const pick = vi.spyOn(input, 'click').mockImplementation(() => {});
  return { element, input, pick };
}

function pickFiles(input: HTMLInputElement, names: string[]) {
  const transfer = new DataTransfer();
  for (const name of names) {
    transfer.items.add(new File(['x'], name));
  }
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('photogram-import-project', () => {
  it('is a button over a hidden folder input', async () => {
    const { input } = await renderImport();
    await expect
      .element(page.getByRole('button', { name: 'Import project' }))
      .toBeVisible();
    expect(input.type).toBe('file');
    expect(input.multiple).toBe(true);
    expect(input.hasAttribute('webkitdirectory')).toBe(true);
    expect(getComputedStyle(input).display).toBe('none');
  });

  it('opens the picker on click', async () => {
    const { pick } = await renderImport();
    await userEvent.click(page.getByRole('button', { name: 'Import project' }));
    expect(pick).toHaveBeenCalledOnce();
  });

  it('opens the picker from the keyboard', async () => {
    const { pick } = await renderImport();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(pick).toHaveBeenCalledTimes(2);
  });

  it('sends a copy of the picked files and clears the input', async () => {
    const { element, input } = await renderImport();
    const onImport = vi.fn();
    element.addEventListener('import', onImport);
    pickFiles(input, ['data.csv', '1.jpg']);
    expect(onImport).toHaveBeenCalledOnce();
    const files: File[] = onImport.mock.calls[0][0].detail.files;
    expect(input.files).toHaveLength(0);
    expect(files.map(file => file.name)).toEqual(['data.csv', '1.jpg']);
  });

  it('sends nothing when no file is picked', async () => {
    const { element, input } = await renderImport();
    const onImport = vi.fn();
    element.addEventListener('import', onImport);
    pickFiles(input, []);
    expect(onImport).not.toHaveBeenCalled();
  });
});
