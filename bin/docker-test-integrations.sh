#!/bin/bash
# Back-compat wrapper — integrations now run against a 3-node Compose cluster.
set -euo pipefail
exec "$(dirname "$0")/rqlite-cluster.sh" test
