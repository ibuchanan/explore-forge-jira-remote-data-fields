#!/usr/bin/env bash
set -euo pipefail

if ! command -v secretspec >/dev/null 2>&1; then
	printf '%s\n' 'secretspec is required; install it from https://secretspec.dev' >&2
	exit 127
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
	printf '%s\n' "usage: scripts/env-var.sh '<command>' [profile]" >&2
	exit 64
fi

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
profile=${2:-default}
exec secretspec --file "$root/secretspec.toml" run --profile "$profile" -- bash -ceu "$1"
