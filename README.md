# rqlite-js &middot; [![npm version](https://img.shields.io/npm/v/rqlite-js.svg?style=flat)](https://www.npmjs.com/package/rqlite-js) &middot; [![Build Status](https://travis-ci.org/rqlite/rqlite-js.svg?branch=master)](https://travis-ci.org/rqlite/rqlite-js) &middot; [![Google Group](https://img.shields.io/badge/Google%20Group--blue.svg)](https://groups.google.com/group/rqlite)
A promise based client library for [rqlite](https://github.com/rqlite/rqlite), the lightweight, distribubted database built on SQLite.  This package is designed to provide a javascript classes with apis that line up with RQLite API endpoints.  Please note that there is no code in this package for writing SQL queries.  There are other Javascript SQL generator libraries such as [sequel](https://www.npmjs.com/package/sequel) which can be used to create the SQLite query strings.  You are welcome to use one of those libraries or write your own SQL queries directly in your code.

## DataApiClient
The data API client will allow you to access the basic CRUD operations of rqlite such as `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE` and `DROP TABLE`.  All data methods will return DataResults which is an array of DataResult instances.  The DataResult instances are designed to abstract working with the response body from RQLite endpoints.  If you want to work with the raw HTTP response instead of using the DataResults the options accepts a raw options which can be set to true.  This is covered in the examples below.

### DataApiClient Methods
The follow methods are available on the data API class including their function signatures.

* DataApiClient.select(sql, options) - `SELECT` based SQL statments
* DataApiClient.insert(sql, options) - `INSERT` based SQL statments
* DataApiClient.update(sql, options) - `UPDATE` based SQL statments
* DataApiClient.delete(sql, options) - `DELETE` based SQL statments
* DataApiClient.createTable(sql, options) - `CREATE TABLE` based SQL statments
* DataApiClient.dropTable(sql, options) - `DROP TABLE` based SQL statments
* DataApiClient.execute(sql, options) - Any sql statment not covered be the class nethods can be passed directly to execute

## DATA API Usage

### CREATE TABLE Example
The code sample shows how you would connect to a rqlite server and create a table.

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  // You can create your own raw SQL query or use another SQL generator library of your liking.
  const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
  const dataResults = await dataApiClient.createTable(sql)
  // Check the results for an error to make sure we the SQL query did
  // not generate an error while executing.
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite create tables results contained an error.')
    return
  }
  // We are successful and have results to use from our SQL query.
  console.log(dataResults.toString(), 'Checkout the rqlite results as a JSON string.')
  console.log(dataResults.toArray(), 'Checkout the rqlite results as plain javascript array for app use.')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```

### Multiple QUERY Example
The code sample shows how would connect to a rqlite server insert a row then select the row.

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
// Insert a row into the table foo we create above in the CREATE TABLE example.
// The values for sql can be a string or an array if you want to execute multiple
// SQL queries on the server.
let dataResults = await dataApiClient.insert('INSERT INTO foo(name) VALUES(\"fiona\")')
if (dataResults.hasError()) {
  const error = dataResults.getFirstError()
  console.error(error, 'rqlite insert results contained an error.')
  return
}
const id = dataResults.get(0).getLastInsertId()
const rowsAffected = dataResults.get(0).getRowsAffected()
dataResults = await dataApiClient.select(`SELECT name FROM foo WHERE id="${id}"`)
if (dataResults.hasError()) {
  const error = dataResults.getFirstError()
  console.error(error, 'rqlite select results contained an error.')
  return
}
console.log(dataResults.get(0).toString(), 'The value for the name field which should equal fiona')
console.log(dataResults.get(0).toObject(), 'rqlite results are great, but I just want to work with the data')
```

### Using transactions Example
The code sample shows how would connect to a rqlite and run multiple insert queries within a transaction [transactions](https://github.com/rqlite/rqlite/blob/master/DOC/DATA_API.md#transactions).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

const api = await connect('http://localhost:4001')
// Insert a row into the table foo we create above in the CREATE TABLE example.
// The values for sql can be a string or an array if you want to execute multiple
// SQL queries on the server.
 const sql = [
  'INSERT INTO foo(name) VALUES(\"fiona\")',
  'INSERT INTO bar(name) VALUES(\"test\")'
]
const res = await api.insert(sql, {transaction: true})
const results = res.body.results
if (getError(results)) {
  console.error('rqlite results contained an error.', error)
  return
}
console.log('The id for the first insert is in index 0 last_insert_id', results[0].last_insert_id)
console.log('The id for the second insert is in index 1 last_insert_id', results[1].last_insert_id)
```

### Multiple QUERY Example With Consistency
The code sample shows how would connect to a rqlite and run multiple select queries with [strong consistency](https://github.com/rqlite/rqlite/blob/master/DOC/CONSISTENCY.md).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

const api = await connect('http://localhost:4001')
const sql = [
  'SELECT name FROM foo WHERE id="1"',
  'SELECT id FROM bar WHERE name="test"'
]
const res = await api.select(sql, {level: 'strong'})
const results = res.body.results
if (getError(results)) {
  console.error('rqlite results contained an error.', error)
  return
}
console.log('The results for the first select are in index 0', results[0])
console.log('The results for the second select are in index 1', results[1])
```

### Keep Alive Example
The code sample shows how would pass a default `httpOptions` to all HTTP requests for `agentkeepalive` and set a different timeout.  Keepalive is something to be used in NodeJS, on the serverside only, since it is on by default in the browsers.  This will speed up requests on the server by re-using HTTP connections. See Agent keepalive for more details [https://www.npmjs.com/package/agentkeepalive](https://www.npmjs.com/package/agentkeepalive).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'
import Agent from 'agentkeepalive'
 
const keepaliveAgent = new Agent({
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketKeepAliveTimeout: 30000
})

const options = {
  url: 'http://localhost:4001',
  // httpOptions will now be applied to all HTTP requests, but can 
  // still be overridden per request inside of connect.
  httpOptions: {
    agent: keepaliveAgent,
    timeout: {
      deadline: 60000
    }
  }
}

const api = await connect(options)
// This is the same INSERT quert from above, but now it is sent over an HTTP connection
// that remains open for the next request.
const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
const resInsert = await api.insert(sql)
if (getError(resInsert.body.results)) {
  console.error('rqlite results contained an error.', error)
  return
}
const id = resInsert.body.results[0].last_insert_id
const sql = `SELECT name FROM foo WHERE id="${id}"`
// Override the options and turn off keepalive for just this request and change
// the timeout to 10 seconds.
const selectOptions = {
  httpOptions: {
    agent: undefined,
    timeout: {
      deadline: 10000
    }
  }
}
const res = await api.select(sql, selectOptions)
const results = res.body.results
const error = getError(results)
if (error) {
  console.error('rqlite results contained an error.', error)
  return
}
console.log('The value for the name field which should equal fiona', results[0].values[0])
console.log('rqlite results are great, but I just want to work with the data', toPlainJs(results))
```

### Authentication
Authentication can be passed either inline in the URL or via the httpOptions auth property and object of the form `{user, pass}`.

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

const user = 'rqliteUsername'
const pass = 'rqlitePassword'
// Notice how we just added the username and password to the URL
const url = `http://${user}:${pass}@localhost:4001`

// This object is equivalent to the url above.
/*
const options = {
  url: 'http://localhost:4001',
  httpOptions: {
    auth: {user, pass}
  }
}
*/
const api = await connect(url)
// You can create your own raw SQL query or use another SQL generator library of your liking.
const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
const res = await api.table.create(sql)
// We are given back the entire response object if anything is needed, otherwise
// the response body has our rqlite data.
const results = res.body.results
// Check the results for an error to make sure we the SQL query did
// not generate an error while executing.
const error = getError(results)
if (error) {
  console.error('rqlite results contained an error.', error)
  return
}
// We are successful and have results to use from our SQL query.
console.log('Checkout the rqlite results.', results)
console.log('Checkout the rqlite results as plain Js object for app use.', toPlainJs(results))
```

## Testing
Please see the [docs/test/README.md](docs/test/README.md) for more information.
