#!/bin/sh
# Build a private local cluster; no external or Supabase database URLs are used.
set -eu
ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
for tool in initdb pg_ctl psql; do command -v "$tool" >/dev/null || { echo "PostgreSQL 15+ utilities are required ($tool)." >&2; exit 1; }; done
umask 077
TMPDB=$(mktemp -d "${TMPDIR:-/tmp}/school-db.XXXXXX")
cleanup() {
  if [ -s "$TMPDB/data/postmaster.pid" ]; then pg_ctl -w -D "$TMPDB/data" -m immediate stop >/dev/null; fi
  rm -rf -- "$TMPDB"
}
trap cleanup EXIT
trap 'exit 1' INT TERM
initdb -A trust --no-locale -D "$TMPDB/data" >/dev/null
pg_ctl -D "$TMPDB/data" -l "$TMPDB/server.log" -o "-k '$TMPDB' -c listen_addresses=''" -w start >/dev/null
export PGHOST="$TMPDB" PGDATABASE=postgres PGUSER="$(id -un)" PGPORT=5432
unset PGSERVICE PGSERVICEFILE
psql -X -v ON_ERROR_STOP=1 -1 -f "$ROOT/tests/school-security-bootstrap.sql" -f "$ROOT/supabase_setup.sql" -f "$ROOT/accounts_setup.sql" -f "$ROOT/accounts_setup.sql" >/dev/null
psql -X -v ON_ERROR_STOP=1 -f "$ROOT/tests/school-security.sql" >/dev/null
echo 'School authorization and invitation tests passed.'
