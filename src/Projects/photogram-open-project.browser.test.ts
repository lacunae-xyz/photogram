import { html, render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './photogram-open-project';

const target = window as unknown as { showDirectoryPicker?: unknown };
const native = Object.getOwnPropertyDescriptor(window, 'showDirectoryPicker');

afterEach(() => {
  delete target.showDirectoryPicker;
  if (native) {
    Object.defineProperty(window, 'showDirectoryPicker', native);
  }
  render(null, document.body);
});

async function renderOpen() {
  render(
    html`<photogram-open-project></photogram-open-project>`,
    document.body,
  );
  const element = document.body.querySelector('photogram-open-project')!;
  await element.updateComplete;
  return element;
}

function stubPicker(picker: () => Promise<unknown>) {
  const stub = vi.fn(picker);
  target.showDirectoryPicker = stub;
  return stub;
}

const button = () => page.getByRole('button', { name: 'Open project' });

describe('photogram-open-project', () => {
  it('renders nothing without showDirectoryPicker (B20)', async () => {
    delete target.showDirectoryPicker;
    const element = await renderOpen();
    expect(element.shadowRoot!.children).toHaveLength(0);
    expect(element.getBoundingClientRect().height).toBe(0);
  });

  it('sends the picked folder', async () => {
    const folder = { name: 'Projet ouvert' };
    const picker = stubPicker(async () => folder);
    const element = await renderOpen();
    const onOpen = vi.fn();
    element.addEventListener('open', onOpen);
    await userEvent.click(button());
    await vi.waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
    expect(onOpen.mock.calls[0][0].detail).toEqual({ dirHandle: folder });
    expect(picker).toHaveBeenCalledWith({
      id: 'photogram-projects',
      mode: 'readwrite',
      startIn: 'pictures',
    });
  });

  it('sends nothing when the picker is cancelled (B21)', async () => {
    const picker = stubPicker(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    });
    const element = await renderOpen();
    const onOpen = vi.fn();
    element.addEventListener('open', onOpen);
    await userEvent.click(button());
    await vi.waitFor(() => expect(picker).toHaveBeenCalledOnce());
    await new Promise(resolve => setTimeout(resolve));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens the picker from the keyboard', async () => {
    const picker = stubPicker(async () => ({ name: 'Projet ouvert' }));
    await renderOpen();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => expect(picker).toHaveBeenCalledOnce());
  });
});
