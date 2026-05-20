#!/usr/bin/env bash
#
# admin.bestbond.in — production static build (Vite → dist/)
# Run from repo root on the VPS clone, e.g. /var/www/admin.bestbond.in
#
#   chmod +x deploy.sh deploy/restart.sh
#   ./deploy.sh
#
# Optional:
#   RUN_GIT_PULL=1 ./deploy.sh
#   VITE_API_URL=https://api.bestbond.in ./deploy.sh
#   WEB_ROOT=/var/www/admin-html ./deploy.sh   (must NOT equal clone root)
#

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

log() { echo "==> [admin.bestbond.in] $*"; }

log "deploy from $ROOT"

if [[ "${RUN_GIT_PULL:-0}" == "1" ]] && [[ -d .git ]]; then
  log "git fetch + reset"
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
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
  API_URL="${VITE_API_URL:-}"
fi
API_URL="${API_URL:-https://api.bestbond.in}"

if [[ ! -f .env.production ]]; then
  if [[ -f .env.production.example ]]; then
    cp .env.production.example .env.production
    log "created .env.production from .env.production.example"
  else
    echo "ERROR: missing .env.production — copy .env.production.example"
    exit 1
  fi
fi

if ! grep -q '^VITE_API_URL=' .env.production 2>/dev/null; then
  printf '\nVITE_API_URL=%s\n' "$API_URL" >> .env.production
else
  # Update only VITE_API_URL line when override passed
  if [[ -n "${VITE_API_URL:-}" ]]; then
    if sed --version 2>/dev/null | grep -q GNU; then
      sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${API_URL}|" .env.production
    else
      sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=${API_URL}|" .env.production
    fi
  fi
fi
export VITE_API_URL="$API_URL"
log "VITE_API_URL=$API_URL"

log "npm ci"
npm ci

log "npm run build"
npm run build

if [[ ! -d dist ]] || [[ ! -f dist/index.html ]]; then
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
    echo "       Use nginx root ${ROOT}/dist or WEB_ROOT=$ROOT/public"
    exit 1
  fi
  log "rsync dist/ → $WEB_ROOT/"
  rsync -a --delete "${ROOT}/dist/" "${WEB_ROOT}/"
  log "Done. Nginx root: $WEB_ROOT"
else
  log "Done. Nginx root: ${ROOT}/dist"
fi
