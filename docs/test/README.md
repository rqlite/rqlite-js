# Tests

Unit tests are Jest files colocated as `src/**/*.test.ts`. Live-server smoke tests are `src/**/*.integration.test.ts`.

## Quality gate

Before commit, push, or npm publish:

```console
npm run verify
npm run verify:integrations
```

`verify` runs lint, type-check, unit tests, tsdown build, and pack checks (`publint` / `attw`). `verify:integrations` brings up a **3-node rqlite 10.6.6** Docker Compose cluster, waits for Raft, runs Jest integrations, then tears the stack down.

## Unit tests

```console
npm run test
```

After build (same Jest suite; confirms nothing regressed post-compile):

```console
npm run build
npm run test-build
```

## Integration tests (3-node cluster)

End-to-end Docker integrations against an automatic-bootstrap cluster (no host port publishes — containers stay on the Compose network):

```console
npm run verify:integrations
# or
./bin/rqlite-cluster.sh test
```

### Cluster lifecycle helpers

```console
npm run cluster:up        # build + start 3 nodes (detached)
npm run cluster:wait      # wait until HTTP healthy + Raft formed
npm run cluster:status    # compose ps + /status summary
npm run cluster:logs      # tail node logs
npm run cluster:down      # stop containers (keep volumes)
npm run cluster:destroy   # stop + delete volumes (clean bootstrap)
npm run cluster:restart   # destroy → up → wait
```

Shared TypeScript helpers live in `src/test/cluster.ts` (`waitForClusterReady`, leader/follower helpers). The test container sets:

`RQLITE_HOSTS=http://rqlite-node-1:4001,http://rqlite-node-2:4001,http://rqlite-node-3:4001`

The Docker test image uses Node 24, runs `tsdown`, then Jest against the cluster.
