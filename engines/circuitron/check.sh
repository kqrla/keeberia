#!/usr/bin/env bash
# circuitron build check: typecheck, then every suite, one command.
#
# why this exists: tsx strips types, so a file that imports a symbol nobody
# exports, reads a field its own interface dropped, or passes a string where a
# list is expected runs green all day. the typecheck step is what catches those,
# and it caught seven of them on the day this script was written.
#
# tsc is not vendored (the repo carries no package.json by design), so the
# typecheck runs against whatever typescript is reachable: $TSC, then a local
# node_modules, then the npx cache. absent everywhere, it says so and moves on
# rather than failing the build for a missing dev tool.
#
# usage: engines/circuitron/check.sh [--no-typecheck]

set -uo pipefail
cd "$(dirname "$0")" || exit 1

fail=0
failures=()

say() { printf '%s\n' "$*"; }

# ── 1. typecheck ────────────────────────────────────────────────────────────
if [ "${1:-}" = "--no-typecheck" ]; then
  say "typecheck  SKIPPED (asked)"
else
  tsc_bin="${TSC:-}"
  if [ -z "$tsc_bin" ]; then
    for c in ./node_modules/.bin/tsc ../../node_modules/.bin/tsc /tmp/tscheck/node_modules/.bin/tsc; do
      [ -x "$c" ] && { tsc_bin="$c"; break; }
    done
  fi
  type_roots=""
  [ -d /tmp/tscheck/node_modules/@types ] && type_roots="--typeRoots /tmp/tscheck/node_modules/@types --types node"

  if [ -n "$tsc_bin" ]; then
    out=$($tsc_bin --noEmit --strict --target es2022 --module esnext \
      --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck \
      $type_roots src/*.ts 2>&1)
    n=$(printf '%s' "$out" | grep -c "error TS")
    if [ "$n" -eq 0 ]; then
      say "typecheck  clean"
    else
      say "typecheck  $n error(s)"
      printf '%s\n' "$out" | grep "error TS" | sed 's/^/           /'
      fail=1
      failures+=("typecheck")
    fi
  else
    say "typecheck  SKIPPED (no tsc reachable: set TSC=/path/to/tsc)"
  fi
fi

# ── 2. suites ───────────────────────────────────────────────────────────────
for t in run budget edge fab scene3d export3d step validate gerber render firmware freeroute; do
  [ -f "test/$t.ts" ] || continue
  out=$(timeout 400 npx tsx "test/$t.ts" 2>&1)
  code=$?
  last=$(printf '%s' "$out" | tail -1 | cut -c1-84)
  if [ "$code" -eq 0 ]; then
    printf '%-10s ok    %s\n' "$t" "$last"
  else
    printf '%-10s FAIL  %s\n' "$t" "$last"
    printf '%s\n' "$out" | tail -12 | sed 's/^/           /'
    fail=1
    failures+=("$t")
  fi
done

say ""
if [ "$fail" -eq 0 ]; then
  say "circuitron: build clean"
else
  say "circuitron: ${#failures[@]} failing step(s): ${failures[*]}"
fi
exit "$fail"
