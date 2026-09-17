#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
test "$(yq -r '.modules | keys | length' "$root/apps/forge/manifest.yml")" = 2
test "$(yq -r '.modules."jira:issueContext"[0].resolver.endpoint' "$root/apps/forge/manifest.yml")" = text-properties-api
test "$(yq -r '.modules.endpoint[0] | has("route")' "$root/apps/forge/manifest.yml")" = false
test "$(yq -r '.permissions.scopes | length' "$root/apps/forge/manifest.yml")" = 0
test -f "$root/apps/forge/resources/index.html"
grep -q 'src="index.js"' "$root/apps/forge/resources/index.html"
test -f "$root/apps/forge/src/index.ts"
grep -q 'invokeRemote' "$root/apps/forge/src/index.ts"
