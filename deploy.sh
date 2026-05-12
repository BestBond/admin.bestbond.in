#!/usr/bin/env bash
#
# admin.bestbond.in — Vite admin SPA (static files; no PM2)
# Run from repo root after cloning to e.g. /var/www/admin.bestbond.in
#
#   chmod +x deploy.sh
#   ./deploy.sh
#
# API URL for the bundle:
#   - Put VITE_API_URL in .env.production, or
#   - export VITE_API_URL=https://api.bestbond.in ./deploy.sh
#
# Optional: copy dist/ elsewhere (nginx root = that folder). WEB_ROOT must NOT be the same as
# the clone directory — rsync --delete would wipe src/, node_modules/, and break dist/ (vanished files).
# Good examples: WEB_ROOT=$ROOT/public   or   WEB_ROOT=/var/www/admin-html
#
# Optional: RUN_GIT_PULL=1 ./deploy.sh
#

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> [admin.bestbond.in] build from $ROOT"

if [[ "${RUN_GIT_PULL:-0}" == "1" ]] && [[ -d .git ]]; then
  echo "==> git: fetch + reset"
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git fetch origin main && git reset --hard origin/main
  elif git rev-parse --verify origin/master >/dev/null 2>&1; then
    git fetch origin master && git reset --hard origin/master
  else
    echo "WARN: no origin/main or origin/master — skip git reset"
  fi
fi

API_URL="${VITE_API_URL:-}"
if [[ -z "$API_URL" ]] && [[ -f .env.production ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck source=/dev/null
  source .env.production
  set +a
  API_URL="${VITE_API_URL:-}"
fi
API_URL="${API_URL:-https://api.bestbond.in}"
printf 'VITE_API_URL=%s\n' "$API_URL" > .env.production
echo "==> VITE_API_URL=$API_URL (written to .env.production)"

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

if [[ ! -d dist ]]; then
  echo "ERROR: dist/ missing after build"
  exit 1
fi

WEB_ROOT="${WEB_ROOT:-}"
if [[ -n "$WEB_ROOT" ]]; then
  mkdir -p "$WEB_ROOT"
  root_p="$(cd "$ROOT" && pwd -P)"
  web_p="$(cd "$WEB_ROOT" && pwd -P)"
  if [[ "$web_p" == "$root_p" ]]; then
    echo "ERROR: WEB_ROOT cannot equal the clone directory ($ROOT)."
    echo "       rsync --delete into the repo root removes source files and causes 'file has vanished'."
    echo "       Use nginx: root ${ROOT}/dist;  and run ./deploy.sh with no WEB_ROOT."
    echo "       Or set WEB_ROOT to e.g. $ROOT/public or a sibling folder like /var/www/admin-html."
    exit 1
  fi
  echo "==> rsync dist/ → $WEB_ROOT/"
  rsync -a --delete "${ROOT}/dist/" "${WEB_ROOT}/"
  echo "==> Done. Nginx root should be: $WEB_ROOT"
else
  echo "==> Done. Nginx root should be: ${ROOT}/dist"
  echo "    (Or re-run with WEB_ROOT=/path/to/htdocs to copy files out of dist/)"
fi
