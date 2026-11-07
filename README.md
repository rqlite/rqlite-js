# rqlite-js · [![npm version](https://img.shields.io/npm/v/rqlite-js.svg?style=flat)](https://www.npmjs.com/package/rqlite-js) · [![CI](https://github.com/rqlite/rqlite-js/actions/workflows/ci.yml/badge.svg)](https://github.com/rqlite/rqlite-js/actions/workflows/ci.yml)

A promise-based client library for [rqlite](https://rqlite.io), the lightweight, distributed database built on SQLite. Clients mirror the HTTP API endpoints (`/db/query`, `/db/execute`, `/db/backup`, `/status`). This package does not generate SQL—use your own SQL strings or another SQL builder.

**Requirements:** Node.js `>= 18`. CI tests Node 18–24 on `ubuntu-latest`; Docker integrations use Node 24. Tested against **rqlite 10.x** (Docker image `rqlite/rqlite:10.6.6`).

See the official docs:

- [Accessing rqlite (HTTP API)](https://rqlite.io/docs/api/api/)
- [Read consistency](https://rqlite.io/docs/api/read-consistency/)
- [Backup and restore](https://rqlite.io/docs/guides/backup/)
- [Monitoring / status](https://rqlite.io/docs/guides/monitoring-rqlite/)

## Features

- Follow 301/302 redirects from followers to the leader
- Round-robin host balancing for non-leader reads
- HTTP keepalive via `http` / `https` agents
- Unit and Docker integration tests

## Install

```bash
npm install rqlite-js
```

## Quick start

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')

await dataApiClient.execute('CREATE TABLE IF NOT EXISTS foo (id INTEGER NOT NULL PRIMARY KEY, name TEXT)')
const insert = await dataApiClient.execute('INSERT INTO foo(name) VALUES("fiona")')
if (insert.hasError()) {
  throw insert.getFirstError()
}
const id = insert.get(0).getLastInsertId()
const select = await dataApiClient.query(`SELECT id, name FROM foo WHERE id=${id}`)
console.log(select.get(0).toObject()) // { id: 1, name: 'fiona' }
```

## DataApiClient

Access the [data API](https://rqlite.io/docs/api/api/) (`query` / `execute`). By default methods return a `DataResults` instance. Pass `{ raw: true }` to get `{ status, body }` instead.

### Methods

- `query(sql, options)` — read via HTTP GET (or POST when `sql` is an array)
- `execute(sql, options)` — write via HTTP POST (`sql` may be a string or string array)

### Create table

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
const dataResults = await dataApiClient.execute(
  'CREATE TABLE foo (id INTEGER NOT NULL PRIMARY KEY, name TEXT)',
)
if (dataResults.hasError()) {
  console.error(dataResults.getFirstError())
} else {
  console.log(dataResults.toArray())
}

// Raw HTTP response shape from this client:
const { status, body } = await dataApiClient.execute(
  'CREATE TABLE IF NOT EXISTS bar (id INTEGER NOT NULL PRIMARY KEY)',
  { raw: true },
)
console.log(status, body)
```

### Insert, select, update

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')

let dataResults = await dataApiClient.execute('INSERT INTO foo(name) VALUES("fiona")')
if (dataResults.hasError()) {
  throw dataResults.getFirstError()
}
const id = dataResults.get(0).getLastInsertId()

dataResults = await dataApiClient.query(`SELECT id, name FROM foo WHERE id=${id}`)
console.log(dataResults.get(0).get('name')) // fiona
console.log(dataResults.get(0).toObject()) // { id: 1, name: 'fiona' }

dataResults = await dataApiClient.execute('UPDATE foo SET name="justin" WHERE name="fiona"')
console.log(dataResults.get(0).getRowsAffected()) // 1
```

### Transactions (rqlite v5+)

Use `{ atomic: true }` for a single transaction ([API docs](https://rqlite.io/docs/api/api/)). Legacy `{ transaction: true }` remains for older rqlite v4 servers.

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
const sql = [
  'INSERT INTO foo(name) VALUES("fiona")',
  'INSERT INTO foo(name) VALUES("justin")',
]
const dataResults = await dataApiClient.execute(sql, { atomic: true })
if (dataResults.hasError()) {
  throw dataResults.getFirstError()
}
console.log(dataResults.get(0).getLastInsertId())
console.log(dataResults.get(1).getLastInsertId())
```

### Consistency

```javascript
import { DataApiClient, CONSISTENCY_LEVEL_STRONG } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
const dataResults = await dataApiClient.query(
  'SELECT name FROM foo WHERE id=1',
  { level: CONSISTENCY_LEVEL_STRONG },
)
```

See [read consistency](https://rqlite.io/docs/api/read-consistency/) for `none`, `weak`, `strong`, and `linearizable`.

### Errors (`error` and `error_v2`)

Failed statements still use the legacy `error` string. On rqlite v10+, structured `error_v2` is also exposed:

```javascript
const dataResults = await dataApiClient.execute('INSERT INTO nonsense')
if (dataResults.hasError()) {
  const err = dataResults.getFirstError()
  console.error(err.message)
  console.error(err.getErrorV2()) // { message, sqlite: { code, extended_code } } when present
  console.error(err.toObject())
}
```

### Authentication

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001', {
  authentication: {
    username: 'rqliteUsername',
    password: 'rqlitePassword',
  },
})
```

### Client options (hosts, agents, retries)

```javascript
import http from 'http'
import https from 'https'
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient(
  ['http://localhost:4001', 'http://localhost:4002', 'http://localhost:4003'],
  {
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    // Optional retry customization:
    retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
    retryableErrorCodes: new Set(['ECONNRESET', 'ETIMEDOUT']),
    retryableHttpMethods: new Set(['GET', 'POST']),
    retries: 0, // disable retries
  },
)
```

Hosts may also be a comma-separated string: `'http://localhost:4001,http://localhost:4002'`.

## StatusApiClient

```javascript
import { StatusApiClient } from 'rqlite-js'

const statusApiClient = new StatusApiClient('http://localhost:4001')
const { status, body } = await statusApiClient.status()
console.log(status, body.store?.ready)

// One status call per configured host:
const all = await statusApiClient.statusAllHosts()
all.forEach(({ host, response }) => {
  console.log(host, response.body?.store?.ready)
})
```

See [Monitoring rqlite](https://rqlite.io/docs/guides/monitoring-rqlite/).

## BackupApiClient

```javascript
import { BackupApiClient, BACKUP_DATA_FORMAT_SQL } from 'rqlite-js'

const backupApiClient = new BackupApiClient('http://localhost:4001')

// Binary SQLite backup stream (default):
const backupStream = await backupApiClient.backup()

// SQL text backup:
const sqlStream = await backupApiClient.backup(BACKUP_DATA_FORMAT_SQL)

// Restore from SQL buffer/string:
await backupApiClient.load(
  Buffer.from('CREATE TABLE foo (id INTEGER PRIMARY KEY);'),
  BACKUP_DATA_FORMAT_SQL,
)
```

See [Backup and restore](https://rqlite.io/docs/guides/backup/).

## Releases

Versions and `CHANGELOG.md` are managed with [release-please](https://github.com/googleapis/release-please). Merging the release PR creates a GitHub Release; the publish workflow re-runs the full test suite (including Docker integrations) then publishes via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC — no long-lived `NPM_TOKEN`).

**Local quality gate (required before commit/push/publish):**

```bash
npm run verify                 # lint, type-check, unit, build, compiled unit
npm run verify:integrations    # Docker + rqlite 10.6.6 integrations
```

## Contributing / testing

See [docs/test/README.md](docs/test/README.md).
