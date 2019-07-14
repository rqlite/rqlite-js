# Tests
The rqlite-js library has both unit tests and integration tests.  Unit tests have the `unit.js` extension and integration tests end with `integration.js`.

## Unit Tests
Development unit tests can be run using the following command:

```console
npm run test
```

These tests will all be run against the ES6 code and are used to check errors during development.  Once a build is complete tests can be run on the babelifed, ES5 code, with this command [./bin/docker-test-integrations.sh](../../bin/docker-test-integrations.sh).  The npm `test-build` task will run as part of the release process to prevent ES5 code which fails builds from being released.

## Integration Tests
There is a script to help with runnig docker integrations tests end to end just run the following command:

```console
./bin/docker-test-integrations.sh
```

The data API can be run through a series of integration test using the following command:

```console
./bin/docker-test-integrations.sh
```

during development.  This will spin up one docker container that will run npm install and build RQLiteJS plus an RQLiteJS server docker container.  The integration tests will run against the the built code and the RQLite server instance.  When the test complete pass or fail all containers are torn down.

If you are curious how to run each of the individual docker commands on your own you can checkout [bin/docker-test-integrations.sh](../../bin/docker-test-integrations.sh)
