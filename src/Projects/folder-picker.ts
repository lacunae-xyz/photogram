// Chromium only, and missing from TypeScript's DOM lib.
type DirectoryPicker = (options: {
  id: string;
  mode: 'read' | 'readwrite';
  startIn: string;
}) => Promise<FileSystemDirectoryHandle>;

export function canOpenFolder() {
  return 'showDirectoryPicker' in window;
}

/** Resolves with the picked folder, or undefined when the picker is cancelled. */
export async function pickFolder(): Promise<
  FileSystemDirectoryHandle | undefined
> {
  const showDirectoryPicker = (
    window as unknown as { showDirectoryPicker: DirectoryPicker }
  ).showDirectoryPicker;
  try {
    return await showDirectoryPicker({
      id: 'photogram-projects',
      mode: 'readwrite',
      startIn: 'pictures',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return undefined;
    }
    throw error;
  }
}
