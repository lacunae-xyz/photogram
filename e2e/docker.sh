#!/usr/bin/env sh
# Runs Playwright in the same image as CI, on the host architecture (Chromium crashes under qemu).
# Screenshot baselines and perf budgets come from here. Needs ../build (CI=true npm run build on Node 16).
# Usage: ./docker.sh [playwright test args]
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
  -v "$PWD":/work -v photogram-e2e-node-modules:/work/e2e/node_modules -w /work/e2e \
  -e CI -e PLAYWRIGHT_DOCKER=1 -e PERF_SLOW \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c "npm ci --no-audit --no-fund >/dev/null && $command" playwright "$@"
