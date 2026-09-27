#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
manifest="$root/apps/forge/manifest.yml"

test "$(yq -r '.modules."jira:issueContext"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestCreatePropertyPanel"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestCreatePropertyPanel"[0].unlicensedAccess[0]' "$manifest")" = customer
test "$(yq -r '.modules."jiraServiceManagement:portalRequestDetail"[0].resolver.endpoint' "$manifest")" = remote-data-fields-api
test "$(yq -r '.modules."jiraServiceManagement:portalRequestDetail"[0].unlicensedAccess[0]' "$manifest")" = customer
test "$(yq -r '.modules | has("jiraServiceManagement:portalRequestDetailPanel")' "$manifest")" = false
test "$(yq -r '[.modules.function[].handler] | join(",")' "$manifest")" = triggers.copyFormStateOnCreate
test "$(yq -r '.modules.endpoint[0] | has("route")' "$manifest")" = false
test "$(yq -r '.permissions.scopes | length' "$manifest")" = 2
test "$(yq -r '.permissions.scopes[]' "$manifest" | grep -cx 'read:jira-work')" = 1
test "$(yq -r '.resources[0].path' "$manifest")" = resources
test -f "$root/apps/forge/src/index.html"
grep -q 'src="./index.tsx"' "$root/apps/forge/src/index.html"
test -f "$root/apps/forge/src/index.tsx"
grep -q 'invokeRemote' "$root/apps/forge/src/index.tsx"
grep -q 'requestJira' "$root/apps/forge/src/index.tsx"
test "$(grep -c 'invoke(' "$root/apps/forge/src/index.tsx")" = 0
