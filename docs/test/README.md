# Tests

Unit tests are Jest files colocated as `src/**/*.test.ts`. Live-server smoke tests are `src/**/*.integration.test.ts`.

## Quality gate

Before commit, push, or npm publish:

```console
npm run verify
npm run verify:integrations
```

`verify` runs lint, type-check, unit tests, tsdown build, and pack checks (`publint` / `attw`). `verify:integrations` builds Docker images and runs integrations against **rqlite 10.6.6**.

## Unit tests

```console
npm run test
```

After build (same Jest suite; confirms nothing regressed post-compile):

```console
npm run build
npm run test-build
```

## Integration tests

End-to-end Docker integrations:

```console
npm run verify:integrations
# or
./bin/docker-test-integrations.sh
```

The Docker test image uses Node 24, runs `tsdown`, then Jest integration tests against the rqlite container.
