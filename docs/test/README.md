# Tests
The rqlite-js library has both unit tests and integration tests.  Unit tests have the `unit.js` extension and integration test end with `integration.js`.

## Unit Tests
Development unit tests can be run using the following command `npm run test`.  These tests will all be run against the ES6 code and are used to check errors during development.  Once a build is complete tests can be run on the babelifed, ES5 code, with this command `npm run test-build`.  The test-build task will run as part of the release process to prevent failing builds from being able to be released.

## Integration Tests
The data API can be run through a series of integration test using the following command `npm run test-integrations` during development.  Please note that you will need a copy of rqlite running to be able to exercise these tests. If you need a quick way to spin up rqlite checkout the [docker image] (https://hub.docker.com/r/rqlite/rqlite/).  The integration test by default attempt to connect to a server at `http://localhost:4001`, but you can override the URL value using the `RQLITE_URL` environment variable e.g. `RQLITE_URL=http://10.0.0.1:4001 npm run test-integrations`. Integration tests can be run on post build code as well by running the command `npm run test-build-integrations`.
