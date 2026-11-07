# Tests

The rqlite-js library has both unit tests and integration tests. Unit tests have the `unit.js` extension and integration tests end with `integration.js`.

## Quality gate

Before commit, push, or npm publish:

```console
npm run verify
npm run verify:integrations
```

`verify` runs lint, type-check, ES6 unit tests, Babel build, and compiled `lib/` unit tests. `verify:integrations` builds Docker images and runs integrations against **rqlite 10.6.6**.

## Unit tests

Development unit tests (ES6 + `@babel/register`):

```console
npm run test
```

Compiled output unit tests (what consumers get):

```console
npm run build-all
npm run test-build
```

## Integration tests

End-to-end Docker integrations:

```console
npm run verify:integrations
# or
./bin/docker-test-integrations.sh
```

This builds the Node test image and an rqlite server container, runs `test-build-integrations` against the live server, then tears containers down.
