#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
test "$(yq -r '.modules | keys | length' "$root/apps/forge/manifest.yml")" = 2
test "$(yq -r '.modules."jira:issueContext"[0].resolver.endpoint' "$root/apps/forge/manifest.yml")" = text-properties-api
test "$(yq -r '.permissions.scopes | length' "$root/apps/forge/manifest.yml")" = 0
test -f "$root/apps/forge/resources/index.html"
