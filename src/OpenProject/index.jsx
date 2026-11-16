import React from 'react';
import './index.css';

export function canOpenFolder() {
  return 'showDirectoryPicker' in window;
}

/** Resolves with the picked folder, or undefined when the picker is cancelled. */
export async function pickFolder() {
  try {
    return await window.showDirectoryPicker({
      id: 'photogram-projects',
      mode: 'readwrite',
      startIn: 'pictures',
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return undefined;
    }
    throw error;
  }
}

export default function OpenProject(props) {
  if (!canOpenFolder()) {
    return null;
  }

  async function handleDir(event) {
    event.preventDefault();
    const dirHandle = await pickFolder();
    if (dirHandle) {
      props.onProject(dirHandle);
    }
  }

  return (
    <div className="open-project">
      <label id="open-project-label" onClick={handleDir}>
        Open project
      </label>
    </div>
  );
}
