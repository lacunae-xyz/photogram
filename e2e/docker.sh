#!/usr/bin/env sh
# Runs Playwright in the same image as CI, on the host architecture (Chromium crashes under qemu).
# Screenshot baselines and perf budgets come from here. Needs ../dist (npm run build).
# Usage: ./docker.sh [playwright test args]
#        E2E_NODE_MODULES_VOLUME=name ./docker.sh ...   separate node_modules volume for concurrent runs
#        ./docker.sh --budgets    rewrites perf/budgets.json
set -eu
cd "$(dirname "$0")/.."
version=$(node -p "require('./e2e/package.json').devDependencies['@playwright/test']")
if [ "${1:-}" = "--budgets" ]; then
  shift
  command='node perf/update-budgets.mjs "$@"'
else
  command='npx playwright test "$@"'
fi
exec docker run --rm --init --ipc=host \
  -v "$PWD":/work -v "${E2E_NODE_MODULES_VOLUME:-photogram-e2e-node-modules}":/work/e2e/node_modules -w /work/e2e \
  -e CI -e PLAYWRIGHT_DOCKER=1 -e PERF_SLOW \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c "npm ci --no-audit --no-fund >/dev/null && $command" playwright "$@"
