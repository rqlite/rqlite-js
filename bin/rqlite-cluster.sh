#!/usr/bin/env bash
# Fast lifecycle helpers for the Compose rqlite cluster used by integrations.
# Does not publish host ports; containers talk on the Compose network only.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROJECT="${RQLITEJS_COMPOSE_PROJECT:-rqlitejs}"
COMPOSE=(docker compose -p "$PROJECT" -f docker-compose.yml)
NODES=(rqlite-node-1 rqlite-node-2 rqlite-node-3)

usage () {
  cat <<'EOF'
Usage: bin/rqlite-cluster.sh <command>

Commands:
  up         Build images and start the 3-node cluster (detached)
  wait       Wait until all nodes are healthy and form a Raft cluster
  status     Show compose ps + /status ready/leader summary per node
  logs       Tail cluster logs (Ctrl+C to stop)
  test       up → wait → run integration tests → down (keeps volumes)
  destroy    Stop stack and delete volumes (clean bootstrap next time)
  down       Stop and remove containers (keeps volumes)
  restart    destroy + up + wait

Env:
  RQLITEJS_COMPOSE_PROJECT  Compose project name (default: rqlitejs)
EOF
}

compose () {
  "${COMPOSE[@]}" "$@"
}

cmd_up () {
  compose build
  compose up -d --remove-orphans rqlite-node-1 rqlite-node-2 rqlite-node-3
}

wait_http_ready () {
  local service="$1"
  local attempt
  for attempt in $(seq 1 60); do
    if compose exec -T "$service" wget -q -O - "http://127.0.0.1:4001/status" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "timeout waiting for HTTP on $service" >&2
  return 1
}

wait_cluster_formed () {
  local attempt body
  for attempt in $(seq 1 60); do
    body="$(compose exec -T rqlite-node-1 wget -q -O - "http://127.0.0.1:4001/status" 2>/dev/null || true)"
    if [[ -n "$body" ]] && printf '%s' "$body" | python3 -c '
import json,sys
d=json.load(sys.stdin)
store=d.get("store") or {}
if store.get("ready") is not True:
  raise SystemExit(1)
raft=store.get("raft") or {}
peers = raft.get("num_peers")
nodes = store.get("nodes") or store.get("servers") or []
has_peers = isinstance(peers, int) and peers >= 2
has_nodes = isinstance(nodes, list) and len(nodes) >= 3
# Cluster is formed when this node is ready and sees the other voters.
raise SystemExit(0 if (has_peers or has_nodes) else 1)
'; then
      return 0
    fi
    sleep 1
  done
  echo "timeout waiting for Raft cluster formation" >&2
  compose logs --no-color --tail=80 rqlite-node-1 rqlite-node-2 rqlite-node-3 || true
  return 1
}

cmd_wait () {
  local node
  for node in "${NODES[@]}"; do
    echo "waiting for $node HTTP..."
    wait_http_ready "$node"
  done
  echo "waiting for Raft cluster..."
  wait_cluster_formed
  echo "cluster ready"
}

cmd_status () {
  compose ps
  local node
  for node in "${NODES[@]}"; do
    echo "---- $node ----"
    compose exec -T "$node" wget -q -O - "http://127.0.0.1:4001/status?pretty" 2>/dev/null \
      | python3 -c '
import json,sys
try:
  d=json.load(sys.stdin)
  store=d.get("store") or {}
  print("ready:", store.get("ready"))
  print("leader:", store.get("leader"))
  print("raft:", store.get("raft"))
  print("nodes:", store.get("nodes") or store.get("servers"))
except Exception as e:
  print("parse error:", e)
' || echo "(status unavailable)"
  done
}

cmd_logs () {
  compose logs -f --tail=100 rqlite-node-1 rqlite-node-2 rqlite-node-3
}

cmd_down () {
  compose down --remove-orphans
}

cmd_destroy () {
  compose down --remove-orphans --volumes
}

cmd_test () {
  # Fresh volumes avoid stale single-node / prior-cluster state breaking bootstrap.
  cmd_destroy
  compose build
  compose up -d --remove-orphans rqlite-node-1 rqlite-node-2 rqlite-node-3
  cmd_wait
  compose run --rm test
  cmd_down
}

cmd_restart () {
  cmd_destroy
  cmd_up
  cmd_wait
}

main () {
  local cmd="${1:-}"
  case "$cmd" in
    up) cmd_up ;;
    wait) cmd_wait ;;
    status) cmd_status ;;
    logs) cmd_logs ;;
    test) cmd_test ;;
    down) cmd_down ;;
    destroy) cmd_destroy ;;
    restart) cmd_restart ;;
    -h|--help|help|"") usage; [[ -n "$cmd" ]] || exit 1 ;;
    *) echo "unknown command: $cmd" >&2; usage; exit 1 ;;
  esac
}

main "$@"
