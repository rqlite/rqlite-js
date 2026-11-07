import http from 'http'
import https from 'https'
import { Readable } from 'node:stream'
import {
  PATH_EXECUTE,
  PATH_QUERY,
  CONSISTENCY_LEVEL_NONE,
  CONSISTENCY_LEVEL_WEAK,
  CONSISTENCY_LEVEL_STRONG,
  CONSISTENCY_LEVEL_LINEARIZABLE,
} from './api/data'
import { PATH_LOAD, PATH_BACKUP, BACKUP_DATA_FORMAT_SQL } from './api/backup'
import { PATH_STATUS } from './api/status'
import { DataApiClient, BackupApiClient, StatusApiClient } from '.'
import { DataResults } from './api/results'
import type { HttpResponse } from './http-request'
import { DEFAULT_RQLITE_HOST, ENV_RQLITE_HOSTS } from './test/env'

/**
 * The RQLite host for integration tests, which can be changed
 * using the RQLITE_HOSTS environment variable or defaults to
 * http://localhost:4001
 */
const HOST = process.env[ENV_RQLITE_HOSTS] || DEFAULT_RQLITE_HOST

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

async function sleep (ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function asDataResults (value: DataResults | HttpResponse): DataResults {
  if (value instanceof DataResults) {
    return value
  }
  throw new Error('Expected DataResults instance')
}

function asHttpResponse (value: DataResults | HttpResponse): HttpResponse {
  if (value && typeof value === 'object' && 'status' in value && 'body' in value) {
    return value as HttpResponse
  }
  throw new Error('Expected raw HttpResponse')
}

/**
 * Capture stream data and resolve with a Buffer
 */
function handleRequestStreamAsPromise (request: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let result = Buffer.alloc(0)
    request
      .on('data', (data) => {
        result = Buffer.concat([result, data])
      })
      .on('end', () => resolve(result))
      .on('error', reject)
  })
}

describe('api status client', () => {
  const statusApiClient = new StatusApiClient(HOST, { httpAgent, httpsAgent })

  async function checkRqliteServerReady (backoffBase = 500, max = 10) {
    let lastError: unknown
    for (let attempt = 0; attempt < max; attempt += 1) {
      try {
        const status = await statusApiClient.statusAllHosts()
        const ready = status.map((v) => (v.response?.body as { store?: { ready?: boolean } })?.store?.ready)
          .every((v) => v === true)
        if (!ready) {
          throw new Error('All stores are not ready')
        }
        return status
      } catch (error) {
        lastError = error
        await sleep(backoffBase)
      }
    }
    throw lastError
  }

  beforeAll(() => checkRqliteServerReady())

  describe('should get status response', () => {
    it(`should call ${HOST}${PATH_STATUS} and return status body fields`, async () => {
      const { body } = await statusApiClient.status()
      expect(typeof body).toBe('object')
      expect(body).toHaveProperty('build')
      expect(body).toHaveProperty('http')
      expect(body).toHaveProperty('node')
      expect(body).toHaveProperty('runtime')
      expect(body).toHaveProperty('store')
    })

    it(`should call statusAllHosts and return one entry for ${HOST}`, async () => {
      const all = await statusApiClient.statusAllHosts()
      expect(all).toHaveLength(1)
      expect(all[0].host).toEqual(HOST)
      expect(all[0].response.status).toBeGreaterThanOrEqual(200)
      expect(all[0].response.body).toHaveProperty('store')
    })
  })
})

describe('api data client', () => {
  const dataApiClient = new DataApiClient(HOST, { httpAgent, httpsAgent })

  afterAll(async () => {
    await dataApiClient.execute('DROP TABLE IF EXISTS foo')
  })

  describe('create table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and create table named foo`, async () => {
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.getResults()).toHaveLength(1)
    })
  })

  describe('insert one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and insert a record with the name fiona`, async () => {
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      const dataResult = dataResults.get(0)
      expect(dataResult).toBeDefined()
      expect(dataResult!.getRowsAffected()).toEqual(1)
      expect(dataResult!.getLastInsertId()).toEqual(1)
    })

    it(`should call ${HOST}${PATH_QUERY} and select a record with the name fiona`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="fiona"'
      const dataResults = asDataResults(await dataApiClient.query(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('name')).toEqual('fiona')
    })
  })

  describe('update one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and update the record with the name fiona to the name justin`, async () => {
      const sql = 'UPDATE foo SET name="justin" WHERE name="fiona"'
      const dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.getRowsAffected()).toEqual(1)
    })

    it(`should call ${HOST}${PATH_QUERY} and select a record with the name justin`, async () => {
      const sql = 'SELECT name FROM foo WHERE name="justin"'
      const dataResults = asDataResults(await dataApiClient.query(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('name')).toEqual('justin')
    })
  })

  describe('delete one row', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and delete a record with the name justin`, async () => {
      const sql = 'DELETE FROM foo WHERE name="justin"'
      const dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.getRowsAffected()).toEqual(1)
    })

    it(`should call ${HOST}${PATH_QUERY} and select a count of foo item that has a result of zero`, async () => {
      const sql = 'SELECT COUNT(id) AS idCount FROM foo'
      const dataResults = asDataResults(await dataApiClient.query(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('idCount')).toEqual(0)
    })
  })

  describe('insert multiple rows', () => {
    const total = 100
    const dataList = Array(total).fill(0)

    it(`should call ${HOST}${PATH_EXECUTE} and insert records using an atomic transaction`, async () => {
      const sql = dataList.map((_v, i) => `INSERT INTO foo(name) VALUES("justin-${i}")`)
      const dataResults = asDataResults(await dataApiClient.execute(sql, { atomic: true }))
      expect(dataResults.getFirstError()).toBeUndefined()
      dataList.forEach((_v, i) => {
        const dataResult = dataResults.get(i)
        expect(dataResult).toBeDefined()
        expect(dataResult!.getRowsAffected()).toEqual(1)
        expect(dataResult!.getLastInsertId()).toEqual(i + 1)
      })
    })

    it(`should call ${HOST}${PATH_QUERY} and select a count of foo items`, async () => {
      const sql = 'SELECT COUNT(*) AS total FROM foo WHERE name like("justin-%")'
      const dataResults = asDataResults(await dataApiClient.query(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('total')).toEqual(total)
    })

    it(`should call ${HOST}${PATH_QUERY} with a bulk SELECT array`, async () => {
      const sql = dataList.map((_v, i) => `SELECT name FROM foo WHERE name="justin-${i}"`)
      const dataResults = asDataResults(await dataApiClient.query(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      dataList.forEach((_v, i) => {
        expect(dataResults.get(i)!.get('name')).toEqual(`justin-${i}`)
      })
    })
  })

  describe('drop the table', () => {
    it(`should call ${HOST}${PATH_EXECUTE} and drop the table foo`, async () => {
      const sql = 'DROP TABLE foo'
      const dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.getRowsAffected()).toEqual(1)
    })
  })
})

describe('api data client SQL patterns', () => {
  const dataApiClient = new DataApiClient(HOST, { httpAgent, httpsAgent })
  const TABLE = 'foo_patterns'

  beforeAll(async () => {
    await dataApiClient.execute(`DROP TABLE IF EXISTS ${TABLE}`)
    await dataApiClient.execute(
      `CREATE TABLE ${TABLE} (
        id INTEGER NOT NULL PRIMARY KEY,
        name TEXT,
        age INTEGER,
        note TEXT
      )`,
    )
  })

  afterAll(async () => {
    await dataApiClient.execute(`DROP TABLE IF EXISTS ${TABLE}`)
  })

  describe('parameterized statements', () => {
    it('should execute a parameterized INSERT through the JSON array form', async () => {
      const dataResults = asDataResults(await dataApiClient.execute([
        [`INSERT INTO ${TABLE}(name, age, note) VALUES(?, ?, ?)`, 'ada', 36, null],
      ] as unknown as string[]))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.getRowsAffected()).toEqual(1)
      expect(dataResults.get(0)!.getLastInsertId()).toEqual(1)
    })

    it('should query with a parameterized SELECT', async () => {
      const dataResults = asDataResults(await dataApiClient.query([
        [`SELECT name, age, note FROM ${TABLE} WHERE name = ?`, 'ada'],
      ] as unknown as string[]))
      expect(dataResults.getFirstError()).toBeUndefined()
      const row = dataResults.get(0)!
      expect(row.get('name')).toEqual('ada')
      expect(row.get('age')).toEqual(36)
      expect(row.get('note')).toBeNull()
    })
  })

  describe('bulk execute without atomic', () => {
    it('should apply independent statements when atomic is omitted', async () => {
      const dataResults = asDataResults(await dataApiClient.execute([
        `INSERT INTO ${TABLE}(name, age) VALUES("grace", 40)`,
        `INSERT INTO ${TABLE}(name, age) VALUES("alan", 41)`,
      ]))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.getResults()).toHaveLength(2)
      expect(dataResults.get(0)!.getRowsAffected()).toEqual(1)
      expect(dataResults.get(1)!.getRowsAffected()).toEqual(1)
    })
  })

  describe('transaction rollback', () => {
    it('should roll back the whole batch when one statement fails with transaction true', async () => {
      const before = asDataResults(await dataApiClient.query(
        `SELECT COUNT(*) AS total FROM ${TABLE}`,
      ))
      const beforeTotal = before.get(0)!.get('total') as number

      // Prefer transaction= for SQLite rollback semantics on mixed success/failure batches
      const dataResults = asDataResults(await dataApiClient.execute([
        `INSERT INTO ${TABLE}(name, age) VALUES("should-roll-back", 1)`,
        'INSERT INTO this_table_does_not_exist(name) VALUES("nope")',
      ], { transaction: true }))
      expect(dataResults.hasError()).toBe(true)
      expect(dataResults.getFirstError()).toBeDefined()

      const after = asDataResults(await dataApiClient.query(
        `SELECT COUNT(*) AS total FROM ${TABLE}`,
      ))
      expect(after.get(0)!.get('total')).toEqual(beforeTotal)
    })
  })

  describe('empty and multi-row SELECT', () => {
    it('should map an empty SELECT to a single empty DataResult (no values array)', async () => {
      const dataResults = asDataResults(await dataApiClient.query(
        `SELECT name FROM ${TABLE} WHERE name = "missing-name"`,
      ))
      expect(dataResults.getFirstError()).toBeUndefined()
      // rqlite omits values when there are no rows; the client then yields one empty DataResult
      expect(dataResults.getResults()).toHaveLength(1)
      expect(dataResults.get(0)!.toObject()).toEqual({})
      expect(dataResults.toArray()).toEqual([{}])
    })

    it('should return multiple DataResult rows from a single SELECT', async () => {
      const dataResults = asDataResults(await dataApiClient.query(
        `SELECT name FROM ${TABLE} WHERE name IN ("ada", "grace", "alan") ORDER BY name`,
      ))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.toArray()).toEqual([
        { name: 'ada' },
        { name: 'alan' },
        { name: 'grace' },
      ])
    })
  })

  describe('SQL LIMIT and OFFSET paging', () => {
    beforeAll(async () => {
      await dataApiClient.execute(`DELETE FROM ${TABLE}`)
      const inserts = Array.from({ length: 5 }, (_v, i) => (
        `INSERT INTO ${TABLE}(name, age) VALUES("page-${i}", ${i})`
      ))
      const dataResults = asDataResults(await dataApiClient.execute(inserts, { atomic: true }))
      const insertError = dataResults.getFirstError()
      if (insertError) {
        throw insertError
      }
    })

    it('should page forward with LIMIT/OFFSET', async () => {
      const pageSize = 2
      const pages: string[][] = []
      for (let offset = 0; offset < 5; offset += pageSize) {
        const dataResults = asDataResults(await dataApiClient.query(
          `SELECT name FROM ${TABLE} ORDER BY age LIMIT ${pageSize} OFFSET ${offset}`,
        ))
        expect(dataResults.getFirstError()).toBeUndefined()
        pages.push(dataResults.toArray().map((row) => String(row.name)))
      }
      expect(pages).toEqual([
        ['page-0', 'page-1'],
        ['page-2', 'page-3'],
        ['page-4'],
      ])
    })
  })

  describe('read consistency levels', () => {
    const levels = [
      CONSISTENCY_LEVEL_NONE,
      CONSISTENCY_LEVEL_WEAK,
      CONSISTENCY_LEVEL_STRONG,
      CONSISTENCY_LEVEL_LINEARIZABLE,
    ]

    levels.forEach((level) => {
      it(`should query successfully with level=${level}`, async () => {
        const dataResults = asDataResults(await dataApiClient.query(
          `SELECT COUNT(*) AS total FROM ${TABLE}`,
          { level },
        ))
        expect(dataResults.getFirstError()).toBeUndefined()
        expect(Number(dataResults.get(0)!.get('total'))).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('raw timings and pretty options', () => {
    it('should return a raw HTTP response when raw is true', async () => {
      const response = asHttpResponse(await dataApiClient.query(
        `SELECT name FROM ${TABLE} ORDER BY age LIMIT 1`,
        { raw: true },
      ))
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('results')
    })

    it('should include timing fields when timings is true', async () => {
      const response = asHttpResponse(await dataApiClient.query(
        `SELECT name FROM ${TABLE} ORDER BY age LIMIT 1`,
        { raw: true, timings: true },
      ))
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('time')
    })

    it('should accept pretty and still return parseable results', async () => {
      const dataResults = asDataResults(await dataApiClient.query(
        `SELECT name FROM ${TABLE} ORDER BY age LIMIT 1`,
        { pretty: true },
      ))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('name')).toEqual('page-0')
    })
  })

  describe('statement errors', () => {
    it('should surface DataResultError and error_v2 for invalid SQL', async () => {
      const dataResults = asDataResults(await dataApiClient.execute(
        'INSERT INTO definitely_missing(name) VALUES("x")',
      ))
      expect(dataResults.hasError()).toBe(true)
      const error = dataResults.getFirstError()
      expect(error).toBeDefined()
      expect(error!.message.length).toBeGreaterThan(0)
      // rqlite 10+ includes structured error_v2
      expect(error!.getErrorV2()).toBeDefined()
      expect(error!.toObject()).toHaveProperty('error')
    })
  })
})

describe('api backups client', () => {
  const backupApiClient = new BackupApiClient(HOST, { httpAgent, httpsAgent })
  const dataApiClient = new DataApiClient(HOST, { httpAgent, httpsAgent })

  afterAll(async () => {
    await dataApiClient.execute('DROP TABLE IF EXISTS fooBackups')
    await dataApiClient.execute('DROP TABLE IF EXISTS fooRestore')
    await dataApiClient.execute('DROP TABLE IF EXISTS fooRestoreSql')
  })

  describe('backup database', () => {
    it(`should call ${HOST}${PATH_BACKUP} and get a binary dump stream`, async () => {
      const sql = 'CREATE TABLE fooBackups (id integer not null primary key, name text)'
      let dataResults = asDataResults(await dataApiClient.execute(sql))
      expect(dataResults.getFirstError()).toBeUndefined()
      dataResults = asDataResults(await dataApiClient.execute([
        'INSERT INTO fooBackups(name) VALUES("fiona")',
        'INSERT INTO fooBackups(name) VALUES("justin")',
      ], { atomic: true }))
      expect(dataResults.getFirstError()).toBeUndefined()
      const request = await backupApiClient.backup()
      const stream = await handleRequestStreamAsPromise(request)
      expect(stream.length).toBeGreaterThan(0)
    })

    it(`should call ${HOST}${PATH_BACKUP} with SQL format`, async () => {
      const request = await backupApiClient.backup(BACKUP_DATA_FORMAT_SQL)
      const stream = await handleRequestStreamAsPromise(request)
      const sqlText = stream.toString('utf8')
      expect(sqlText).toContain('CREATE TABLE')
      expect(sqlText.toLowerCase()).toContain('foobackups')
    })
  })

  describe('restore database', () => {
    it(`should call ${HOST}${PATH_LOAD} and send a SQLite backup stream`, async () => {
      const BACKUP_SQL_STATEMENTS = [
        'CREATE TABLE fooRestore (id integer not null primary key, name text)',
        'INSERT INTO fooRestore(name) VALUES ("fiona")',
        'INSERT INTO fooRestore(name) VALUES ("justin")',
      ]
      const sql = Buffer.from(BACKUP_SQL_STATEMENTS.join(';'))
      const request = await backupApiClient.load(sql)
      const { results } = JSON.parse((await handleRequestStreamAsPromise(request)).toString())
      expect(results[0].rows_affected).toEqual(1)
      const dataResults = asDataResults(await dataApiClient.query(
        'SELECT id, name FROM fooRestore WHERE name="fiona"',
        { level: CONSISTENCY_LEVEL_STRONG },
      ))
      const error = dataResults.getFirstError()
      if (error) {
        throw error
      }
      const dataResult = dataResults.get(0)
      expect(dataResult).toBeDefined()
      expect(dataResult!.get('id')).toEqual(1)
      expect(dataResult!.get('name')).toEqual('fiona')
    })

    it('should load SQL text format into a new table', async () => {
      const sqlText = [
        'CREATE TABLE fooRestoreSql (id integer not null primary key, name text);',
        'INSERT INTO fooRestoreSql(name) VALUES("loaded");',
      ].join('\n')
      const request = await backupApiClient.load(sqlText, BACKUP_DATA_FORMAT_SQL)
      await handleRequestStreamAsPromise(request)
      const dataResults = asDataResults(await dataApiClient.query(
        'SELECT name FROM fooRestoreSql WHERE name="loaded"',
      ))
      expect(dataResults.getFirstError()).toBeUndefined()
      expect(dataResults.get(0)!.get('name')).toEqual('loaded')
    })
  })
})
