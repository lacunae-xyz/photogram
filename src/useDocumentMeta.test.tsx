import { act, StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import useDocumentMeta from './useDocumentMeta';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Page({ title, description }: { title: string; description: string }) {
  useDocumentMeta({ title, description });
  return null;
}

const description = () =>
  document
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.getAttribute('content');

let root: Root;

beforeEach(() => {
  document.head.innerHTML =
    '<meta name="description" content="Default description">';
  document.title = 'Default title';
  root = createRoot(document.createElement('div'));
});

afterEach(() => {
  act(() => root.unmount());
});

test('sets the title and description, and restores them on unmount', () => {
  act(() =>
    root.render(
      <StrictMode>
        <Page title="A" description="About A" />
      </StrictMode>,
    ),
  );
  expect(document.title).toBe('A');
  expect(description()).toBe('About A');

  act(() => root.render(null));
  expect(document.title).toBe('Default title');
  expect(description()).toBe('Default description');
});

test('replacing one page with another keeps the new page meta', () => {
  act(() => root.render(<Page key="a" title="A" description="About A" />));
  act(() => root.render(<Page key="b" title="B" description="About B" />));
  expect(document.title).toBe('B');
  expect(description()).toBe('About B');

  act(() => root.render(null));
  expect(document.title).toBe('Default title');
  expect(description()).toBe('Default description');
});

test('sets the title when the page has no description meta', () => {
  document.head.innerHTML = '';
  act(() => root.render(<Page title="A" description="About A" />));
  expect(document.title).toBe('A');
  expect(description()).toBeUndefined();
});
