#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
binary_path=$(mktemp "${TMPDIR:-/tmp}/modelorbit-ios-fixture.XXXXXX")
trap 'rm -f "$binary_path"' EXIT HUP INT TERM
swiftc -module-cache-path "${TMPDIR:-/tmp}/modelorbit-swift-cache" -parse-as-library \
  "$repo_root/devices/ios/Sources/ModelCatalog.swift" \
  "$repo_root/devices/ios/Sources/ModelAdapter.swift" \
  "$repo_root/devices/ios/Tests/FixtureSmoke.swift" \
  -o "$binary_path"
"$binary_path"
