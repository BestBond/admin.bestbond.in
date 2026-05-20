#!/usr/bin/env bash
# Re-run production build only (no git pull). From repo root:
#   ./deploy/restart.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec "$ROOT/deploy.sh"
