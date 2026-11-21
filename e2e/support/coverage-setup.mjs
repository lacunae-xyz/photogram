import fs from 'node:fs';
import path from 'node:path';

// PW_COVERAGE: start from an empty coverage-raw/, so a report never mixes two runs.
export default function globalSetup() {
  if (process.env.PW_COVERAGE) {
    fs.rmSync(path.join(import.meta.dirname, '..', 'coverage-raw'), {
      recursive: true,
      force: true,
    });
  }
}
