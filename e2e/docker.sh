#!/usr/bin/env sh
# Runs Playwright in the same image as CI, on the host architecture (Chromium crashes under qemu).
# Screenshot baselines and perf budgets come from here. Needs ../dist (npm run build).
# Usage: ./docker.sh [playwright test args]
#        E2E_NODE_MODULES_VOLUME=name ./docker.sh ...   separate node_modules volume for concurrent runs
#        ./docker.sh --budgets    rewrites perf/budgets.json
#        ./docker.sh --perf       the CI perf gate: 3 runs per scenario, median blocking time against budgets.json
#        ./docker.sh --perf --baseline <dir>
#                                 the pull request gate: ../dist against <dir>, a build of the base commit, served side
#                                 by side and measured interleaved. <dir> is relative to the current directory, e.g.
#                                 git worktree add /tmp/photogram-base origin/master
#                                 (cd /tmp/photogram-base && npm ci && npm run build)
#                                 ./docker.sh --perf --baseline /tmp/photogram-base/dist
set -eu
baseline=
if [ "${1:-}" = "--perf" ] && [ "${2:-}" = "--baseline" ]; then
  baseline=$(cd "${3:?--baseline needs a dist directory}" && pwd)
  shift 3
  set -- --perf --baseline /baseline "$@"
fi
cd "$(dirname "$0")/.."
version=$(node -p "require('./e2e/package.json').devDependencies['@playwright/test']")
if [ "${1:-}" = "--budgets" ]; then
  shift
  command='node perf/update-budgets.mjs "$@"'
elif [ "${1:-}" = "--perf" ]; then
  shift
  command='node perf/check-budgets.mjs "$@"'
else
  command='npx playwright test "$@"'
fi
exec docker run --rm --init --ipc=host \
  -v "$PWD":/work -v "${E2E_NODE_MODULES_VOLUME:-photogram-e2e-node-modules}":/work/e2e/node_modules -w /work/e2e \
  ${baseline:+-v "$baseline":/baseline:ro} \
  -e CI -e PLAYWRIGHT_DOCKER=1 -e PERF_SLOW -e PW_COVERAGE -e PW_COVERAGE_ARGS \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c "npm ci --no-audit --no-fund >/dev/null && $command" playwright "$@"
