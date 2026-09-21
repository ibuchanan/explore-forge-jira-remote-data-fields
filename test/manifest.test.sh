#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
manifest="$root/apps/forge/manifest.yml"

test "$(yq -r '.modules."jira:issueContext"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestCreatePropertyPanel"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestCreatePropertyPanel"[0].unlicensedAccess[0]' "$manifest")" = customer
test "$(yq -r '.modules."jiraServiceManagement:portalRequestDetailPanel"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestDetailPanel"[0].unlicensedAccess[0]' "$manifest")" = customer
test "$(yq -r '.modules.endpoint[0] | has("route")' "$manifest")" = false
test "$(yq -r '.permissions.scopes | length' "$manifest")" = 1
test "$(yq -r '.resources[0].path' "$manifest")" = resources
test -f "$root/apps/forge/src/index.html"
grep -q 'src="./index.tsx"' "$root/apps/forge/src/index.html"
test -f "$root/apps/forge/src/index.tsx"
grep -q 'invokeRemote' "$root/apps/forge/src/index.tsx"
grep -q 'saveRemoteDataFields' "$root/apps/forge/src/index.tsx"
