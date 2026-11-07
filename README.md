# rqlite-js · [![npm version](https://img.shields.io/npm/v/rqlite-js.svg?style=flat)](https://www.npmjs.com/package/rqlite-js) · [![CI](https://github.com/rqlite/rqlite-js/actions/workflows/ci.yml/badge.svg)](https://github.com/rqlite/rqlite-js/actions/workflows/ci.yml)

A promise-based TypeScript/JavaScript client for [rqlite](https://rqlite.io) — the lightweight, distributed database built on SQLite. It speaks the HTTP API (`/db/query`, `/db/execute`, `/db/backup`, `/status`) and returns structured results you can use in Node or the browser.

**This package does not generate SQL.** Pass SQL strings (or rqlite parameterized statement arrays). Build those strings however you like — by hand, or with any SQL builder you choose.

**Prefer parameterized statements for anything that includes user or external input.** Interpolating values into SQL strings (`WHERE name = "${name}"`) risks SQL injection. Use rqlite’s bound-parameter form (`[["SELECT … WHERE name = ?", name]]`) or equivalent bindings from your own SQL tooling. Treat string-concatenated SQL as unsafe unless the values are strictly trusted constants you control.

**Requirements:** Node.js `>= 20.19`. **Zero runtime dependencies** (native `fetch`). Types ship in-box. CI tests Node 20–24; Docker integrations use Node 24 against a **3-node rqlite 10.x cluster** (`rqlite/rqlite:10.6.6`).

Upgrading from v2? See [docs/MIGRATION-v2-to-v3.md](docs/MIGRATION-v2-to-v3.md).

Official rqlite docs:

- [Accessing rqlite (HTTP API)](https://rqlite.io/docs/api/api/)
- [Read consistency](https://rqlite.io/docs/api/read-consistency/)
- [Bulk writes](https://rqlite.io/docs/api/bulk-api/)
- [Backup and restore](https://rqlite.io/docs/guides/backup/)
- [Monitoring / status](https://rqlite.io/docs/guides/monitoring-rqlite/)

## Features

- Dual **ESM + CJS** builds with TypeScript declarations (import from `rqlite-js` only — no deep paths)
- Native `fetch` HTTP (optional undici `Dispatcher` for keepalive)
- Follow 301/302 redirects to the leader; round-robin hosts for non-leader reads
- Single or bulk `query` / `execute`, parameterized statements, consistency levels, transactions
- `DataResults` helpers (`get`, `toObject`, `toArray`, `hasError`, `getFirstError` / `error_v2`)
- Backup / restore streams and `/status` clients

## Install

```bash
npm install rqlite-js
```

```javascript
// ESM
import { DataApiClient } from 'rqlite-js'

// CommonJS
const { DataApiClient } = require('rqlite-js')
```

Consumers get **no transitive runtime packages**. Build tooling stays in this repo’s `devDependencies` only.

## Quick start

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')

await dataApiClient.execute(
  'CREATE TABLE IF NOT EXISTS foo (id INTEGER NOT NULL PRIMARY KEY, name TEXT)',
)
const insert = await dataApiClient.execute('INSERT INTO foo(name) VALUES("fiona")')
if (insert.hasError()) {
  throw insert.getFirstError()
}
const id = insert.get(0).getLastInsertId()
const select = await dataApiClient.query(`SELECT id, name FROM foo WHERE id=${id}`)
console.log(select.get(0).toObject()) // { id: 1, name: 'fiona' }
```

## Optional: building SQL with Knex (not included)

**Knex is not part of `rqlite-js`.** It is an optional third-party dependency you may install separately if you want a query builder. This repo does not depend on or bundle Knex. The examples below are for illustration only.

`rqlite-js` only accepts SQL (or rqlite’s parameterized JSON form). If you use [Knex](https://knexjs.org/), generate SQL with it, then pass that into this client. You do **not** need a Knex connection pool to rqlite — configure the SQLite dialect for SQL generation only.

```bash
npm install knex   # optional — only if you want Knex in your app
```

```javascript
import knex from 'knex' // your app's dependency, not rqlite-js
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')

// Dialect only — no DB connection. SQLite placeholders (?) match rqlite.
const qb = knex({ client: 'sqlite3' })

async function execBuilder (builder) {
  const { sql, bindings } = builder.toSQL()
  // Safer than toQuery(): keep values as bound parameters
  return dataApiClient.execute([[sql, ...bindings]])
}

async function queryBuilder (builder, options) {
  const { sql, bindings } = builder.toSQL()
  return dataApiClient.query([[sql, ...bindings]], options)
}

await execBuilder(
  qb.schema.createTableIfNotExists('foo', (table) => {
    table.increments('id').primary()
    table.text('name')
  }),
)

await execBuilder(qb('foo').insert({ name: 'fiona' }))

const rows = await queryBuilder(
  qb('foo').select('id', 'name').where('name', 'fiona').limit(10),
)
console.log(rows.toArray()) // [{ id: 1, name: 'fiona' }]
```

Bulk inserts from Knex builders (same idea — Knex stays in your app):

```javascript
const statements = ['fiona', 'justin'].map((name) => {
  const { sql, bindings } = qb('foo').insert({ name }).toSQL()
  return [sql, ...bindings]
})
await dataApiClient.execute(statements, { transaction: true })
```

Fully interpolated SQL via Knex `toQuery()` works with plain string `execute` / `query`, but **prefer `toSQL()` + bindings** whenever values are not compile-time constants:

```javascript
// OK only when every value is trusted (e.g. fixed id in your own code)
const sql = qb('foo').where('id', 1).select('*').toQuery()
await dataApiClient.query(sql)
```


## DataApiClient

Access the [data API](https://rqlite.io/docs/api/api/). By default methods return a `DataResults` instance. Pass `{ raw: true }` to get `{ status, body }` instead.

### Methods

- `query(sql, options)` — read via HTTP GET (or POST when `sql` is an array / parameterized batch)
- `execute(sql, options)` — write via HTTP POST (`sql` may be a string, string array, or parameterized nested arrays)

### Parameterized statements (recommended for safety)

rqlite accepts bound parameters as nested JSON arrays. The client forwards them as-is. **This is the safest way to pass dynamic values** — the server binds parameters separately from the SQL text, so user input cannot change the statement structure.

```javascript
// Safe: values are parameters, not concatenated into the SQL string
const name = req.body.name // untrusted input
await dataApiClient.execute([
  ['INSERT INTO foo(name, age) VALUES(?, ?)', name, 36],
])

const results = await dataApiClient.query([
  ['SELECT name, age FROM foo WHERE name = ?', name],
])
console.log(results.get(0).toObject())
```

```javascript
// Unsafe: do not build SQL by string interpolation with untrusted data
// await dataApiClient.query(`SELECT * FROM foo WHERE name = "${name}"`)
```

**Security tips for npm consumers:**

- Use parameterized statements (or your SQL builder’s bound parameters, e.g. Knex `toSQL()` if you use it) for all request/query-string/body values.
- Never concatenate untrusted input into SQL identifiers either (table/column names). Keep those as fixed allow-lists in your app code.
- `{ transaction: true }` / `{ atomic: true }` help with atomicity, not injection — they do not replace parameterization.
- Review any helper that calls `.toQuery()` or similar “print full SQL” APIs; those embed values into the string and are only appropriate for trusted constants.

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

### Bulk statements and transactions

Send multiple statements in one HTTP request as a JSON array. Use `{ atomic: true }` (rqlite v5+) or `{ transaction: true }` to wrap them in a SQLite transaction (failed batches roll back when `transaction` is set).

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
const sql = [
  'INSERT INTO foo(name) VALUES("fiona")',
  'INSERT INTO foo(name) VALUES("justin")',
]
const dataResults = await dataApiClient.execute(sql, { transaction: true })
if (dataResults.hasError()) {
  throw dataResults.getFirstError()
}
console.log(dataResults.get(0).getLastInsertId())
console.log(dataResults.get(1).getLastInsertId())
```

Bulk **reads** use the same array form (HTTP POST):

```javascript
const dataResults = await dataApiClient.query([
  'SELECT name FROM foo WHERE id = 1',
  'SELECT COUNT(*) AS total FROM foo',
])
```

### Paging large reads

rqlite has no separate cursor API — page in SQL with `LIMIT` / `OFFSET` (or the equivalent helpers in whatever SQL builder you use):

```javascript
const pageSize = 50
for (let offset = 0; ; offset += pageSize) {
  const page = await dataApiClient.query(
    `SELECT id, name FROM foo ORDER BY id LIMIT ${pageSize} OFFSET ${offset}`,
  )
  const rows = page.toArray()
  if (rows.length === 0) break
  console.log(rows)
  if (rows.length < pageSize) break
}
```

### Results shape notes

- One SELECT with **N value rows** → N `DataResult` entries (`toArray()` / `get(i)`).
- A SELECT with **no matching rows** often omits `values`; this client then yields a single empty `DataResult` (`toObject()` → `{}`). Check `toArray()` / column getters rather than assuming `getResults().length === 0`.
- Aggregates like `COUNT(*)` still return one row object.

Map rows into plain objects or your own types with `toObject()` / `toArray()` — Knex has no model layer, and this client does not integrate with ORMs:

```javascript
const dataResults = await dataApiClient.query('SELECT id, name FROM foo')
const rows = dataResults.toArray() // [{ id: 1, name: 'fiona' }, ...]

// Optional: map into your app's types
const users = rows.map((row) => ({ id: row.id, displayName: row.name }))
```

### Consistency

```javascript
import {
  DataApiClient,
  CONSISTENCY_LEVEL_NONE,
  CONSISTENCY_LEVEL_WEAK,
  CONSISTENCY_LEVEL_STRONG,
  CONSISTENCY_LEVEL_LINEARIZABLE,
} from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
const dataResults = await dataApiClient.query(
  'SELECT name FROM foo WHERE id=1',
  { level: CONSISTENCY_LEVEL_STRONG },
)
```

Levels: `none`, `weak` (default), `strong`, `linearizable`. See [read consistency](https://rqlite.io/docs/api/read-consistency/). On a single node, all levels succeed; choose based on your cluster topology.

Optional flags: `{ timings: true }` (response timing fields), `{ pretty: true }` (pretty-printed JSON from the server).

### Errors (`error` and `error_v2`)

Failed statements use the legacy `error` string. On rqlite v10+, structured `error_v2` is also exposed:

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
import { Agent } from 'undici'
import { DataApiClient } from 'rqlite-js'

const dispatcher = new Agent({ keepAliveTimeout: 10_000 })

const dataApiClient = new DataApiClient(
  ['http://localhost:4001', 'http://localhost:4002', 'http://localhost:4003'],
  {
    // undici Dispatcher (has .dispatch) — used by native fetch for keepalive pools
    httpAgent: dispatcher,
    httpsAgent: dispatcher,
    retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
    retryableErrorCodes: new Set(['ECONNRESET', 'ETIMEDOUT']),
    retryableHttpMethods: new Set(['GET', 'POST']),
    retries: 0, // disable retries
  },
)
```

Hosts may also be a comma-separated string: `'http://localhost:4001,http://localhost:4002'`. Classic `http.Agent` / `https.Agent` option names remain for API compatibility; pass an undici `Dispatcher` when you need fetch keepalive.

## StatusApiClient

```javascript
import { StatusApiClient } from 'rqlite-js'

const statusApiClient = new StatusApiClient('http://localhost:4001')
const { status, body } = await statusApiClient.status()
console.log(status, body.store?.ready)

const all = await statusApiClient.statusAllHosts()
all.forEach(({ host, response }) => {
  console.log(host, response.body?.store?.ready)
})
```

See [Monitoring rqlite](https://rqlite.io/docs/guides/monitoring-rqlite/).

## BackupApiClient

Backup/load return Node `Readable` streams.

```javascript
import { BackupApiClient, BACKUP_DATA_FORMAT_SQL } from 'rqlite-js'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'

const backupApiClient = new BackupApiClient('http://localhost:4001')

// Binary SQLite dump (default):
const backupStream = await backupApiClient.backup()
await pipeline(backupStream, createWriteStream('backup.sqlite'))

// SQL text backup:
const sqlStream = await backupApiClient.backup(BACKUP_DATA_FORMAT_SQL)

// Restore from SQL buffer/string:
await backupApiClient.load(
  Buffer.from('CREATE TABLE foo (id INTEGER PRIMARY KEY); INSERT INTO foo DEFAULT VALUES;'),
  BACKUP_DATA_FORMAT_SQL,
)
```

See [Backup and restore](https://rqlite.io/docs/guides/backup/).

## Package surface (npm)

| Item | Detail |
|------|--------|
| Import | `rqlite-js` only (ESM + CJS) |
| Types | Bundled `.d.ts` / `.d.cts` — no `@types/rqlite-js` |
| Runtime deps | None |
| Engines | `node >= 20.19` |
| Published | `dist/` (runtime) + `src/` (TypeScript sources for debugging) |

## Releases

Versions and `CHANGELOG.md` are managed with [release-please](https://github.com/googleapis/release-please). Merging the release PR creates a GitHub Release; release-please then dispatches [`npm-publish.yml`](.github/workflows/npm-publish.yml), which re-runs the full suite (including Docker integrations) and runs [`npm stage publish`](https://docs.npmjs.com/staged-publishing/) via [trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). The trusted publisher on npmjs.com must list workflow filename `npm-publish.yml`. A maintainer must approve the staged version with 2FA on npmjs.com (or `npm stage approve <id>`) before it goes live.

**Local quality gate (required before commit/push/publish):**

```bash
npm run verify                 # lint, type-check, unit, build, pack checks
npm run verify:integrations    # 3-node Docker cluster + rqlite 10.6.6 integrations
```

## Contributing / testing

See [docs/test/README.md](docs/test/README.md).
